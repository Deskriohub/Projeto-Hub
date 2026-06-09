# Central DeskRio

Portal interno de gestão da DeskRio, construído pela MP Studio.

## Stack
Vite + React 18 + TypeScript · shadcn/ui + Tailwind · Supabase (email/senha, gate @deskrio.com.br) · Vercel

## Setup local
```bash
npm install
cp .env.example .env      # já vem com os dados do Supabase do DeskRio
npm run dev
```

## Variáveis de ambiente
| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase do DeskRio |
| `VITE_SUPABASE_ANON_KEY` | Chave anon (pública) do Supabase |
| `VITE_DESKRIO_IA_URL` | URL da IA do Prompt Studio (página Assistente) |

## Gate de acesso
Só e-mails `@deskrio.com.br` logam. Qualquer outro domínio é bloqueado no `AuthContext`.

## Módulos
Home · A DeskRio · Relatórios (Power BI — preencher IDs) · 1-on-1 · Elogios + Mural ·
Biblioteca · Ferramentas · Assistente IA · Usuários · Sugestões · Configurações

## Pendências para preencher
- `AppSidebar.tsx` → `dashboardsDeskRio`: reportId/workspaceId do Power BI do DeskRio
- `ADeskRio.tsx`, `Biblioteca*.tsx`: links institucionais/arquivos do DeskRio
- `home/*`: as URLs `example.invalid/REPLACE_ME` marcam onde plugar as planilhas do DeskRio
- Migrations: o admin seed usa `admin@deskrio.com.br` — troque pelo e-mail real do admin

## Deploy Vercel
Push no GitHub → conectar no Vercel → adicionar as env vars → deploy.
