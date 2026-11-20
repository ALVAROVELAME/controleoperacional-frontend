import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventoPomodoroLocal, ModoPomodoro } from '../services/pomodoro.service';

/* ------------------------------------------------------------------ *
 *  Pomodoro — arquivo independente
 *  Uso (no Dashboard):
 *    const pomodoro = usePomodoro({
 *      onEvento: (e, contexto) => { ... }   // contexto agora é opcional
 *    });
 *    <Pomodoro pomodoro={pomodoro} tarefas={...} tarefaId={...} onTarefaChange={...} />
 *    <PomodoroMini pomodoro={pomodoro} onAbrir={() => ...} />
 *
 *  Contexto de tarefa:
 *    Toda ação aceita um `ContextoTarefa` opcional:
 *      p.iniciar({ tarefaId, tarefaTitulo, statusTarefa })
 *      p.focarAgora({ tarefaId, tarefaTitulo, statusTarefa })
 *    O contexto é propagado para `onEvento(evento, contexto)` e
 *    guardado em ref para eventos que acontecem depois (ex: concluir).
 *  Herda as variáveis de cor do Dashboard (--surface, --brand, ...)
 *  e funciona sozinho se elas não existirem (usa valores padrão).
 * ------------------------------------------------------------------ */

export const POMODORO_STORAGE_KEY = 'ctoperacional:pomodoro';

export type { ModoPomodoro };

/** Contexto opcional de tarefa anexado aos eventos. */
export type ContextoTarefa = {
  tarefaId?: string | null;
  tarefaTitulo?: string | null;
  statusTarefa?: string | null;
};

export type Config = {
  foco: number;
  pausaCurta: number;
  pausaLonga: number;
  ciclos: number;
  autoIniciar: boolean;
  som: boolean;
};
type Estado = {
  modo: ModoPomodoro;
  ciclo: number;
  restanteMs: number;
  endsAt: number | null;
};
type Dia = { data: string; focos: number; minutos: number };
type Persistido = { config: Config; estado: Estado; dia: Dia };

export type PomodoroControle = ReturnType<typeof usePomodoro>;

export type CallbacksPomodoro = {
  /**
   * Disparado a cada transição relevante do timer.
   * O `contexto` é o último contexto conhecido (o que foi passado
   * na ação mais recente, ou o que estava guardado quando o timer
   * começou — importante para eventos automáticos como `concluir`).
   */
  onEvento?: (evento: EventoPomodoroLocal, contexto?: ContextoTarefa) => void;
};

export const ROTULO: Record<ModoPomodoro, string> = {
  foco: 'Foco',
  pausa_curta: 'Pausa curta',
  pausa_longa: 'Pausa longa',
};

const CONFIG_PADRAO: Config = {
  foco: 25,
  pausaCurta: 5,
  pausaLonga: 15,
  ciclos: 4,
  autoIniciar: false,
  som: true,
};

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const duracaoMs = (modo: ModoPomodoro, cfg: Config) =>
  (modo === 'foco' ? cfg.foco : modo === 'pausa_curta' ? cfg.pausaCurta : cfg.pausaLonga) * 60_000;

export const formatar = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const limitar = (n: unknown, min: number, max: number, padrao: number) => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : padrao;
  return Math.min(max, Math.max(min, v));
};

/** Converte "foco_interrompido" a partir do modo atual. */
const tipoInterrupcao = (modo: ModoPomodoro) =>
  modo === 'foco' ? 'foco_interrompido' : 'pausa_interrompida';
const tipoInicio = (modo: ModoPomodoro) =>
  modo === 'foco' ? 'foco_iniciado' : 'pausa_iniciada';
const tipoRetomada = (modo: ModoPomodoro) =>
  modo === 'foco' ? 'foco_retomado' : 'pausa_retomada';
const tipoPausa = (modo: ModoPomodoro) =>
  modo === 'foco' ? 'foco_pausado' : 'pausa_pausada';
const tipoCompletou = (modo: ModoPomodoro) =>
  modo === 'foco' ? 'foco_completado' : 'pausa_completada';

