# ScriptumAI — Web

Progressive Web App (PWA) for the ScriptumAI document management platform.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui

## Features

- Document upload, listing, and management
- AI-powered document chat and summarization
- Organization and member management (admin panel)
- Real-time notifications
- Authentication (login, register, password recovery)
- Light/dark mode

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the [ScriptumAI API](../api)

### Setup

```bash
cd web
npm install
```

Create a `.env.local` file based on `.env.example` and set the API URL.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
