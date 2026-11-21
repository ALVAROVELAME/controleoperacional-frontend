import '../../styles/auth/carregamento.css';

export default function CarregandoSessao() {
  return (
    <div className="carregamento" role="status" aria-live="polite">
      <div className="carregamento-conteudo">
        <div className="carregamento-marca" aria-hidden="true">
          <span className="carregamento-anel" />
          <img src="/favicon.svg" alt="" />
        </div>
        <span className="carregamento-nome"><b>Ct</b>Operacional</span>
        <span className="carregamento-texto">Carregando…</span>
      </div>
    </div>
  );
}
