# 📝 submitin

A modern system for creating custom forms, generating public links, and collecting responses.

## ✨ Features

- **Intuitive Builder**: Create forms with text, email, number, date, multiple choice, and checkbox fields
- **Public Links**: Generate unique links to share your forms
- **Responses Dashboard**: View all responses in an organized table
- **CSV Export**: Export your responses for external analysis
- **Email Notifications**: Get alerts on every new response
- **Webhooks**: Integrate with external systems
- **Modern Design**: Dark interface with glassmorphism and smooth animations

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router) + React 18 |
| Styling | TailwindCSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Credentials – email/password) |
| Email | React Email + Resend |
| Validation | Zod + React Hook Form |

## 📁 Project Structure

```
submitin/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/
│       │   ├── (auth)/         # Authentication routes
│       │   ├── (dashboard)/    # Admin panel (protected)
│       │   ├── f/[slug]/       # Public forms
│       │   └── api/            # API Routes
│       ├── components/
│       └── lib/
├── packages/
│   ├── database/               # Prisma schema and client
│   ├── ui/                     # Shared shadcn components
│   ├── email/                  # React Email templates
│   └── config/                 # ESLint, TypeScript, Tailwind configs
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (local or cloud)

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd submitin
pnpm install
```

### 2. Configure environment variables

Create a `.env.local` file in the `apps/web/` folder:

```env
# Database
# For local PostgreSQL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/submitin?schema=public"

# For Supabase (get it from: Dashboard > Project Settings > Database):
# DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Email (Resend) - Required for password reset and response notifications
AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
AUTH_EMAIL_FROM="Your Name <noreply@yourdomain.com>"
```

**⚠️ IMPORTANT:**
- Use `.env.local` (not `.env`) — `.env.local` is gitignored
- If using Supabase, replace `DATABASE_URL` with your Supabase connection string
- Login works without Resend. `AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM` are required only for password reset and (optional) response notifications

**⚠️ Important for Deploy (Vercel/Supabase):**

- To generate `AUTH_SECRET`: `openssl rand -base64 32`
- Configure all variables in your provider's dashboard:
  - **Vercel**: Project Settings > Environment Variables
  - **Supabase**: Project Settings > Edge Functions > Secrets (if using Edge Functions) or your deploy environment variables
- Required variables: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
- Optional variables: `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`
- Build will fail if required variables are not set

**📌 Note about Supabase:**
- This project uses **Next.js API Routes** (not Supabase Edge Functions)
- If you use Supabase as the database, set `DATABASE_URL` to your Supabase connection string
- Environment variables must be set in the provider where you deploy Next.js (Vercel, Railway, etc.)
- Email sending works the same way whether or not you use Supabase as the database

### ✅ Production Deploy Checklist

Before deploying, verify:

1. **Environment Variables Set**:
   - [ ] `DATABASE_URL` — Supabase connection string (do not use localhost!)
   - [ ] `AUTH_SECRET` — Generated with `openssl rand -base64 32`
   - [ ] `AUTH_URL` — Your production site URL (e.g. `https://yourdomain.com`)
   - [ ] `AUTH_RESEND_KEY` — Resend API key
   - [ ] `AUTH_EMAIL_FROM` — Email verified in Resend

2. **Database**:
   - [ ] `DATABASE_URL` points to Supabase (not localhost)
   - [ ] Use Supabase "Connection pooling" for better performance
   - [ ] Migrations applied (`pnpm db:push` or via Supabase)

3. **Resend**:
   - [ ] Domain verified in Resend Dashboard
   - [ ] Domain status: `verified` (SPF and DKIM configured)
   - [ ] `AUTH_EMAIL_FROM` uses the verified domain

4. **After Deploy**:
   - [ ] Check server logs for diagnostics
   - [ ] Test login and, if configured, password reset and response notifications
   - [ ] Verify form responses are being saved

