export default function CarregandoSessao() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center gap-[10px] text-[14px] text-[#64748b] [font-family:system-ui,sans-serif]">
      <span aria-hidden="true" className="size-4 animate-spin [animation-duration:0.8s] rounded-full border-2 border-solid border-[#dbeafe] border-t-[#2563eb]" />
      Carregando…
    </div>
  );
}
