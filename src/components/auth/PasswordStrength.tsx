import '../../styles/auth/password-strength.css';

export default function PasswordStrength({ senha, id }: { senha: string; id: string }) {
  const forca = Number(senha.length >= 8) + Number(/[A-Z]/.test(senha)) + Number(/[0-9]/.test(senha)) + Number(/[^A-Za-z0-9]/.test(senha));
  const info = [
    { label: 'Muito fraca', cor: '#b91c1c' },
    { label: 'Fraca', cor: '#c2410c' },
    { label: 'Média', cor: '#a16207' },
    { label: 'Boa', cor: '#0ea5e9' },
    { label: 'Forte', cor: '#2563eb' },
  ][forca];
  const requisitos = [
    { ok: senha.length >= 6, texto: '6+ caracteres' },
    { ok: /[A-Z]/.test(senha), texto: '1 maiúscula' },
    { ok: /[0-9]/.test(senha), texto: '1 número' },
    { ok: /[^A-Za-z0-9]/.test(senha), texto: '1 símbolo' },
  ];
  return <div id={id}>
    <div className="sg-strength" role="progressbar" aria-valuenow={forca} aria-valuemin={0} aria-valuemax={4} aria-label={`Força da senha: ${info.label}`}>
      <div className="sg-strength-bar"><div className="sg-strength-fill" style={{ width: `${forca / 4 * 100}%`, background: info.cor }} /></div>
      <span className="sg-strength-label" style={{ color: info.cor }}>{info.label}</span>
    </div>
    <div className="sg-req-list">{requisitos.map(({ ok, texto }) => <span key={texto} className={`sg-req${ok ? ' is-ok' : ''}`} aria-live="polite"><span className="sg-req-dot" aria-hidden="true">{ok ? '✓' : ''}</span><span className="sr-only">{ok ? 'Atendido: ' : 'Não atendido: '}</span>{texto}</span>)}</div>
  </div>;
}