### 3. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Create tables
pnpm db:push
```

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Production build for all apps |
| `pnpm lint` | Run linter across all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Sync schema with database |
| `pnpm db:studio` | Open Prisma Studio |

## 🔐 Authentication

The system uses **email and password** (Credentials provider) with NextAuth.js v5:

- **Register**: Create an account with email and password
- **Login**: Sign in with email and password
- **Forgot password**: Request a reset link via email (requires Resend)
- **Reset password**: Set a new password via the link sent by email
- **Email verification**: Optional verification flow for new accounts

Login does not require email delivery; Resend is only needed for password reset and (optional) response notifications.

## 📧 Email Configuration (Resend)

Resend is used for **password reset emails** and **response notifications** (optional). Login works without it.

### Step by Step

1. **Create an account** at [resend.com](https://resend.com)

2. **Add and verify your domain** (⚠️ **REQUIRED**)
   - Go to Resend dashboard > **Domains**
   - Click **Add Domain**
   - **Recommendation**: Use a subdomain (e.g. `updates.yourdomain.com`) to isolate sending reputation
   - Configure DNS records as instructed:
     - **SPF**: TXT record that authorizes Resend to send email
     - **DKIM**: TXT record with public key for authenticity verification
     - **DMARC** (optional): Improves trust with email providers
   - Wait for verification (status should become `verified`)
   - 📖 [Full documentation](https://resend.com/docs/dashboard/domains/introduction)

3. **Create an API Key**
   - Go to **API Keys** in the dashboard
   - Click **Create API Key**
   - Copy the key (format: `re_xxxxxxxxxxxx`)

4. **Set environment variables**
   ```env
   AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
   AUTH_EMAIL_FROM="Your Name <noreply@yourdomain.com>"
   ```
   
   ⚠️ **IMPORTANT**: 
   - The domain in `AUTH_EMAIL_FROM` **MUST** be verified in Resend
   - Use the format: `"Name <email@domain.com>"` or `"email@domain.com"`
   - The domain must have `verified` status in the Resend dashboard

## 🗄️ Database

The project uses PostgreSQL with Prisma ORM. You can use:

- **Local**: PostgreSQL installed locally
- **Cloud**: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)

### Configuring Supabase

1. Go to the [Supabase Dashboard](https://app.supabase.com)
2. Open **Project Settings** > **Database**
3. Copy the **Connection String** (use "Connection pooling" for better performance)
4. Paste it into `.env.local` as `DATABASE_URL`

## 🔧 Troubleshooting

### Error: "Can't reach database server at 'localhost:5432'"

**Problem**: Prisma is trying to connect to a local PostgreSQL that is not running.

**Solutions**:
1. **If you use Supabase**: Update `DATABASE_URL` in `.env.local` with your Supabase connection string
2. **If you use local PostgreSQL**: Make sure PostgreSQL is running:
   ```bash
   # macOS (Homebrew)
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

### Error: "Configuration" or email not sending (password reset / notifications)

**Problem**: `AUTH_RESEND_KEY` or `AUTH_EMAIL_FROM` are not set — needed for password reset and response notifications (not for login).

**Solution**:
1. Create or edit `.env.local` in the `apps/web/` folder
2. Add the variables:
   ```env
   AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
   AUTH_EMAIL_FROM="Your Name <noreply@yourdomain.com>"
   ```
3. Restart the server: `pnpm dev`

### Verify configuration

When you start the server, an automatic diagnostic will appear in the console showing:
- ✅ Variables configured correctly
- ❌ Missing or incorrect variables
- ⚠️ Warnings about configuration

If something is wrong, the diagnostic will show specific instructions to fix it.

## 🎨 Customization

### Themes

The design system is configured in `apps/web/app/globals.css`. CSS variables can be adjusted to customize colors, borders, and spacing.

### Components

UI components live in `packages/ui/src/components/` and follow shadcn/ui patterns.

## 📄 License

MIT

---

Made with ❤️ by Vitor Hugo
