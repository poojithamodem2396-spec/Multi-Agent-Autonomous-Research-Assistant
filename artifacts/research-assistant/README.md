# Multi-Agent Research Assistant

A full-stack research workspace with a React/Vite interface and a modular
FastAPI backend. Enter a complex question, watch the orchestration stages, and
download a cited report as Markdown or PDF.

## Architecture

```text
React workspace
  -> POST /api/research
FastAPI
  -> OrchestratorAgent: turns one question into four research queries
  -> SearchAgent: searches DuckDuckGo via ddgs with an offline fallback
  -> SynthesizerAgent: structures evidence into Markdown
  -> CriticAgent: checks citations, caveats, and completeness
  -> ReportLab exporter: renders the saved report as PDF
```

The backend is intentionally useful without a paid model key. If
`OPENAI_API_KEY` is present, `SynthesizerAgent` records provider mode and is
ready for a provider-backed synthesis implementation; otherwise it uses the
deterministic local fallback so the workflow remains demonstrable.

## Local setup

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

The frontend dev server proxies `/api` to `http://127.0.0.1:8000`.

## Environment

Copy `backend/.env.example` to `.env` if you want to add an optional provider
key. Never commit API keys. The UI does not request credentials from users.