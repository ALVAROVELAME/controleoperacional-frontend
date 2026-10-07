import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { EventoPomodoroLocal, ModoPomodoro } from '../services/pomodoro.service';

/* ------------------------------------------------------------------ *
 *  Pomodoro — arquivo independente
 *  Uso (no Dashboard):
 *    const pomodoro = usePomodoro({ onEvento: (e) => { ... } });
 *    <Pomodoro pomodoro={pomodoro} tarefas={...} tarefaId={...} onTarefaChange={...} />
 *    <PomodoroMini pomodoro={pomodoro} onAbrir={() => ...} />
 *  Herda as variáveis de cor do Dashboard (--surface, --brand, ...)
 *  e funciona sozinho se elas não existirem (usa valores padrão).
 * ------------------------------------------------------------------ */

export const POMODORO_STORAGE_KEY = 'ctoperacional:pomodoro';

export type { ModoPomodoro };

type Config = {
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
  /** Disparado a cada transição relevante do timer. */
  onEvento?: (evento: EventoPomodoroLocal) => void;
};

const ROTULO: Record<ModoPomodoro, string> = {
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

const formatar = (ms: number) => {
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

  const emitirEvento = useCallback((evento: EventoPomodoroLocal) => {
    try {
      callbacksRef.current.onEvento?.(evento);
    } catch {
      /* nunca deixa o callback quebrar o timer */
    }
  }, []);

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

  const iniciar = useCallback(() => {
    if (rodando) return;
    pedirNotificacao();
    const t = Date.now();
    setAgora(t);

    const total = totalMs;
    const jaRodou = Math.max(0, total - restanteMs);
    const retomando = jaRodou > 0;

    emitirEvento({
      tipo: retomando ? tipoRetomada(estado.modo) : tipoInicio(estado.modo),
      modo: estado.modo,
      ciclo: estado.ciclo,
      minutosPlanejados: Math.round(total / 60_000),
      minutosReais: Math.round(jaRodou / 60_000),
      segundosReais: Math.round(jaRodou / 1000),
      ocorridoEm: new Date().toISOString(),
    });

    setEstado((e) =>
      e.endsAt !== null
        ? e
        : { ...e, endsAt: t + (e.restanteMs > 0 ? e.restanteMs : duracaoMs(e.modo, config)) }
    );
  }, [rodando, estado.modo, estado.ciclo, totalMs, restanteMs, config, emitirEvento]);

  const pausar = useCallback(() => {
    if (!rodando) return;
    const t = Date.now();
    const restante = Math.max(0, (estado.endsAt as number) - t);
    const jaRodou = Math.max(0, totalMs - restante);

    emitirEvento({
      tipo: tipoPausa(estado.modo),
      modo: estado.modo,
      ciclo: estado.ciclo,
      minutosPlanejados: Math.round(totalMs / 60_000),
      minutosReais: Math.round(jaRodou / 60_000),
      segundosReais: Math.round(jaRodou / 1000),
      ocorridoEm: new Date().toISOString(),
    });

    setEstado((e) => (e.endsAt === null ? e : { ...e, restanteMs: restante, endsAt: null }));
  }, [rodando, estado.endsAt, estado.modo, estado.ciclo, totalMs, emitirEvento]);

  const alternar = useCallback(() => {
    if (rodando) pausar();
    else iniciar();
  }, [rodando, pausar, iniciar]);

  const reiniciar = useCallback(() => {
    if (rodando || restanteMs < totalMs) {
      const jaRodou = Math.max(0, totalMs - restanteMs);
      emitirEvento({
        tipo: tipoInterrupcao(estado.modo),
        modo: estado.modo,
        ciclo: estado.ciclo,
        minutosPlanejados: Math.round(totalMs / 60_000),
        minutosReais: Math.round(jaRodou / 60_000),
        segundosReais: Math.round(jaRodou / 1000),
        ocorridoEm: new Date().toISOString(),
      });
    }
    setEstado((e) => ({ ...e, restanteMs: duracaoMs(e.modo, config), endsAt: null }));
  }, [rodando, restanteMs, totalMs, estado.modo, estado.ciclo, config, emitirEvento]);

  const pular = useCallback(() => {
    if (rodando || restanteMs < totalMs) {
      const jaRodou = Math.max(0, totalMs - restanteMs);
      emitirEvento({
        tipo: tipoInterrupcao(estado.modo),
        modo: estado.modo,
        ciclo: estado.ciclo,
        minutosPlanejados: Math.round(totalMs / 60_000),
        minutosReais: Math.round(jaRodou / 60_000),
        segundosReais: Math.round(jaRodou / 1000),
        ocorridoEm: new Date().toISOString(),
      });
    }
    setEstado((e) => {
      const p = proximo(e, config);
      return { ...p, endsAt: e.endsAt !== null ? Date.now() + p.restanteMs : null };
    });
  }, [rodando, restanteMs, totalMs, estado.modo, estado.ciclo, config, emitirEvento]);

  const trocarModo = useCallback(
    (modo: ModoPomodoro) => {
      if (modo === estado.modo) return;
      const novaDuracao = duracaoMs(modo, config);
      emitirEvento({
        tipo: 'modo_alterado',
        modo,
        ciclo: estado.ciclo,
        minutosPlanejados: Math.round(novaDuracao / 60_000),
        minutosReais: 0,
        segundosReais: 0,
        ocorridoEm: new Date().toISOString(),
      });
      setEstado((e) => ({ ...e, modo, restanteMs: novaDuracao, endsAt: null }));
    },
    [estado.modo, estado.ciclo, config, emitirEvento]
  );

  /** Vai para o modo Foco e já inicia a contagem (usado ao "focar" em uma tarefa). */
  const focarAgora = useCallback(() => {
    if (rodando) return;
    pedirNotificacao();
    const t = Date.now();
    setAgora(t);

    const totalFoco = duracaoMs('foco', config);
    const mudandoModo = estado.modo !== 'foco';
    const continuar = estado.modo === 'foco' && estado.restanteMs > 0 && estado.restanteMs < totalFoco;
    const restante = continuar ? estado.restanteMs : totalFoco;
    const jaRodou = Math.max(0, totalFoco - restante);

    emitirEvento({
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
    });

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

/* ============================ ESTILOS ============================= */

const POMO_STYLES = `
.pomo {
  --pomo-cor: var(--brand, #2563eb);
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: var(--radius, 14px);
  padding: 18px;
  color: var(--ink, #0f172a);
  display: flex; flex-direction: column; gap: 14px;
}
.pomo--pausa_curta { --pomo-cor: var(--ok, #059669); }
.pomo--pausa_longa { --pomo-cor: var(--warn, #d97706); }
.pomo-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pomo-title { margin: 0; font-size: 14.5px; font-weight: 700; letter-spacing: -.01em; }
.pomo-today { font-size: 12.5px; color: var(--muted, #64748b); font-variant-numeric: tabular-nums; }
.pomo-modes {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px;
  background: var(--surface-2, #f1f5f9); border-radius: 10px;
}
.pomo-mode {
  border: 0; background: transparent; padding: 7px 4px; border-radius: 7px; cursor: pointer;
  font: inherit; font-size: 12.5px; font-weight: 600; color: var(--ink-soft, #334155);
}
.pomo-mode:hover { color: var(--ink, #0f172a); }
.pomo-mode[aria-pressed="true"] {
  background: var(--surface, #fff); color: var(--pomo-cor);
  box-shadow: 0 1px 2px rgba(0,0,0,.12);
}
.pomo-dial { position: relative; width: 190px; height: 190px; margin: 0 auto; }
.pomo-dial svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.pomo-ring-bg { stroke: var(--surface-3, #e2e8f0); }
.pomo-ring { stroke: var(--pomo-cor); transition: stroke-dashoffset .3s linear; }
.pomo-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
}
.pomo-time {
  font-size: 40px; font-weight: 800; letter-spacing: -.03em; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.pomo-label { font-size: 12.5px; font-weight: 600; color: var(--muted, #64748b); }
.pomo-dots { display: flex; justify-content: center; gap: 6px; }
.pomo-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--surface-3, #e2e8f0); border: 1.5px solid transparent;
}
.pomo-dot.is-done { background: var(--pomo-cor); }
.pomo-dot.is-current { border-color: var(--pomo-cor); background: transparent; }
.pomo-controls { display: flex; gap: 8px; }
.pomo-btn {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 12px; min-height: 42px; border-radius: 10px; cursor: pointer;
  font: inherit; font-size: 13.5px; font-weight: 600;
  border: 1.5px solid var(--border, #e2e8f0); background: var(--surface, #fff); color: var(--ink, #0f172a);
}
.pomo-btn:hover { border-color: var(--pomo-cor); color: var(--pomo-cor); }
.pomo-btn--main {
  flex: 2; background: var(--pomo-cor); border-color: var(--pomo-cor);
  color: var(--brand-ink, #fff);
}
.pomo-btn--main:hover { filter: brightness(1.08); color: var(--brand-ink, #fff); }
.pomo-btn--icon { flex: 0 0 42px; padding: 0; }
.pomo :focus-visible { outline: 3px solid var(--brand-2, #3b82f6); outline-offset: 2px; }
.pomo-field { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 600; color: var(--ink-soft, #334155); }
.pomo-select, .pomo-number {
  width: 100%; padding: 9px 10px; border-radius: 9px; font: inherit; font-size: 13.5px;
  background: var(--surface, #fff); color: var(--ink, #0f172a);
  border: 1.5px solid var(--border, #e2e8f0);
}
.pomo-config { border-top: 1px solid var(--border, #e2e8f0); padding-top: 12px; }
.pomo-config summary {
  cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ink-soft, #334155);
  list-style: none; display: flex; align-items: center; justify-content: space-between;
}
.pomo-config summary::-webkit-details-marker { display: none; }
.pomo-config-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
.pomo-check { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-top: 10px; cursor: pointer; }
.pomo-check input { width: 18px; height: 18px; accent-color: var(--pomo-cor); }
.pomo-mini {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; min-height: 40px;
  border-radius: 999px; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700;
  background: var(--brand-soft, #eff6ff); color: var(--brand, #2563eb);
  border: 1px solid var(--border, #e2e8f0); font-variant-numeric: tabular-nums;
}
.pomo-mini:hover { border-color: var(--brand, #2563eb); }
.pomo-mini:focus-visible { outline: 3px solid var(--brand-2, #3b82f6); outline-offset: 2px; }
.pomo-mini-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.pomo-mini.is-running .pomo-mini-dot { animation: pomoPulse 1.4s ease-in-out infinite; }
@keyframes pomoPulse { 50% { opacity: .25; } }
.pomo-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
  .pomo-ring { transition: none; }
  .pomo-mini.is-running .pomo-mini-dot { animation: none; }
}
`;

/* ========================== COMPONENTES =========================== */

type TarefaFoco = { id: string; titulo: string; status: string };

type PomodoroProps = {
  pomodoro: PomodoroControle;
  tarefas?: TarefaFoco[];
  tarefaId?: string | null;
  onTarefaChange?: (id: string | null) => void;
};

const RAIO = 84;
const CIRC = 2 * Math.PI * RAIO;

export function Pomodoro({ pomodoro: p, tarefas = [], tarefaId = null, onTarefaChange }: PomodoroProps) {
  const { estado, config, restanteMs, totalMs, rodando, dia } = p;
  const fracao = totalMs > 0 ? restanteMs / totalMs : 0;
  const elegiveis = tarefas.filter((t) => t.status !== 'concluido');
  const valor = tarefaId && elegiveis.some((t) => t.id === tarefaId) ? tarefaId : '';

  const numero = (campo: 'foco' | 'pausaCurta' | 'pausaLonga' | 'ciclos', min: number, max: number) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      if (Number.isNaN(v)) return;
      p.atualizarConfig({ [campo]: Math.min(max, Math.max(min, v)) } as Partial<Config>);
    };

  const feitos = estado.modo === 'foco' ? estado.ciclo - 1 : estado.ciclo;

  return (
    <section className={`pomo pomo--${estado.modo}`} aria-labelledby="pomo-titulo">
      <style>{POMO_STYLES}</style>

      <div className="pomo-head">
        <h2 className="pomo-title" id="pomo-titulo">🍅 Pomodoro</h2>
        <span className="pomo-today" title="Focos concluídos hoje">
          Hoje: {dia.focos} {dia.focos === 1 ? 'foco' : 'focos'} · {dia.minutos} min
        </span>
      </div>

      <div className="pomo-modes" role="group" aria-label="Modo do temporizador">
        {(Object.keys(ROTULO) as ModoPomodoro[]).map((m) => (
          <button
            key={m}
            type="button"
            className="pomo-mode"
            aria-pressed={estado.modo === m}
            onClick={() => p.trocarModo(m)}
          >
            {ROTULO[m]}
          </button>
        ))}
      </div>

      <div className="pomo-dial">
        <svg viewBox="0 0 190 190" aria-hidden="true">
          <circle className="pomo-ring-bg" cx="95" cy="95" r={RAIO} fill="none" strokeWidth="9" />
          <circle
            className="pomo-ring"
            cx="95"
            cy="95"
            r={RAIO}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fracao)}
          />
        </svg>
        <div className="pomo-center">
          <div
            className="pomo-time"
            role="timer"
            aria-label={`${ROTULO[estado.modo]}: ${formatar(restanteMs)} restantes`}
          >
            {formatar(restanteMs)}
          </div>
          <div className="pomo-label">{rodando ? ROTULO[estado.modo] : 'Pausado'}</div>
        </div>
      </div>

      <div className="pomo-dots" role="img" aria-label={`Ciclo ${estado.ciclo} de ${config.ciclos}`}>
        {Array.from({ length: config.ciclos }, (_, i) => (
          <span
            key={i}
            className={`pomo-dot${i < feitos ? ' is-done' : ''}${
              estado.modo === 'foco' && i === estado.ciclo - 1 ? ' is-current' : ''
            }`}
          />
        ))}
      </div>

      <div className="pomo-controls">
        <button
          type="button"
          className="pomo-btn pomo-btn--icon"
          onClick={p.reiniciar}
          aria-label="Reiniciar temporizador"
          title="Reiniciar"
        >
          <span aria-hidden="true">↺</span>
        </button>
        <button type="button" className="pomo-btn pomo-btn--main" onClick={p.alternar}>
          <span aria-hidden="true">{rodando ? '⏸' : '▶'}</span>
          {rodando ? 'Pausar' : restanteMs < totalMs ? 'Continuar' : 'Iniciar'}
        </button>
        <button
          type="button"
          className="pomo-btn pomo-btn--icon"
          onClick={p.pular}
          aria-label="Pular para a próxima etapa"
          title="Pular etapa"
        >
          <span aria-hidden="true">⏭</span>
        </button>
      </div>

      {onTarefaChange && (
        <label className="pomo-field">
          Tarefa em foco
          <select
            className="pomo-select"
            value={valor}
            onChange={(e) => onTarefaChange(e.target.value || null)}
          >
            <option value="">Nenhuma tarefa vinculada</option>
            {elegiveis.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>
        </label>
      )}

      <details className="pomo-config">
        <summary>
          Ajustes <span aria-hidden="true">⚙️</span>
        </summary>
        <div className="pomo-config-grid">
          <label className="pomo-field">
            Foco (min)
            <input className="pomo-number" type="number" min={1} max={120} value={config.foco} onChange={numero('foco', 1, 120)} />
          </label>
          <label className="pomo-field">
            Pausa curta (min)
            <input className="pomo-number" type="number" min={1} max={60} value={config.pausaCurta} onChange={numero('pausaCurta', 1, 60)} />
          </label>
          <label className="pomo-field">
            Pausa longa (min)
            <input className="pomo-number" type="number" min={1} max={120} value={config.pausaLonga} onChange={numero('pausaLonga', 1, 120)} />
          </label>
          <label className="pomo-field">
            Focos até a pausa longa
            <input className="pomo-number" type="number" min={2} max={8} value={config.ciclos} onChange={numero('ciclos', 2, 8)} />
          </label>
        </div>
        <label className="pomo-check">
          <input type="checkbox" checked={config.autoIniciar} onChange={(e) => p.atualizarConfig({ autoIniciar: e.target.checked })} />
          Iniciar a próxima etapa automaticamente
        </label>
        <label className="pomo-check">
          <input type="checkbox" checked={config.som} onChange={(e) => p.atualizarConfig({ som: e.target.checked })} />
          Tocar som ao terminar
        </label>
      </details>

      <div className="pomo-sr" role="status" aria-live="polite">
        {p.aviso}
      </div>
    </section>
  );
}

/** Indicador compacto para a barra superior: aparece quando há um timer em andamento ou pausado. */
export function PomodoroMini({ pomodoro: p, onAbrir }: { pomodoro: PomodoroControle; onAbrir?: () => void }) {
  if (!p.ativo) return null;
  return (
    <>
      <style>{POMO_STYLES}</style>
      <button
        type="button"
        className={`pomo-mini${p.rodando ? ' is-running' : ''}`}
        onClick={onAbrir}
        aria-label={`Pomodoro, ${ROTULO[p.estado.modo]}, ${formatar(p.restanteMs)} restantes. ${
          p.rodando ? 'Em andamento' : 'Pausado'
        }. Abrir.`}
      >
        <span className="pomo-mini-dot" aria-hidden="true" />
        {formatar(p.restanteMs)}
      </button>
    </>
  );
}

export default Pomodoro;