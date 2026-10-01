import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Animal } from '../types';

interface Props {
  animalEditando: Animal | null;
  onSalvar: (animal: Animal) => void;
  onCancelar: () => void;
}

const CATEGORIAS: Animal['categoria'][] = [
  'Bezerra',
  'Novilha',
  'Vaca em Lactação',
  'Vaca Seca',
];

const MAX_BRINCO = 20;
const MAX_NOME = 40;
const MAX_PRODUCAO = 200;

// ✅ producaoDiaria como `number | ''` para permitir campo vazio
type FormAnimal = {
  brinco: string;
  nome: string;
  categoria: Animal['categoria'];
  producaoDiaria: number | '';
};

const FORM_VAZIO: FormAnimal = {
  brinco: '',
  nome: '',
  categoria: 'Vaca em Lactação',
  producaoDiaria: '',
};

export default function AnimalForm({ animalEditando, onSalvar, onCancelar }: Props) {
  const [form, setForm] = useState<FormAnimal>(FORM_VAZIO);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submetido, setSubmetido] = useState(false);

  const brincoRef = useRef<HTMLInputElement>(null);

  // Sincroniza com o animal em edição e foca no primeiro campo
  useEffect(() => {
    if (animalEditando) {
      setForm({
        brinco: animalEditando.brinco,
        nome: animalEditando.nome,
        categoria: animalEditando.categoria,
        producaoDiaria: animalEditando.producaoDiaria,
      });
      setTouched({});
      setSubmetido(false);
      brincoRef.current?.focus();
    } else {
      setForm(FORM_VAZIO);
    }
  }, [animalEditando]);

  // ---------- Validação ----------
  const erros = useMemo(() => {
    const e: Partial<Record<keyof FormAnimal, string>> = {};

    if (!form.brinco.trim()) e.brinco = 'Brinco é obrigatório';
    else if (form.brinco.length > MAX_BRINCO)
      e.brinco = `Máximo de ${MAX_BRINCO} caracteres`;

    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    else if (form.nome.length > MAX_NOME)
      e.nome = `Máximo de ${MAX_NOME} caracteres`;

    if (form.producaoDiaria !== '') {
      if (form.producaoDiaria < 0) e.producaoDiaria = 'Não pode ser negativo';
      else if (form.producaoDiaria > MAX_PRODUCAO)
        e.producaoDiaria = `Valor irreal (> ${MAX_PRODUCAO} L)`;
    }

    return e;
  }, [form]);

  const formInvalido = Object.keys(erros).length > 0;

  const mostrarErro = (campo: keyof FormAnimal) =>
    (touched[campo] || submetido) && erros[campo];

  // ---------- Handlers ----------
  const atualizar = useCallback(
    <K extends keyof FormAnimal>(campo: K, valor: FormAnimal[K]) => {
      setForm((prev) => ({ ...prev, [campo]: valor }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmetido(true);
    if (formInvalido) return;

    // ✅ Converte '' para 0 apenas na hora de salvar
    const animal: Animal = {
      brinco: form.brinco.trim(),
      nome: form.nome.trim(),
      categoria: form.categoria,
      producaoDiaria: form.producaoDiaria === '' ? 0 : form.producaoDiaria,
      ...(animalEditando?.id !== undefined && { id: animalEditando.id }),
    };

    onSalvar(animal);
    setForm(FORM_VAZIO);
    setTouched({});
    setSubmetido(false);
    brincoRef.current?.focus();
  };

  const handleCancelar = () => {
    setForm(FORM_VAZIO);
    setTouched({});
    setSubmetido(false);
    onCancelar();
  };

  // Atalho: Esc cancela a edição
  useEffect(() => {
    if (!animalEditando) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [animalEditando]);

  return (
    <form onSubmit={handleSubmit} className="af-form" noValidate>
      {animalEditando && (
        <div className="af-badge">
          Editando: <strong>{animalEditando.nome}</strong> ({animalEditando.brinco})
        </div>
      )}

      <div className="af-grid">
        {/* Brinco */}
        <div className="af-field">
          <label htmlFor="brinco" className="af-label">
            Brinco *
            <span className="af-counter">
              {form.brinco.length}/{MAX_BRINCO}
            </span>
          </label>
          <input
            id="brinco"
            ref={brincoRef}
            placeholder="Ex.: A-1024"
            value={form.brinco}
            maxLength={MAX_BRINCO}
            onChange={(e) => atualizar('brinco', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, brinco: true }))}
            aria-invalid={!!mostrarErro('brinco')}
            className={`af-input${mostrarErro('brinco') ? ' is-error' : ''}`}
          />
          {mostrarErro('brinco') && (
            <span role="alert" className="af-error">
              {erros.brinco}
            </span>
          )}
        </div>

        {/* Nome */}
        <div className="af-field">
          <label htmlFor="nome" className="af-label">
            Nome *
            <span className="af-counter">
              {form.nome.length}/{MAX_NOME}
            </span>
          </label>
          <input
            id="nome"
            placeholder="Ex.: Mimosa"
            value={form.nome}
            maxLength={MAX_NOME}
            onChange={(e) => atualizar('nome', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
            aria-invalid={!!mostrarErro('nome')}
            className={`af-input${mostrarErro('nome') ? ' is-error' : ''}`}
          />
          {mostrarErro('nome') && (
            <span role="alert" className="af-error">
              {erros.nome}
            </span>
          )}
        </div>

        {/* Categoria */}
        <div className="af-field">
          <label htmlFor="categoria" className="af-label">
            Categoria
          </label>
          <select
            id="categoria"
            value={form.categoria}
            onChange={(e) =>
              atualizar('categoria', e.target.value as Animal['categoria'])
            }
            className="af-select"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Produção */}
        <div className="af-field">
          <label htmlFor="producaoDiaria" className="af-label">
            Produção Diária (L)
          </label>
          <input
            id="producaoDiaria"
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX_PRODUCAO}
            step={0.1}
            placeholder="Ex.: 18.5"
            /* ✅ value pode ser '' — não força zero */
            value={form.producaoDiaria}
            onChange={(e) => {
              const v = e.target.value;
              atualizar('producaoDiaria', v === '' ? '' : Number(v));
            }}
            onBlur={() => setTouched((t) => ({ ...t, producaoDiaria: true }))}
            aria-invalid={!!mostrarErro('producaoDiaria')}
            className={`af-input${mostrarErro('producaoDiaria') ? ' is-error' : ''}`}
          />
          {mostrarErro('producaoDiaria') && (
            <span role="alert" className="af-error">
              {erros.producaoDiaria}
            </span>
          )}
        </div>
      </div>

      <div className="af-actions">
        <button
          type="submit"
          disabled={formInvalido && submetido}
          className="af-btn af-btn--primary"
        >
          {animalEditando ? 'Salvar alterações' : 'Cadastrar animal'}
        </button>

        {animalEditando && (
          <button
            type="button"
            onClick={handleCancelar}
            className="af-btn af-btn--ghost"
          >
            Cancelar <kbd className="af-kbd">Esc</kbd>
          </button>
        )}
      </div>

      {!animalEditando && (
        <p className="af-hint">
          Dica: pressione <kbd className="af-kbd">Enter</kbd> para salvar rapidamente.
        </p>
      )}

      {/* ============================================================
          CSS escopado — usa as variáveis do Dashboard (--surface, --ink, etc.)
          ============================================================ */}
      <style>{`
        .af-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .af-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: var(--brand-soft, #dcf5e3);
          color: var(--brand, #14532d);
          border: 1px solid var(--border, #d8e2dc);
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 500;
          width: fit-content;
        }
        .af-badge strong {
          font-weight: 700;
          color: inherit;
        }

        .af-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .af-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .af-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--ink-soft, #2a4033);
          letter-spacing: .02em;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .af-counter {
          font-size: 11.5px;
          color: var(--muted, #3f5a48);
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .af-input,
        .af-select {
          width: 100%;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          color: var(--ink, #0a1810);
          background: var(--surface, #fff);
          border: 1.5px solid var(--border, #d8e2dc);
          border-radius: 10px;
          transition: border-color .15s, box-shadow .15s;
          outline: none;
        }
        .af-input::placeholder {
          color: var(--muted, #3f5a48);
          opacity: 1;
        }
        .af-input:hover,
        .af-select:hover {
          border-color: var(--border-strong, #b0c3b8);
        }
        .af-input:focus,
        .af-select:focus {
          outline: none;
          border-color: var(--brand, #14532d);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-2, #16a34a) 22%, transparent);
        }
        .af-input.is-error,
        .af-select.is-error {
          border-color: var(--danger, #991b1b);
        }
        .af-input.is-error:focus {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger, #991b1b) 18%, transparent);
        }
        .af-select {
          cursor: pointer;
        }

        .af-error {
          font-size: 12px;
          color: var(--danger, #991b1b);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .af-error::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        .af-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 6px;
        }

        .af-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: transform .12s, background .15s, border-color .15s, box-shadow .15s, color .15s;
          white-space: nowrap;
        }
        .af-btn--primary {
          background: var(--brand, #14532d);
          color: var(--brand-ink, #fff);
          box-shadow: 0 6px 16px -8px rgba(20,83,45,.5);
        }
        .af-btn--primary:hover:not(:disabled) {
          transform: translateY(-1px);
          background: var(--brand-3, #052e16);
          color: var(--brand-ink, #fff);
        }
        [data-theme="escuro"] .af-btn--primary:hover:not(:disabled) {
          background: #86efac;
          color: #052e16;
        }
        .af-btn--ghost {
          background: transparent;
          color: var(--brand, #14532d);
          border-color: var(--border, #d8e2dc);
        }
        .af-btn--ghost:hover:not(:disabled) {
          background: var(--brand-soft, #dcf5e3);
          border-color: var(--brand, #14532d);
        }
        [data-theme="escuro"] .af-btn--ghost {
          color: var(--brand-3, #a7f3b8);
        }
        [data-theme="escuro"] .af-btn--ghost:hover:not(:disabled) {
          color: var(--brand-3, #a7f3b8);
        }
        .af-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .af-kbd {
          display: inline-flex;
          align-items: center;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          font-family: inherit;
          background: var(--surface-2, #f2f6f4);
          border: 1px solid var(--border, #d8e2dc);
          color: var(--ink-soft, #2a4033);
        }

        .af-hint {
          margin: 0;
          font-size: 12.5px;
          color: var(--muted, #3f5a48);
          line-height: 1.5;
        }
      `}</style>
    </form>
  );
}