function carregar(): Persistido {
  const estadoInicial = (cfg: Config): Estado => ({
    modo: 'foco',
    ciclo: 1,
    restanteMs: duracaoMs('foco', cfg),
    endsAt: null,
  });
  const vazio: Persistido = {
    config: CONFIG_PADRAO,
    estado: estadoInicial(CONFIG_PADRAO),
    dia: { data: hoje(), focos: 0, minutos: 0 },
  };
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return vazio;
    const p = JSON.parse(raw) as Partial<Persistido>;
    const c = (p.config ?? {}) as Partial<Config>;
    const config: Config = {
      foco: limitar(c.foco, 1, 120, 25),
      pausaCurta: limitar(c.pausaCurta, 1, 60, 5),
      pausaLonga: limitar(c.pausaLonga, 1, 120, 15),
      ciclos: limitar(c.ciclos, 2, 8, 4),
      autoIniciar: c.autoIniciar === true,
      som: c.som !== false,
    };
    const e = (p.estado ?? {}) as Partial<Estado>;
    const modo: ModoPomodoro =
      e.modo === 'pausa_curta' || e.modo === 'pausa_longa' ? e.modo : 'foco';
    const total = duracaoMs(modo, config);
    const estado: Estado = {
      modo,
      ciclo: limitar(e.ciclo, 1, config.ciclos, 1),
      restanteMs: limitar(e.restanteMs, 0, total, total),
      endsAt: typeof e.endsAt === 'number' ? e.endsAt : null,
    };
    const d = (p.dia ?? {}) as Partial<Dia>;
    const dia: Dia =
      d.data === hoje()
        ? { data: hoje(), focos: limitar(d.focos, 0, 999, 0), minutos: limitar(d.minutos, 0, 99999, 0) }
        : vazio.dia;
    return { config, estado, dia };
  } catch {
    return vazio;
  }
}

function proximo(e: Estado, cfg: Config): Estado {
  let modo: ModoPomodoro;
  let ciclo = e.ciclo;
  if (e.modo === 'foco') {
    modo = e.ciclo >= cfg.ciclos ? 'pausa_longa' : 'pausa_curta';
  } else {
    modo = 'foco';
    ciclo = e.modo === 'pausa_longa' ? 1 : Math.min(e.ciclo + 1, cfg.ciclos);
  }
  return { modo, ciclo, restanteMs: duracaoMs(modo, cfg), endsAt: null };
}

function tocarSom() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.25].forEach((atraso) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.0001, ctx.currentTime + atraso);
      ganho.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + atraso + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + atraso + 0.2);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(ctx.currentTime + atraso);
      osc.stop(ctx.currentTime + atraso + 0.22);
    });
    setTimeout(() => ctx.close().catch(() => undefined), 800);
  } catch {
    /* som é opcional */
  }
}

function notificar(titulo: string, corpo: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, { body: corpo });
    }
  } catch {
    /* notificação é opcional */
  }
}

function pedirNotificacao() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  } catch {
    /* ignore */
  }
}

/* ============================== HOOK ============================== */

