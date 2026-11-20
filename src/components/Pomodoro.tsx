import POMO_STYLES from '../styles/pomodoro.css?inline';
import type { ChangeEvent } from 'react';
import { formatar, ROTULO, type Config, type ContextoTarefa, type ModoPomodoro, type PomodoroControle } from '../hooks/usePomodoro';

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

  /**
   * Monta o contexto da tarefa em foco. Chamado ANTES de cada ação no
   * componente para que o evento já saia enriquecido — sem depender do
   * Dashboard usar refs ou qualquer coisa parecida.
   */
  const contextoAtual = (): ContextoTarefa | undefined => {
    if (!tarefaId) return undefined;
    const t = tarefas.find((x) => x.id === tarefaId);
    if (!t) return { tarefaId };
    return {
      tarefaId: t.id,
      tarefaTitulo: t.titulo,
      statusTarefa: t.status,
    };
  };

  const handleAlternar = () => p.alternar(contextoAtual());
  const handleReiniciar = () => p.reiniciar(contextoAtual());
  const handlePular = () => p.pular(contextoAtual());
  const handleTrocarModo = (m: ModoPomodoro) => p.trocarModo(m, contextoAtual());

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
            onClick={() => handleTrocarModo(m)}
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
          onClick={handleReiniciar}
          aria-label="Reiniciar temporizador"
          title="Reiniciar"
        >
          <span aria-hidden="true">↺</span>
        </button>
        <button type="button" className="pomo-btn pomo-btn--main" onClick={handleAlternar}>
          <span aria-hidden="true">{rodando ? '⏸' : '▶'}</span>
          {rodando ? 'Pausar' : restanteMs < totalMs ? 'Continuar' : 'Iniciar'}
        </button>
        <button
          type="button"
          className="pomo-btn pomo-btn--icon"
          onClick={handlePular}
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