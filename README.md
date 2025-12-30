# 📝 Form Builder

Um sistema moderno para criar formulários personalizados, gerar links públicos e coletar respostas.

## ✨ Features

- **Builder Intuitivo**: Crie formulários com campos de texto, email, número, data, múltipla escolha e checkbox
- **Links Públicos**: Gere links únicos para compartilhar seus formulários
- **Autenticação Magic Link**: Login sem senha, apenas com email
- **Painel de Respostas**: Visualize todas as respostas em uma tabela organizada
- **Exportação CSV**: Exporte suas respostas para análise externa
- **Notificações por Email**: Receba alertas a cada nova resposta
- **Webhooks**: Integre com sistemas externos
- **Design Moderno**: Interface escura com glassmorphism e animações suaves

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router) + React 18 |
| Styling | TailwindCSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Magic Link) |
| Email | React Email + Resend |
| Validação | Zod + React Hook Form |

## 📁 Estrutura do Projeto

```
form-builder/
├── apps/
│   └── web/                    # Aplicação Next.js principal
│       ├── app/
│       │   ├── (auth)/         # Rotas de autenticação
│       │   ├── (dashboard)/    # Painel admin (protegido)
│       │   ├── f/[slug]/       # Formulários públicos
│       │   └── api/            # API Routes
│       ├── components/
│       └── lib/
├── packages/
│   ├── database/               # Prisma schema e cliente
│   ├── ui/                     # Componentes shadcn compartilhados
│   ├── email/                  # Templates React Email
│   └── config/                 # Configs ESLint, TypeScript, Tailwind
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL (local ou cloud)

### 1. Clone e instale as dependências

```bash
git clone <repo-url>
cd form-builder
pnpm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `apps/web/` baseado no `.env.example`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/formbuilder?schema=public"

# NextAuth
AUTH_SECRET="gere-com-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Email (Resend)
AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="Form Builder <noreply@yourdomain.com>"
```

**⚠️ Importante para Deploy:**
- Para gerar `AUTH_SECRET`: `openssl rand -base64 32`
- No Vercel/ambiente de produção, configure todas as variáveis de ambiente listadas acima
- Sem essas variáveis, o build falhará com erro relacionado ao NextAuth

### 3. Configure o banco de dados

```bash
# Gerar o cliente Prisma
pnpm db:generate

# Criar as tabelas
pnpm db:push
```

### 4. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps em modo desenvolvimento |
| `pnpm build` | Build de produção de todos os apps |
| `pnpm lint` | Executa o linter em todos os packages |
| `pnpm db:generate` | Gera o cliente Prisma |
| `pnpm db:push` | Sincroniza o schema com o banco |
| `pnpm db:studio` | Abre o Prisma Studio |

## 🔐 Autenticação

O sistema usa Magic Link para autenticação:

1. Usuário informa o email
2. Um link mágico é enviado por email
3. Ao clicar no link, o usuário é autenticado automaticamente

Para desenvolvimento local sem email, você pode usar o Prisma Studio para visualizar os tokens de verificação.

## 📧 Configuração de Email (Resend)

1. Crie uma conta em [resend.com](https://resend.com)
2. Adicione e verifique seu domínio
3. Crie uma API Key
4. Configure a variável `AUTH_RESEND_KEY`

## 🗄️ Database

O projeto usa PostgreSQL com Prisma ORM. Você pode usar:

- **Local**: PostgreSQL instalado localmente
- **Cloud**: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)

## 🎨 Customização

### Temas

O design system está configurado em `apps/web/app/globals.css`. As variáveis CSS podem ser ajustadas para personalizar cores, bordas e espaçamentos.

### Componentes

Os componentes UI estão em `packages/ui/src/components/` e seguem os padrões do shadcn/ui.

## 📄 Licença

MIT

---

Feito com ❤️ por Vitor Hugo

