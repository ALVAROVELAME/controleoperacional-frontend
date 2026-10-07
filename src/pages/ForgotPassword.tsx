// src/pages/ForgotPassword.tsx
import { StatusView } from './Status';

export default function ForgotPassword() {
  return (
    <StatusView
      tipo="info"
      titulo="Recuperação de senha"
      mensagem="A recuperação de senha por e-mail ainda não está disponível nesta versão. Entre em contato com o suporte para redefinir seu acesso."
      detalhes="Suporte: contato@ctoperacional.app"
      ctaTexto="Voltar ao login"
      ctaLink="/login"
    />
  );
}