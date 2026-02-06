# AppForger

Generate production-ready Expo React Native mobile apps and Next.js web companions with one click.

## Features

- **Forge Projects**: Create and manage app generation projects
- **Mobile App Generation**: Generates Expo React Native (TypeScript) apps with:
  - Supabase authentication (email/password)
  - Notes CRUD functionality
  - TypeScript support
- **Web Companion Generation**: Generates Next.js (TypeScript) web apps with:
  - Vercel-ready deployment configuration
  - Shared Supabase backend
  - Responsive design
- **GitHub Integration**: Automatically creates repos and commits generated code
- **Live Logs**: Real-time forge progress with polling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL with RLS)
- **APIs**: 
  - OpenAI (server-side only, reserved for future use)
  - GitHub REST API
  - Vercel API (stub)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/signup` | User registration |
| `/signin` | User login |
| `/dashboard` | Project management (protected) |
| `/builder/[projectId]` | Project builder with forge controls (protected) |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | POST | Create a new project |
| `/api/projects` | GET | List user's projects |
| `/api/forge/start` | POST | Start the forge process |
| `/api/forge/status` | GET | Get project status and logs |
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/signin` | POST | Sign in user |
| `/api/auth/signout` | POST | Sign out user |

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A GitHub account with Personal Access Token

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd appforger
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub (Required for Forge)
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_OWNER=your-github-username

# OpenAI (Server-side only, optional for future AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Vercel (Optional - deployment is stub only)
VERCEL_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-vercel-team-id
```

### 3. Setup Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration from `supabase/migrations/001_init.sql`

This creates:
- `profiles` table (extends auth.users)
- `forge_projects` table
- `forge_logs` table
- `generated_files` table
- Row Level Security policies (owner-only access)
- Updated_at triggers

### 4. Run Development Server

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:5000](http://localhost:5000)

### 5. Create an Account

1. Visit `/signup` to create an account
2. Check your email for verification (if enabled in Supabase)
3. Sign in at `/signin`

## Forge Flow

When you click "Forge App" on a project:

1. **Verify Ownership**: Confirms the project belongs to the authenticated user
2. **Update Status**: Sets project status to "forging" and starts logging
3. **Generate Scaffolds**: Creates deterministic mobile and web app code
4. **Save Files**: Stores all generated files in `generated_files` table
5. **Create GitHub Repo**: Creates `appforger-<projectId>` repository
6. **Commit Code**: Pushes `/mobile` and `/web` folders to GitHub
7. **Update Status**: Sets status to "ready" with repo URL
8. **Preview URL**: Remains null - connect repo to Vercel for deployment

## Generated App Structure

### Mobile (`/mobile`)
```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/
│   │   ├── notes.tsx
│   │   └── note/[id].tsx
│   └── _layout.tsx
├── lib/
│   └── supabase.ts
├── app.json
├── package.json
└── tsconfig.json
```

### Web (`/web`)
```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       └── supabase/
├── package.json
├── next.config.js
└── vercel.json
```

## Error Handling

- Any forge failure sets project status to "error"
- Error message is saved to the project
- All errors are logged to forge_logs with level "error"
- Users can retry forging after fixing issues

## Security

- All API routes require authentication
- Row Level Security ensures users only access their own data
- Service role key used only for admin operations (server-side)
- No client-side secrets exposed
- Protected pages use server-side auth via getUserOrRedirect()

## Deployment

Build and deploy to any platform that supports Next.js:

```bash
npm run build
npm start
```

For Vercel deployment:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

MIT
