<div align="center">

# 📋 CtOperacional

### Controle operacional e Kanban para equipes que precisam de clareza e velocidade

Organize tarefas, acompanhe o fluxo de trabalho e mantenha sua equipe alinhada com um quadro Kanban moderno — com Pomodoro integrado.

[![Vercel](https://img.shields.io/badge/deploy-vercel-000?logo=vercel&logoColor=white)](https://controle-operacional.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-0284c7)](https://tailwindcss.com)

[🌐 Ver online](https://controle-operacional.vercel.app) · [🐛 Reportar bug](https://github.com/ALVAROVELAME/controleoperacional-frontend/issues) · [💡 Sugerir feature](https://github.com/ALVAROVELAME/controleoperacional-frontend/issues)

</div>

---

## 📖 Sobre o projeto

O **CtOperacional** é uma aplicação web de **controle operacional e gestão de tarefas no modelo Kanban**, construída com foco em **simplicidade, performance e acessibilidade**. Substitui planilhas e listas dispersas por um quadro visual que roda direto no navegador — computador, tablet ou celular.

### Por que existe

Equipes perdem tempo tentando descobrir "o que está sendo feito", "por quem" e "em que etapa". O CtOperacional centraliza tudo em um único quadro: quatro colunas, cards com prioridade, prazo, descrição e ciclos de foco (Pomodoro), com sincronização automática na nuvem.

### Diferenciais

- ⚡ **Rápido** — Vite + React 19, com carregamento do dashboard sob demanda
- 🌗 **Tema claro e escuro** — com preferência salva no navegador
- ♿ **Acessível** — navegação por teclado, atributos ARIA, `prefers-reduced-motion`
- 📱 **Responsivo** — quadro com scroll horizontal, drawer mobile, KPIs em grade 2×2
- 🎨 **Design System** próprio — variáveis CSS, sem dependências de UI
- 🍅 **Pomodoro integrado** — timer acoplado às tarefas, com histórico diário
- 🔒 **Seguro** — JWT com interceptor de 401, senha em hash no backend

---

## ✨ Funcionalidades

### Autenticação

- ✅ Cadastro com validação em tempo real (nome, e-mail, senha e confirmação)
- ✅ Força da senha visual + checklist de requisitos (`aria-live`)
- ✅ Login com controle de visibilidade da senha. O link “Esqueci minha senha” orienta o contato com o suporte; a redefinição automática por e-mail está pendente.
- ✅ Confirmação de e-mail por token com **retry**, contagem regressiva e mensagens por status HTTP
- ✅ Rota `/status` genérica para feedback visual reutilizável
- ✅ Exclusão de conta com confirmação por senha

### Dashboard (4 abas)

| Aba | Recursos |
|---|---|
| **Quadro** | Kanban com 4 colunas (A fazer, Em progresso, Revisão, Concluído), drag & drop, criação inline por coluna, KPIs (total, em progresso, concluídas, atrasadas) e painel lateral de foco |
| **Lista** | Tabela detalhada com edição inline de status, filtros (busca, status, prioridade) e ordenação |
| **Relatórios** | KPIs de conclusão, atrasos, pomodoros e foco do dia; distribuição por status e por prioridade |
| **Configurações** | Alternar tema, exportar/importar JSON, logout, zerar tarefas, zona de perigo |

### Recursos transversais

- 🎯 **Command Palette** (`Ctrl+K`) com navegação por teclado (`↑ ↓ Enter Esc`)
- 🔍 Busca de tarefas em tempo real dentro da palette
- 🌙 **Detecção automática** do tema do SO (`prefers-color-scheme`)
- 🍞 **Toasts empilhados** com dismiss, ícones, ação (Desfazer) e `aria-live`
- 💾 **Backup local** em JSON (exportar/importar)
- 📊 **Focus trap** em modais e palette
- 🚫 **Body scroll lock** quando overlays estão abertos
- ⌨️ **Atalhos de teclado**: `N` (nova tarefa), `/` (buscar), `P` (Pomodoro), `Ctrl+Enter` (salvar no editor)
- 🖨️ **Estilos de impressão** limpos nos documentos legais

### Pomodoro integrado

- 🍅 Timer foco / pausa curta / pausa longa com configurações ajustáveis
- 📌 Vinculação opcional a uma tarefa (marca automaticamente como "em progresso")
- 🔔 Notificação do navegador + som (Web Audio) ao concluir
- 📊 Contador diário de focos e minutos (`localStorage`)
- 🎯 Indicador compacto na barra superior quando o timer está ativo

### Documentos legais

- 📄 **Termos de Uso** — 11 seções
- 🔐 **Política de Privacidade** — 12 seções, em conformidade com a **LGPD**
- 📑 **Índice lateral fixo** com seção ativa detectada via `IntersectionObserver`
- 📊 **Barra de progresso de leitura** no topo
- ⬆️ Botão "Voltar ao topo" com fade

---

## 🛠 Stack técnica

### Core

| Tecnologia | Versão | Uso |
|---|---|---|
| [React](https://react.dev) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Tipos de domínio e contratos da API |
| [Vite](https://vite.dev) | 7 | Build e dev server |
| [React Router](https://reactrouter.com) | 7 | Roteamento SPA |
| [Axios](https://axios-http.com) | 1.x | Cliente HTTP |

### Estilos e qualidade

O Vite compila o Tailwind CSS 4 com o plugin `@tailwindcss/vite`. O ponto de entrada é [src/index.css](./src/index.css), que importa o tema e os utilitários e mantém o reset próprio do projeto. As folhas em [src/styles](./src/styles) usam CSS e `@apply`. Os componentes importam essas folhas com `?inline` e aplicam os estilos quando a tela é renderizada.

O ESLint 9 usa configuração plana com regras de TypeScript, React Hooks e Fast Refresh. A suíte usa Vitest, React Testing Library e jsdom com respostas HTTP simuladas pelo axios-mock-adapter.

## 📁 Estrutura do projeto

| Caminho | Responsabilidade |
|---|---|
| `public/` | Favicon, logotipo e imagem de compartilhamento |
| `src/pages/`, `src/App.tsx` | Telas e rotas da aplicação |
| `src/components/` | Componentes de interface, ícones e proteção de rotas |
| `src/contexts/` | Contextos e providers separados para autenticação, tarefas e notificações |
| `src/hooks/usePomodoro.ts` | Temporizador, persistência e transições de foco e pausa |
| `src/services/` | Cliente HTTP em `http.ts` e serviços de autenticação, tarefas e Pomodoro |
| `src/types/`, `src/mappers/` | Contratos da API, modelos de domínio e conversão das tarefas |
| `src/styles/`, `src/index.css` | Estilos das telas, tokens e integração com Tailwind |
| `tests/`, `vitest.config.ts` | Testes automatizados e configuração da suíte |

## 🚀 Como rodar localmente

### Pré-requisitos

- **Node.js** 24.x (compatível com o build e a suíte de testes)
- **npm** ≥ 10 (ou `pnpm` / `yarn`)
- **Git**

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/ALVAROVELAME/controleoperacional-frontend.git
cd controleoperacional-frontend

# 2. Instale as dependências
npm ci

# 3. Rode em modo desenvolvimento
npm run dev
```

Abra o endereço exibido pelo Vite no terminal (normalmente `http://localhost:5173`).

---

## 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Dev server com HMR em `localhost:5173` |
| `npm run build` | Build de produção otimizado (saída em `dist/`) |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verifica as regras do ESLint |
| `npm test` | Executa toda a suíte uma vez |
| `npm run test:watch` | Reexecuta testes durante a edição |
| `npm run test:coverage` | Gera a cobertura V8 em `coverage/index.html` |

Os testes verificam autenticação, redirecionamentos, formulários, confirmação de e-mail, tarefas, cache e Pomodoro. Os cenários implementados e os que ainda precisam de cobertura estão em [TESTES.md](./TESTES.md).

---

## 🏗 Arquitetura

### Fluxo de autenticação

```
Usuário faz login
       ↓
POST /api/auth/login  ← http.ts (axios instance)
       ↓
AuthContext.login()   → salva token + usuário no localStorage
       ↓
AuthProvider          → atualiza estado global (usuário + carregando)
       ↓
RotaProtegida         → libera <Dashboard />
```

### Interceptors do Axios

**Request** — adiciona `Authorization: Bearer <token>` automaticamente.

**Response** — em **401** (fora das rotas públicas de login/confirmação), remove o token e o usuário se a resposta corresponder ao token atual e comunica a expiração ao contexto. O **403** é preservado (pode ser apenas "sem permissão" para um recurso).

### Sincronização de tarefas (otimista)

`TarefasContext` aplica **rollback automático** quando a API falha:

1. Aplica a mudança localmente (UI responde na hora).
2. Chama a API em background.
3. Se falhar, reverte o estado e mostra um toast de erro.
4. O cache em `localStorage` mantém a última lista de tarefas por conta.

### Persistência

| Dado | Onde | Chave |
|---|---|---|
| Token JWT | `localStorage` | `token` |
| Usuário | `localStorage` | `usuario` |
| Preferência de tema | `localStorage` | `ctoperacional:tema` |
| Cache de tarefas (por usuário) | `localStorage` | `ctoperacional:cache:<email>` |
| Tarefas legadas (pré-API) | `localStorage` | `ctoperacional:tarefas` |
| Estado do Pomodoro | `localStorage` | `ctoperacional:pomodoro` |

### Guards de rota

| Componente | Comportamento |
|---|---|
| `<RotaPublica>` | Se autenticado → redireciona para `/dashboard` |
| `<RotaProtegida>` | Sem sessão ativa em `/dashboard`, volta à página institucional (`/`). Ao clicar em **Sair**, o usuário vai para `/login` |

---

## 🎨 Design System

A página institucional e os formulários públicos usam superfícies escuras, detalhes em azul e ciano e ícones SVG compartilhados. O dashboard oferece temas claro e escuro por meio de `data-theme`. Consulte [landing.css](./src/styles/landing.css) para os estilos da página inicial e [publicstyles.css](./src/styles/publicstyles.css) para o tema compartilhado das demais telas públicas.

### Acessibilidade

As telas incluem navegação por teclado, foco visível, mensagens de erro com `role="alert"` e feedback com `role="status"`. As folhas de estilo incluem adaptações para movimento reduzido e impressão dos documentos legais.

## 🌐 API consumida

### Autenticação e conta

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/auth/me` | Usuário logado |
| `GET` | `/api/auth/confirmar?token=...` | Confirmação de e-mail |
| `POST` | `/api/usuarios` | Cadastro |
| `POST` | `/api/usuarios/me/excluir` | Exclusão de conta (requer senha) |

### Tarefas

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/tarefas` | Lista tarefas do usuário |
| `POST` | `/api/tarefas` | Cria tarefa |
| `PUT` | `/api/tarefas/:id` | Atualiza tarefa |
| `PATCH` | `/api/tarefas/:id/status` | Move entre colunas |
| `POST` | `/api/tarefas/:id/pomodoros` | Incrementa contador de pomodoros |
| `DELETE` | `/api/tarefas/:id` | Exclui tarefa |
| `DELETE` | `/api/tarefas` | Apaga todas as tarefas do usuário |
| `POST` | `/api/tarefas/importar` | Importa tarefas em lote |

### Pomodoro

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/pomodoros/eventos` | Registra eventos de foco e pausa |

O [mapper de tarefas](./src/mappers/tarefa.mapper.ts) normaliza respostas com enums numéricos ou textuais e monta os dados enviados na criação e na edição.

## 🚢 Deploy

### Vercel (recomendado)

O projeto inclui um `vercel.json` que configura **SPA rewrites** para o React Router funcionar em acesso direto às rotas:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Passos:**

1. Importe o repositório no [Vercel](https://vercel.com/new)
2. Configure o **Root Directory** para `ctoperacional-frontend` (se estiver em subpasta)
3. Faça o deploy 🎉

### Outras plataformas

| Plataforma | Configuração |
|---|---|
| **Netlify** | Crie `public/_redirects` com `/* /index.html 200` |
| **Cloudflare Pages** | Fallback SPA automático no painel |
| **GitHub Pages** | Use [SPA GitHub Pages](https://github.com/rafgraph/spa-github-pages) |

---

## 🗺 Roadmap

### Concluído ✅

- [x] Autenticação (login, cadastro e confirmação de e-mail)
- [x] Dashboard com 4 abas (Quadro, Lista, Relatórios, Configurações)
- [x] Kanban com drag & drop e criação inline
- [x] Filtros por busca, status e prioridade
- [x] Tema claro / escuro (persistente + detecção do SO)
- [x] Command palette com atalhos
- [x] Pomodoro integrado às tarefas
- [x] Exportação / importação JSON
- [x] Páginas legais (Termos + Privacidade LGPD)
- [x] Exclusão de conta com confirmação por senha
- [x] Integração do Tailwind CSS e suíte automatizada com Vitest

### Em planejamento 📋

- [ ] Subtarefas e checklist dentro do card
- [ ] Múltiplos quadros / workspaces
- [ ] Atribuição de responsáveis e avatares
- [ ] Gráficos históricos (throughput, lead time)
- [ ] Relatórios em PDF
- [ ] PWA com modo offline completo
- [ ] Integração com webhooks / Slack / Discord
- [ ] App mobile (React Native)

---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um **fork** do projeto
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feat/minha-feature
   ```
3. Commit seguindo [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: adiciona subtarefas no card"
   ```
4. Faça push para a branch:
   ```bash
   git push origin feat/minha-feature
   ```
5. Abra um **Pull Request**

### Padrões de código

- **TypeScript estrito** — sem `any` (exceto onde inevitável e comentado)
- **Componentes funcionais** + hooks
- **Tailwind CSS e folhas por tela** em `src/styles/`
- **Acessibilidade não é opcional** — toda feature nova precisa passar em teclado
- **Commits atômicos** com mensagens descritivas

---



## 📞 Contato

| Canal | |
|---|---|
| 🌐 **Site** | [controle-operacional.vercel.app](https://controle-operacional.vercel.app) |
| 📧 **Suporte** | contato@ctoperacional.app |
| ⚖️ **Jurídico** | juridico@ctoperacional.app |
| 🔒 **DPO (LGPD)** | dpo@ctoperacional.app |

---

<div align="center">

### Feito com 💙 no Brasil 🇧🇷

**CtOperacional** — clareza e velocidade para sua operação

[⬆ Voltar ao topo](#-ctoperacional)

</div>
