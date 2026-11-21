import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function RecoveryLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-6 font-[Inter,system-ui,sans-serif] text-slate-900">
    <main className="w-full max-w-[460px] rounded-[20px] border border-slate-200 bg-white p-10 shadow-[0_16px_45px_rgba(15,23,42,0.08)] max-[480px]:p-[26px] [&_h1]:mb-3 [&_h1]:text-[26px] [&_h1]:leading-[1.2] [&_p]:mb-6 [&_p]:leading-[1.6] [&_p]:text-slate-500 [&_form]:grid [&_form]:gap-[18px] [&_label]:grid [&_label]:gap-[7px] [&_label]:text-sm [&_label]:font-semibold [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-slate-300 [&_input]:p-[13px] [&_input]:font-normal [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-blue-400 [&_input:focus-visible]:outline-3 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-blue-400 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-blue-400">
      <Link to="/" className="mb-[34px] inline-flex items-center gap-2.5 text-lg text-slate-900 no-underline"><img className="size-[38px]" src="/favicon.svg" alt="" /><span><b>Ct</b>Operacional</span></Link>
      {children}
    </main>
  </div>;
}
