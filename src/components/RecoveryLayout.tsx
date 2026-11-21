import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../styles/recovery.css';
export default function RecoveryLayout({ children }: { children: ReactNode }) {
  return <div className="recovery"><main className="recovery-card">
    <Link to="/" className="recovery-brand"><img src="/favicon.svg" alt="" /><span><b>Ct</b>Operacional</span></Link>
    {children}
  </main></div>;
}
