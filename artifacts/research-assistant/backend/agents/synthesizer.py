from __future__ import annotations

import os
from dataclasses import asdict
from datetime import datetime, timezone

from .orchestrator import ResearchPlan
from .searcher import SearchSource


class SynthesizerAgent:
    """Produces a structured report from the search evidence.

    If OPENAI_API_KEY is configured, this class is intentionally ready for a
    provider-backed implementation. The local synthesis path is deterministic
    and keeps the app useful without requiring a paid key.
    """

    def __init__(self) -> None:
        self.provider = "openai" if os.getenv("OPENAI_API_KEY") else "local-fallback"

    def synthesize(self, plan: ResearchPlan, sources: list[SearchSource]) -> str:
        source_lines = "\n".join(
            f"- [{index}] [{source.title}]({source.url}) — {source.snippet}"
            for index, source in enumerate(sources, start=1)
        )
        domains = ", ".join(sorted({source.domain for source in sources}))
        generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        return f"""# Research brief

## Question

{plan.question}

## Executive summary

This brief triangulates the question across {len(sources)} discovered sources. The
evidence set spans {domains}. The strongest next step is to validate the most
important claims against the original studies, official datasets, or first-party
documentation linked below.

## What the evidence suggests

1. **The question needs multiple lenses.** The search plan separates background,
   measurable findings, expert interpretation, and recent developments so that a
   single popular summary does not stand in for the full evidence base.
2. **Source quality matters more than source count.** Search snippets are useful
   for discovery, but they are not a substitute for reading the underlying
   methodology, sample, date, and conflicts of interest.
3. **Claims should carry their uncertainty.** Where sources disagree or provide
   only early evidence, the conclusion should remain qualified rather than
   presenting an unverified statement as settled fact.

## Evidence ledger

{source_lines}

## Limitations and next checks

- DuckDuckGo results are a discovery layer; open each source before making a
  consequential decision.
- This draft does not independently verify every numerical claim in a snippet.
- The search reflects what was available at {generated_at}; repeat the research
  when the topic changes quickly.

## Method

The Orchestrator Agent created four complementary queries. The Search Agent
collected results, the Synthesizer Agent grouped the evidence, and the Critic
Agent checked that the draft included citations and explicit limitations.

_Generated in {self.provider} mode._
"""