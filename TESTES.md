# Testes do frontend

A suíte usa Vitest, React Testing Library, user-event, jsdom e axios-mock-adapter. O servidor real não é acessado. A cobertura V8 gera relatório em `coverage/index.html`.

```bash
npm install
npm test                # execução única
npm run test:watch      # desenvolvimento
npm run test:coverage   # relatório de cobertura
npm run build           # verificação TypeScript e build
```

## Inventário de cenários

- **Autenticação e rotas:** sessão ausente ou expirada, token antigo, login, erro de credenciais, persistência, saída, sincronização entre abas, falhas de rede e proteção de rotas.
- **Cadastro e confirmação:** validação de campos, aceite dos termos, cadastro, erros da API, token ausente/expirado, confirmação e redirecionamento.
- **Tarefas:** leitura, criação, edição, exclusão, movimentação, importação, limpeza e registro de pomodoro; tratamento de erro, reversão de alterações otimistas, cache, isolamento entre contas e recuperação offline.
- **Contratos:** serialização de payloads, identificadores codificados, enums da API, dados incompletos, erros de validação e autenticação.
- **Pomodoro:** iniciar, pausar, retomar, reiniciar, mudar modo, terminar ciclos, configurações, persistência e recuperação após recarga.
- **Interface:** navegação institucional e legal, mensagens de status, links, formulários, busca, filtros, modais, atalhos e ações destrutivas.
- **Qualidade no navegador:** teclado, foco, leitores de tela, responsividade, diferentes navegadores, download/upload e integração com backend real.

## Cobertura implementada e próximos passos

A suíte cobre autenticação e recuperação de senha, confirmação de e-mail, contratos HTTP, normalização e operações de tarefas, incluindo falhas e cache offline. Também verifica conclusão, retomada e persistência do Pomodoro e as interações de menu e pausa na página inicial. Consulte o relatório para detalhes por arquivo; a lista acima é um inventário, não uma afirmação de cobertura completa.

Os testes de autenticação ficam em `tests/auth/`, os de tarefas e mapeamento em `tests/tarefas/`; os testes compartilhados e de outros fluxos permanecem na raiz de `tests/`.

Os demais cenários continuam pendentes, incluindo a cobertura direta da interface do dashboard e das páginas legais, além de testes de ponta a ponta em navegadores reais (por exemplo, Playwright com uma API de teste controlada), acessibilidade automatizada e fluxos completos do dashboard e do Pomodoro. Testes em jsdom não validam layout, rendering real, nem o contrato com o backend implantado.
