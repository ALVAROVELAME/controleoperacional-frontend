<div align="center">

# 🐄 AgroGestor

### Plataforma moderna de gestão de rebanho

Controle produção, categorias e relatórios do seu rebanho em uma interface limpa, rápida e acessível — feita para o produtor rural.

[![Vercel](https://img.shields.io/badge/deploy-vercel-000?logo=vercel&logoColor=white)](https://agrogestor-br.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

[🌐 Ver online](https://agrogestor-br.vercel.app) · [🐛 Reportar bug](https://github.com/seu-usuario/agrogestor/issues) · [💡 Sugerir feature](https://github.com/seu-usuario/agrogestor/issues)

</div>

---

## 📖 Sobre o projeto

O **AgroGestor** é uma aplicação web para gestão de rebanho leiteiro, construída com foco em **simplicidade, performance e acessibilidade**. Substitui planilhas manuais por uma interface moderna que roda direto no navegador — computador, tablet ou celular.

### Por que existe

Produtores rurais perdem horas anotando produção em cadernos ou planilhas dispersas. O AgroGestor centraliza tudo em um lugar: cadastro de animais, produção diária, relatórios e backups, com sincronização automática na nuvem.

### Diferenciais

- ⚡ **Rápido** — Vite + React 19, carrega em menos de 1 segundo
- 🌗 **Tema claro e escuro** — com contraste WCAG AAA verificado
- ♿ **Acessível** — navegação por teclado, ARIA completo, `prefers-reduced-motion`
- 📱 **Responsivo** — tabelas com scroll horizontal + coluna fixa, drawer mobile
- 🎨 **Design System** próprio — variáveis CSS, sem dependências de UI
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

### Dashboard

| Aba | Recursos |
|---|---|
| **Visão Geral** | KPIs (total, produção, média, maior produtor), Top 5 gráfico de barras animado, distribuição por categoria |
| **Rebanho** | Formulário de cadastro, filtros (busca + categoria), tabela com ações inline (editar/excluir), 4 KPIs |
| **Relatórios** | KPIs de maior/menor produtor, tabela detalhada, botão de impressão |
| **Configurações** | Alternar tema, exportar/importar JSON, logout, zerar rebanho, zona de perigo |

### Recursos transversais

- 🎯 **Command Palette** (`Ctrl+K`) com navegação por teclado (`↑ ↓ Enter Esc`)
- 🔍 Busca de animais em tempo real dentro da palette
- 🌙 **Detecção automática** do tema do SO (`prefers-color-scheme`)
- 🍞 **Toasts empilhados** com dismiss, ícones e `aria-live`
- 💾 **Backup local** em JSON (exportar/importar)
- 📊 **Focus trap** em modais e palette
- 🚫 **Body scroll lock** quando overlays estão abertos
- 🖨️ **Estilos de impressão** limpos nos documentos legais

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
- **Variáveis CSS** — tema claro/escuro via `data-theme`
- **Zero dependências de UI** — sem Tailwind, MUI, Chakra, etc.

### Qualidade

- [ESLint](https://eslint.org) 9 (flat config)
- [typescript-eslint](https://typescript-eslint.io)
- `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`

---

## 📁 Estrutura do projeto

```
agrogestor-frontend/
├── public/                    # Assets estáticos
├── src/
│   ├── assets/                # Imagens, ícones
│   ├── components/            # Componentes reutilizáveis
│   │   ├── AnimalForm.tsx
│   │   ├── AnimalList.tsx
│   │   ├── LegalLayout.tsx    # Layout dos documentos legais
│   │   ├── LogoutButton.tsx
│   │   ├── RotaProtegida.tsx  # Guard de rotas autenticadas
│   │   └── RotaPublica.tsx    # Guard de rotas públicas
│   ├── contexts/
│   │   └── AuthContext.tsx    # Provider de autenticação
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx      # Hub principal (4 abas)
│   │   ├── ConfirmarEmail.tsx
│   │   ├── Status.tsx         # StatusView + StatusPage
│   │   ├── Termos.tsx
│   │   └── Privacidade.tsx
│   ├── services/
│   │   ├── api.ts             # Axios + interceptors
│   │   ├── auth.service.ts    # Login, cadastro, logout
│   │   └── animais.service.ts # CRUD de animais
│   ├── types/
│   │   └── index.ts           # Tipos globais
│   ├── App.tsx                # Configuração de rotas
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
git clone https://github.com/seu-usuario/agrogestor.git
cd agrogestor-frontend

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
VITE_API_URL=https://sua-api.com
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
authService.login()   → salva token + usuário no localStorage
       ↓
AuthContext           → atualiza estado global
       ↓
RotaProtegida         → libera <Dashboard />
```

### Interceptors do Axios

**Request** — adiciona `Authorization: Bearer <token>` automaticamente.

**Response** — em 401 (fora do endpoint de login), limpa o localStorage e redireciona para `/login`.

### Persistência

| Dado | Onde | Chave |
|---|---|---|
| Token JWT | `localStorage` | `token` |
| Usuário | `localStorage` | `usuario` |
| Animais (fallback offline) | `localStorage` | `agrogestor:animais` |
| Preferência de tema | `localStorage` | `agrogestor:tema` |

### Guards de rota

| Componente | Comportamento |
|---|---|
| `<RotaPublica>` | Se autenticado → redireciona para `/dashboard` |
| `<RotaProtegida>` | Se não autenticado → redireciona para `/login` com `state.from` |

---

## 🎨 Design System

### Paleta (tema claro)

| Token | Hex | Contraste | Uso |
|---|---|---|---|
| `--ink` | `#0a1810` | 18.2:1 | Texto principal |
| `--ink-soft` | `#2a4033` | 12.1:1 | Texto secundário |
| `--muted` | `#3f5a48` | 7.2:1 | Texto terciário |
| `--brand` | `#14532d` | 9.1:1 | Marca, CTAs |
| `--brand-2` | `#16a34a` | — | Foco, gradientes |
| `--danger` | `#991b1b` | 8.3:1 | Erros, ações destrutivas |
| `--line` | `#d8e2dc` | — | Bordas |

### Paleta (tema escuro)

| Token | Hex | Contraste |
|---|---|---|
| `--ink` | `#f0f5f1` | 15.1:1 |
| `--ink-soft` | `#d4e0d7` | 12.2:1 |
| `--muted` | `#9db3a5` | 7.5:1 |
| `--brand` | `#5eeb92` | 11.0:1 |
| `--danger` | `#fca5a5` | 8.8:1 |

### Tipografia

- **Fonte:** `Inter` (fallback para system UI)
- **Escala fluida:** `clamp()` para títulos
- **Line-height:** 1.5 (corpo) / 1.1 (títulos)

### Breakpoints

| Breakpoint | Mudança principal |
|---|---|
| `≤1024px` | Sidebar → drawer mobile |
| `≤720px` | Tabela vira scroll horizontal + coluna fixa |
| `≤600px` | Painéis laterais empilham, marca compacta |
| `≤480px` | KPIs em grade 2×2 |

---

## ♿ Acessibilidade

O projeto segue **WCAG 2.1 nível AA**, atingindo **AAA** em quase todos os textos.

### Implementado

- ✅ **Skip link** em todas as páginas
- ✅ **`:focus-visible`** com anel adaptado a fundos claros e escuros
- ✅ **Landmarks semânticos:** `<main>`, `<nav>`, `<header>`, `<aside>`, `<footer>`
- ✅ **ARIA completo:** `aria-label`, `aria-current`, `aria-expanded`, `aria-pressed`, `aria-invalid`, `aria-describedby`, `aria-live`
- ✅ **Focus trap** em modais e command palette
- ✅ **Navegação por teclado** em 100% dos elementos interativos
- ✅ **`role="alert"`** para erros, `role="status"` para feedback
- ✅ **Emojis decorativos** com `aria-hidden="true"`
- ✅ **`prefers-reduced-motion`** desativa animações
- ✅ **Contraste verificado** — todos os textos ≥ 7:1 (AAA)
- ✅ **Tabelas semânticas** com `<caption>`, `scope`, `role="region"`
- ✅ **`sr-only`** para conteúdo apenas para leitores de tela

### Testado em

- NVDA (Windows)
- VoiceOver (macOS / iOS)
- Navegação apenas por teclado
- Zoom 200%

---

## 🌐 API consumida

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticação |
| `GET` | `/api/auth/me` | Usuário logado |
| `GET` | `/api/auth/confirmar?token=...` | Confirmação de e-mail |
| `POST` | `/api/usuarios` | Cadastro |
| `DELETE` | `/api/usuarios/me` | Exclusão de conta (requer senha) |
| `GET` | `/api/animais` | Lista animais |
| `POST` | `/api/animais` | Cria animal |
| `PUT` | `/api/animais/:id` | Atualiza animal |
| `DELETE` | `/api/animais/:id` | Exclui animal |

> **Categorias** são mapeadas entre UI (`"Vaca em Lactação"`) e API (`"VACA_EM_LACTACAO"`) automaticamente pelo `animais.service.ts`.

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
2. Configure o **Root Directory** para `agrogestor-frontend`
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

- [x] Autenticação (login, cadastro, confirmação de e-mail)
- [x] Dashboard com 4 abas
- [x] CRUD de animais com filtros
- [x] Tema claro / escuro
- [x] Command palette com atalhos
- [x] Exportação / importação JSON
- [x] Páginas legais (Termos + Privacidade)
- [x] Exclusão de conta com confirmação
- [x] Acessibilidade WCAG AA/AAA

### Em planejamento 📋

- [ ] Gráficos históricos (linha do tempo de produção)
- [ ] Múltiplas fazendas por usuário
- [ ] Relatórios em PDF
- [ ] PWA com modo offline completo
- [ ] Integração com sensores IoT
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
   git commit -m "feat: adiciona gráfico de produção semanal"
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
| 🌐 **Site** | [agrogestor-br.vercel.app](https://agrogestor-br.vercel.app) |
| 📧 **Suporte** | contato@agrogestor.app |
| ⚖️ **Jurídico** | juridico@agrogestor.app |
| 🔒 **DPO (LGPD)** | dpo@agrogestor.app |

---

<div align="center">

### Feito com 💚 no Brasil 🇧🇷

**AgroGestor** — gestão inteligente do seu rebanho

[⬆ Voltar ao topo](#-agrogestor)

</div> 