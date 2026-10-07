<div align="center">

# 📋 CtOperacional

### Controle operacional e Kanban para equipes que precisam de clareza e velocidade

Organize tarefas, acompanhe o fluxo de trabalho e mantenha sua equipe alinhada com um quadro Kanban moderno — com Pomodoro integrado.

[![Vercel](https://img.shields.io/badge/deploy-vercel-000?logo=vercel&logoColor=white)](https://ctoperacional.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

[🌐 Ver online](https://ctoperacional.vercel.app) · [🐛 Reportar bug](https://github.com/seu-usuario/ctoperacional/issues) · [💡 Sugerir feature](https://github.com/seu-usuario/ctoperacional/issues)

</div>

---

## 📖 Sobre o projeto

O **CtOperacional** é uma aplicação web de **controle operacional e gestão de tarefas no modelo Kanban**, construída com foco em **simplicidade, performance e acessibilidade**. Substitui planilhas e listas dispersas por um quadro visual que roda direto no navegador — computador, tablet ou celular.

### Por que existe

Equipes perdem tempo tentando descobrir "o que está sendo feito", "por quem" e "em que etapa". O CtOperacional centraliza tudo em um único quadro: colunas configuráveis, cards com prioridade, prazo, descrição e ciclos de foco (Pomodoro), com sincronização automática na nuvem.

### Diferenciais

- ⚡ **Rápido** — Vite + React 19, carrega em menos de 1 segundo
- 🌗 **Tema claro e escuro** — com contraste WCAG AAA verificado
- ♿ **Acessível** — navegação por teclado, ARIA completo, `prefers-reduced-motion`
- 📱 **Responsivo** — quadro com scroll horizontal, drawer mobile, KPIs em grade 2×2
- 🎨 **Design System** próprio — variáveis CSS, sem dependências de UI
- 🍅 **Pomodoro integrado** — timer acoplado às tarefas, com histórico diário
- 🔒 **Seguro** — JWT com interceptor de 401, senha em hash no backend

---

## ✨ Funcionalidades

### Autenticação

- ✅ Cadastro com validação em tempo real (nome, e-mail, senha forte)
- ✅ Força da senha visual + checklist de requisitos (`aria-live`)
- ✅ Login com "Esqueci minha senha" e revelação de senha via SVG
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
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Tipagem estrita |
| [Vite](https://vite.dev) | 7 | Build e dev server |
| [React Router](https://reactrouter.com) | 7 | Roteamento SPA |
| [Axios](https://axios-http.com) | 1.x | Cliente HTTP |

### Estilos

- **CSS-in-TS** — blocos `<style>` escopados por componente
- **Variáveis CSS** — tema claro/escuro via `data-theme` no `<html>`
- **Zero dependências de UI** — sem Tailwind, MUI, Chakra, etc.

### Qualidade

- [ESLint](https://eslint.org) 9 (flat config)
- [typescript-eslint](https://typescript-eslint.io)
- `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`

---

## 📁 Estrutura do projeto

```
ctoperacional-frontend/
├── public/                    # Assets estáticos (favicon)
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── LegalLayout.tsx    # Layout dos documentos legais
│   │   ├── LogoutButton.tsx
│   │   ├── Pomodoro.tsx       # usePomodoro + <Pomodoro> + <PomodoroMini>
│   │   ├── RotaProtegida.tsx  # Guard de rotas autenticadas
│   │   └── RotaPublica.tsx    # Guard de rotas públicas
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Provider de autenticação
│   │   ├── TarefasContext.tsx # Provider de tarefas + sync
│   │   └── ToastContext.tsx   # Provider de notificações
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Dashboard.tsx      # Hub principal (4 abas)
│   │   ├── ConfirmarEmail.tsx
│   │   ├── Status.tsx         # StatusView + StatusPage
│   │   ├── Termos.tsx
│   │   └── Privacidade.tsx
│   ├── services/
│   │   ├── api.ts             # Axios + interceptors
│   │   ├── auth.service.ts    # Login, cadastro, logout, exclusão
│   │   ├── tarefas.service.ts # CRUD de tarefas
│   │   └── pomodoro.service.ts# Registro de sessões de foco
│   ├── types/
│   │   ├── index.ts           # Tipos da API (DTOs)
│   │   └── tarefa.ts          # Tipos de domínio + sanitização
│   ├── App.tsx                # Configuração de rotas
│   ├── index.css              # Design tokens globais
│   └── main.tsx               # Entry point
├── vercel.json                # SPA rewrites para deploy
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Como rodar localmente

### Pré-requisitos

- **Node.js** ≥ 20
- **npm** ≥ 10 (ou `pnpm` / `yarn`)
- **Git**

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/ctoperacional.git
cd ctoperacional-frontend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (veja abaixo)
cp .env.example .env

# 4. Rode em modo desenvolvimento
npm run dev
```

A aplicação abre automaticamente em `http://localhost:5173`.

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_API_URL=https://controle-operacional-api.duckdns.org
```

> ⚠️ **Importante:** o `VITE_API_URL` é obrigatório. Se não estiver definido, a aplicação lança erro explícito na inicialização.

---

## 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Dev server com HMR em `localhost:5173` |
| `npm run build` | Build de produção otimizado (saída em `dist/`) |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verificação de lint em todo o código |

---

## 🏗 Arquitetura

### Fluxo de autenticação

```
Usuário faz login
       ↓
POST /api/auth/login  ← api.ts (axios instance)
       ↓
AuthContext.login()   → salva token + usuário no localStorage
       ↓
AuthProvider          → atualiza estado global (usuário + carregando)
       ↓
RotaProtegida         → libera <Dashboard />
```

### Interceptors do Axios

**Request** — adiciona `Authorization: Bearer <token>` automaticamente.

**Response** — em **401** (fora das rotas públicas de login/confirmação), limpa o `localStorage` e redireciona para `/login`. O **403** é preservado (pode ser apenas "sem permissão" para um recurso).

### Sincronização de tarefas (otimista)

`TarefasContext` aplica **rollback automático** quando a API falha:

1. Aplica a mudança localmente (UI responde na hora).
2. Chama a API em background.
3. Se falhar, reverte o estado e mostra um toast de erro.
4. Cache local em `localStorage` garante abertura instantânea em recargas.

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
| `<RotaProtegida>` | Se não autenticado → redireciona para `/login` com `state.from` |

---

## 🎨 Design System

### Paleta (tema claro)

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#f6f8fb` | Fundo da página |
| `--surface` | `#ffffff` | Cards, painéis |
| `--ink` | `#0f172a` | Texto principal |
| `--ink-soft` | `#334155` | Texto secundário |
| `--muted` | `#5b6b82` | Texto terciário |
| `--brand` | `#2563eb` | Marca, CTAs |
| `--brand-2` | `#3b82f6` | Foco, gradientes |
| `--danger` | `#dc2626` | Erros, ações destrutivas |
| `--ok` | `#059669` | Sucesso |
| `--warn` | `#b45309` | Alertas |
| `--border` | `#e2e8f0` | Bordas |

### Paleta (tema escuro)

| Token | Hex |
|---|---|
| `--bg` | `#0b0f1a` |
| `--surface` | `#111827` |
| `--ink` | `#f1f5f9` |
| `--ink-soft` | `#cbd5e1` |
| `--muted` | `#9fb0c6` |
| `--brand` | `#60a5fa` |
| `--danger` | `#f87171` |
| `--ok` | `#34d399` |

### Tipografia

- **Fonte:** `Inter` (fallback para system UI)
- **Escala fluida:** `clamp()` para títulos
- **Line-height:** 1.5 (corpo) / 1.1 (títulos)

### Breakpoints

| Breakpoint | Mudança principal |
|---|---|
| `≤1500px` | Painel de foco deixa de ser coluna lateral sticky |
| `≤1100px` | Kanban vira grade 2×2 |
| `≤1024px` | Sidebar → drawer mobile |
| `≤720px` | Kanban em coluna única, tabela com scroll horizontal |
| `≤480px` | KPIs em grade 2×2 |

---

## ♿ Acessibilidade

O projeto segue **WCAG 2.1 nível AA**, atingindo **AAA** em quase todos os textos.

### Implementado

- ✅ **Skip link** em todas as páginas
- ✅ **`:focus-visible`** com anel adaptado a fundos claros e escuros
- ✅ **Landmarks semânticos:** `<main>`, `<nav>`, `<header>`, `<aside>`, `<footer>`
- ✅ **ARIA completo:** `aria-label`, `aria-current`, `aria-expanded`, `aria-pressed`, `aria-invalid`, `aria-describedby`, `aria-live`, `aria-busy`
- ✅ **Focus trap** em modais, drawer e command palette
- ✅ **Navegação por teclado** em 100% dos elementos interativos
- ✅ **`role="alert"`** para erros, `role="status"` para feedback
- ✅ **Emojis decorativos** com `aria-hidden="true"`
- ✅ **`prefers-reduced-motion`** desativa animações
- ✅ **Contraste verificado** — todos os textos ≥ 7:1 (AAA)
- ✅ **Tabelas semânticas** com `scope`, `aria-label` e `sr-only`
- ✅ **`sr-only`** para conteúdo apenas para leitores de tela

### Testado em

- NVDA (Windows)
- VoiceOver (macOS / iOS)
- Navegação apenas por teclado
- Zoom 200%

---

## 🌐 API consumida

### Autenticação e conta

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/auth/me` | Usuário logado |
| `GET` | `/api/auth/confirmar?token=...` | Confirmação de e-mail |
| `POST` | `/api/usuarios` | Cadastro |
| `DELETE` | `/api/usuarios/me` | Exclusão de conta (requer senha) |

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
| `POST` | `/api/pomodoros/sessoes` | Registra uma sessão de foco concluída |

> **Tipos** são mapeados entre UI (`"em_progresso"`, `"media"`) e API (`"EmProgresso"`, `"Media"`) automaticamente pelo `tarefas.service.ts` e pelo `sanitizar()` em `types/tarefa.ts`.

---

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
3. Adicione a variável `VITE_API_URL` em *Settings → Environment Variables*
4. Deploy 🎉

### Outras plataformas

| Plataforma | Configuração |
|---|---|
| **Netlify** | Crie `public/_redirects` com `/* /index.html 200` |
| **Cloudflare Pages** | Fallback SPA automático no painel |
| **GitHub Pages** | Use [SPA GitHub Pages](https://github.com/rafgraph/spa-github-pages) |

---

## 🗺 Roadmap

### Concluído ✅

- [x] Autenticação (login, cadastro, confirmação de e-mail, recuperação de senha)
- [x] Dashboard com 4 abas (Quadro, Lista, Relatórios, Configurações)
- [x] Kanban com drag & drop e criação inline
- [x] Filtros por busca, status e prioridade
- [x] Tema claro / escuro (persistente + detecção do SO)
- [x] Command palette com atalhos
- [x] Pomodoro integrado às tarefas
- [x] Exportação / importação JSON
- [x] Páginas legais (Termos + Privacidade LGPD)
- [x] Exclusão de conta com confirmação por senha
- [x] Acessibilidade WCAG AA/AAA

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
- **CSS-in-TS** escopado por componente
- **Acessibilidade não é opcional** — toda feature nova precisa passar em teclado
- **Commits atômicos** com mensagens descritivas

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 📞 Contato

| Canal | |
|---|---|
| 🌐 **Site** | [ctoperacional.vercel.app](https://ctoperacional.vercel.app) |
| 📧 **Suporte** | contato@ctoperacional.app |
| ⚖️ **Jurídico** | juridico@ctoperacional.app |
| 🔒 **DPO (LGPD)** | dpo@ctoperacional.app |

---

<div align="center">

### Feito com 💙 no Brasil 🇧🇷

**CtOperacional** — clareza e velocidade para sua operação

[⬆ Voltar ao topo](#-ctoperacional)

</div>