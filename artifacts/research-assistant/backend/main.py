from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from pydantic import BaseModel, Field

from tools.exporter import markdown_to_pdf
from utils.pipeline import run_pipeline

app = FastAPI(
    title="Research Assistant API",
    description="A modular multi-agent research pipeline with DuckDuckGo discovery.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: dict[str, dict] = {}


class ResearchInput(BaseModel):
    question: str = Field(min_length=8, max_length=2000)


@app.get("/api/healthz")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/research")
def create_research(payload: ResearchInput) -> dict:
    question = " ".join(payload.question.split())
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = run_pipeline(question)
    result["id"] = str(uuid4())
    result["createdAt"] = datetime.now(timezone.utc).isoformat()
    jobs[result["id"]] = result
    return result


@app.get("/api/research/{research_id}")
def get_research(research_id: str) -> dict:
    result = jobs.get(research_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Research job not found.")
    return result


@app.get("/api/research/{research_id}/markdown", response_class=PlainTextResponse)
def get_markdown(research_id: str) -> str:
    result = jobs.get(research_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Research job not found.")
    return result["reportMarkdown"]


@app.get("/api/research/{research_id}/pdf")
def get_pdf(research_id: str) -> Response:
    result = jobs.get(research_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Research job not found.")
    pdf = markdown_to_pdf(result["reportMarkdown"])
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="research-{research_id[:8]}.pdf"'
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )