---
name: Artifact API routing
description: Preview routing can reserve /api for the shared API artifact even when a frontend has its own backend.
---

Use an app-specific preview prefix for a custom backend when the workspace already has an API artifact occupying `/api`; configure the frontend client base URL and Vite proxy together, then add that prefix to the artifact service paths.

**Why:** Requests to `/api` were intercepted by the existing API artifact and returned 502 before the frontend proxy could reach the custom service.

**How to apply:** For a custom FastAPI or Flask service behind a React artifact, prefer a distinct path such as `/research-api`, rewrite it in Vite to the backend's native route, and configure the generated client with `setBaseUrl`.