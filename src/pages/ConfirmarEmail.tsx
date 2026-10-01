import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { StatusView, type StatusOpcoes } from './Status';

/* ============================================================
   Mensagens por status HTTP
   ============================================================ */
function mensagemPorStatus(status?: number): string {
  switch (status) {
    case 400:
      return 'O link de confirmação está incompleto ou inválido.';
    case 401:
      return 'Este link expirou por segurança. Solicite um novo e-mail de confirmação.';
    case 404:
      return 'Não encontramos uma conta com este token.';
    case 409:
      return 'Este e-mail já foi confirmado. Você pode fazer login normalmente.';
    case 410:
      return 'Este link expirou. Solicite um novo e-mail de confirmação.';
    case 500:
    case 502:
    case 503:
      return 'Nosso servidor está temporariamente indisponível. Tente novamente em alguns instantes.';
    default:
      return 'Não foi possível confirmar agora. Verifique o link e tente novamente.';
  }
}

export default function ConfirmarEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<StatusOpcoes>({
    tipo: 'carregando',
    titulo: 'Confirmando seu e-mail…',
    mensagem: 'Aguarde um instante enquanto ativamos sua conta.',
  });

  useEffect(() => {
    if (!token) {
      setEstado({
        tipo: 'erro',
        titulo: 'Link incompleto',
        mensagem:
          'O link de confirmação está sem o token. Verifique o e-mail enviado e clique novamente.',
        ctaTexto: 'Voltar ao início',
        ctaLink: '/',
      });
      return;
    }

    setEstado({
      tipo: 'carregando',
      titulo: 'Confirmando seu e-mail…',
      mensagem: 'Aguarde um instante enquanto ativamos sua conta.',
    });

    const controller = new AbortController();

    api
      .get('/api/auth/confirmar', {
        params: { token },
        signal: controller.signal,
      })
      .then(() => {
        setEstado({
          tipo: 'sucesso',
          titulo: 'E-mail confirmado!',
          mensagem:
            'Sua conta está ativa. Agora você já pode fazer login e começar a usar o AgroGestor.',
          ctaTexto: 'Ir para o login',
          ctaLink: '/login',
          autoRedirect: 8,
          detalhes: 'Você será redirecionado automaticamente em instantes.',
        });
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;

        const status: number | undefined = err?.response?.status;
        const msgServidor: string | undefined = err?.response?.data?.mensagem;

        setEstado({
          tipo: 'erro',
          titulo:
            status === 409
              ? 'E-mail já confirmado'
              : 'Não foi possível confirmar',
          mensagem: msgServidor || mensagemPorStatus(status),
          detalhes:
            status === 401 || status === 410
              ? 'Dica: verifique se você está usando o link mais recente.'
              : undefined,
          ctaTexto: 'Voltar ao início',
          ctaLink: '/',
          onRetry: () => setTentativa((t) => t + 1),
          retryTexto: 'Tentar novamente',
        });
      });

    return () => controller.abort();
  }, [token, tentativa]);

  return <StatusView {...estado} />;
}