export function usePomodoro(callbacks: CallbacksPomodoro = {}) {
  const [inicial] = useState(carregar);
  const [config, setConfig] = useState<Config>(inicial.config);
  const [estado, setEstado] = useState<Estado>(inicial.estado);
  const [dia, setDia] = useState<Dia>(inicial.dia);
  const [agora, setAgora] = useState(() => Date.now());
  const [aviso, setAviso] = useState('');

  // Mantém os callbacks sempre atualizados (sem recriar handlers)
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  /**
   * Último contexto conhecido (tarefa em foco). Guardado em ref para
   * que eventos disparados DEPOIS (como `concluir`, que roda no fim do
   * timer) também carreguem o contexto correto.
   */
  const contextoRef = useRef<ContextoTarefa | undefined>(undefined);

  const emitirEvento = useCallback(
    (evento: EventoPomodoroLocal, contexto?: ContextoTarefa) => {
      try {
        // Se a ação não passou contexto, usa o último guardado (fallback)
        const ctx = contexto ?? contextoRef.current;
        callbacksRef.current.onEvento?.(evento, ctx);
      } catch {
        /* nunca deixa o callback quebrar o timer */
      }
    },
    []
  );

  const ultimoFimRef = useRef<number | null>(null);

  const rodando = estado.endsAt !== null;
  const totalMs = duracaoMs(estado.modo, config);
  const restanteMs = rodando ? Math.max(0, (estado.endsAt as number) - agora) : estado.restanteMs;
  const ativo = rodando || restanteMs < totalMs;

  // Persistência
  useEffect(() => {
    try {
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify({ config, estado, dia }));
    } catch {
      /* ignore */
    }
  }, [config, estado, dia]);

  // Relógio (baseado em timestamp: continua correto com a aba em segundo plano)
  useEffect(() => {
    if (!rodando) return;
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [rodando]);

  const concluir = useCallback(() => {
    const eraFoco = estado.modo === 'foco';
    const modoConcluido = estado.modo;
    const totalConcluido = duracaoMs(modoConcluido, config);
    const prox = proximo(estado, config);
    const iniciarAuto = config.autoIniciar;

    // ⚠️ Evento automático: NÃO recebe contexto novo, mas usa o último
    // guardado (o da ação que iniciou o timer). Isso garante que o
    // `foco_completado` carregue o mesmo `tarefaId` do `foco_iniciado`.
    emitirEvento({
      tipo: tipoCompletou(modoConcluido),
      modo: modoConcluido,
      ciclo: estado.ciclo,
      minutosPlanejados: Math.round(totalConcluido / 60_000),
      minutosReais: Math.round(totalConcluido / 60_000),
      segundosReais: Math.round(totalConcluido / 1000),
      ocorridoEm: new Date().toISOString(),
    });

    setEstado({ ...prox, endsAt: iniciarAuto ? Date.now() + prox.restanteMs : null });

    if (eraFoco) {
      setDia((d) => {
        const base = d.data === hoje() ? d : { data: hoje(), focos: 0, minutos: 0 };
        return { ...base, focos: base.focos + 1, minutos: base.minutos + config.foco };
      });
    }
    const msg = eraFoco
      ? `Foco concluído. Hora da ${ROTULO[prox.modo].toLowerCase()}.`
      : 'Pausa concluída. Hora de focar.';
    setAviso(msg);
    notificar('CtOperacional · Pomodoro', msg);
    if (config.som) tocarSom();
  }, [estado, config, emitirEvento]);

  useEffect(() => {
    if (!rodando || restanteMs > 0) return;
    if (ultimoFimRef.current === estado.endsAt) return;
    ultimoFimRef.current = estado.endsAt;
    concluir();
  }, [rodando, restanteMs, estado.endsAt, concluir]);

  // Tempo restante no título da aba
  useEffect(() => {
    if (!rodando) return;
    const original = document.title;
    document.title = `${formatar(restanteMs)} · ${ROTULO[estado.modo]}`;
    return () => {
      document.title = original;
    };
  }, [rodando, restanteMs, estado.modo]);

  const iniciar = useCallback((contexto?: ContextoTarefa) => {
    if (rodando) return;
    if (contexto) contextoRef.current = contexto;
    pedirNotificacao();
    const t = Date.now();
    setAgora(t);

    const total = totalMs;
    const jaRodou = Math.max(0, total - restanteMs);
    const retomando = jaRodou > 0;

    emitirEvento(
      {
        tipo: retomando ? tipoRetomada(estado.modo) : tipoInicio(estado.modo),
        modo: estado.modo,
        ciclo: estado.ciclo,
        minutosPlanejados: Math.round(total / 60_000),
        minutosReais: Math.round(jaRodou / 60_000),
        segundosReais: Math.round(jaRodou / 1000),
        ocorridoEm: new Date().toISOString(),
      },
      contexto
    );

    setEstado((e) =>
      e.endsAt !== null
        ? e
        : { ...e, endsAt: t + (e.restanteMs > 0 ? e.restanteMs : duracaoMs(e.modo, config)) }
    );
  }, [rodando, estado.modo, estado.ciclo, totalMs, restanteMs, config, emitirEvento]);

  const pausar = useCallback((contexto?: ContextoTarefa) => {
    if (!rodando) return;
    if (contexto) contextoRef.current = contexto;
    const t = Date.now();
    const restante = Math.max(0, (estado.endsAt as number) - t);
    const jaRodou = Math.max(0, totalMs - restante);

    emitirEvento(
      {
        tipo: tipoPausa(estado.modo),
        modo: estado.modo,
        ciclo: estado.ciclo,
        minutosPlanejados: Math.round(totalMs / 60_000),
        minutosReais: Math.round(jaRodou / 60_000),
        segundosReais: Math.round(jaRodou / 1000),
        ocorridoEm: new Date().toISOString(),
      },
      contexto
    );

    setEstado((e) => (e.endsAt === null ? e : { ...e, restanteMs: restante, endsAt: null }));
  }, [rodando, estado.endsAt, estado.modo, estado.ciclo, totalMs, emitirEvento]);

  const alternar = useCallback((contexto?: ContextoTarefa) => {
    if (rodando) pausar(contexto);
    else iniciar(contexto);
  }, [rodando, pausar, iniciar]);

  const reiniciar = useCallback((contexto?: ContextoTarefa) => {
    if (rodando || restanteMs < totalMs) {
      const jaRodou = Math.max(0, totalMs - restanteMs);
      emitirEvento(
        {
          tipo: tipoInterrupcao(estado.modo),
          modo: estado.modo,
          ciclo: estado.ciclo,
          minutosPlanejados: Math.round(totalMs / 60_000),
          minutosReais: Math.round(jaRodou / 60_000),
          segundosReais: Math.round(jaRodou / 1000),
          ocorridoEm: new Date().toISOString(),
        },
        contexto
      );
    }
    setEstado((e) => ({ ...e, restanteMs: duracaoMs(e.modo, config), endsAt: null }));
  }, [rodando, restanteMs, totalMs, estado.modo, estado.ciclo, config, emitirEvento]);

  const pular = useCallback((contexto?: ContextoTarefa) => {
    if (rodando || restanteMs < totalMs) {
      const jaRodou = Math.max(0, totalMs - restanteMs);
      emitirEvento(
        {
          tipo: tipoInterrupcao(estado.modo),
          modo: estado.modo,
          ciclo: estado.ciclo,
          minutosPlanejados: Math.round(totalMs / 60_000),
          minutosReais: Math.round(jaRodou / 60_000),
          segundosReais: Math.round(jaRodou / 1000),
          ocorridoEm: new Date().toISOString(),
        },
        contexto
      );
    }
    setEstado((e) => {
      const p = proximo(e, config);
      return { ...p, endsAt: e.endsAt !== null ? Date.now() + p.restanteMs : null };
    });
  }, [rodando, restanteMs, totalMs, estado.modo, estado.ciclo, config, emitirEvento]);

  const trocarModo = useCallback(
    (modo: ModoPomodoro, contexto?: ContextoTarefa) => {
      if (modo === estado.modo) return;
      if (contexto) contextoRef.current = contexto;
      const novaDuracao = duracaoMs(modo, config);
      emitirEvento(
        {
          tipo: 'modo_alterado',
          modo,
          ciclo: estado.ciclo,
          minutosPlanejados: Math.round(novaDuracao / 60_000),
          minutosReais: 0,
          segundosReais: 0,
          ocorridoEm: new Date().toISOString(),
        },
        contexto
      );
      setEstado((e) => ({ ...e, modo, restanteMs: novaDuracao, endsAt: null }));
    },
    [estado.modo, estado.ciclo, config, emitirEvento]
  );

  /** Vai para o modo Foco e já inicia a contagem (usado ao "focar" em uma tarefa). */
  const focarAgora = useCallback((contexto?: ContextoTarefa) => {
    if (rodando) return;
    if (contexto) contextoRef.current = contexto;
    pedirNotificacao();
    const t = Date.now();
    setAgora(t);

    const totalFoco = duracaoMs('foco', config);
    const mudandoModo = estado.modo !== 'foco';
    const continuar = estado.modo === 'foco' && estado.restanteMs > 0 && estado.restanteMs < totalFoco;
    const restante = continuar ? estado.restanteMs : totalFoco;
    const jaRodou = Math.max(0, totalFoco - restante);

    emitirEvento(
      {
        tipo: mudandoModo
          ? 'modo_alterado'
          : continuar
            ? tipoRetomada('foco')
            : tipoInicio('foco'),
        modo: 'foco',
        ciclo: estado.ciclo,
        minutosPlanejados: Math.round(totalFoco / 60_000),
        minutosReais: Math.round(jaRodou / 60_000),
        segundosReais: Math.round(jaRodou / 1000),
        ocorridoEm: new Date().toISOString(),
      },
      contexto
    );

    setEstado((e) => ({
      ...e,
      modo: 'foco',
      restanteMs: continuar ? e.restanteMs : totalFoco,
      endsAt: t + (continuar ? e.restanteMs : totalFoco),
    }));
  }, [rodando, estado.modo, estado.ciclo, estado.restanteMs, config, emitirEvento]);

  const atualizarConfig = useCallback(
    (parcial: Partial<Config>) => {
      const nova = { ...config, ...parcial };
      setConfig(nova);
      setEstado((e) =>
        e.endsAt === null
          ? { ...e, ciclo: Math.min(e.ciclo, nova.ciclos), restanteMs: duracaoMs(e.modo, nova) }
          : { ...e, ciclo: Math.min(e.ciclo, nova.ciclos) }
      );
    },
    [config]
  );

  const zerarDia = useCallback(() => {
    setDia({ data: hoje(), focos: 0, minutos: 0 });
  }, []);

  return {
    config,
    estado,
    dia,
    aviso,
    rodando,
    ativo,
    totalMs,
    restanteMs,
    iniciar,
    pausar,
    alternar,
    reiniciar,
    pular,
    trocarModo,
    focarAgora,
    atualizarConfig,
    zerarDia,
  };
}

