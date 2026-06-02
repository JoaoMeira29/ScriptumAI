# Requisitos Avançados — Cliente

O cliente web (PWA) está em `services/pwa-service/`, construído com Next.js 16.

## 1. Server-Side Rendering (SSR) e Server Components

- **Next.js 16.2.1** com App Router — modelo híbrido de Server Components e Client Components
- **Layouts server-side:** o root layout (`app/layout.tsx`) é um Server Component que renderiza metadata e fonts no servidor
- **Páginas server-side:** páginas como `auth/accept-invite/page.tsx` são `async` Server Components que resolvem `searchParams` no servidor antes de hidratar no cliente
- **Client Components:** páginas interativas (dashboard, departments, admin) usam `"use client"` para estado e interatividade
- **Output standalone:** build otimizado para Docker com `output: "standalone"`
- **API rewrites server-side:** Next.js proxy de `/api/*` para o API Gateway, evitando problemas de CORS

## 2. Dark Mode

- **ThemeContext** (`context/theme-context.tsx`) com três modos: `light`, `dark`, `system`
- Deteção automática de preferência do sistema via `window.matchMedia("(prefers-color-scheme: dark)")`
- Persistência em `localStorage`
- Aplicação via classe CSS `dark` no `<html>` — integrado com Tailwind dark variant
- Toggle acessível em toda a aplicação via hook `useTheme()`
