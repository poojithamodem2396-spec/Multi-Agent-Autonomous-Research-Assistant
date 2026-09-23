from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ResearchPlan:
    question: str
    queries: list[str]


class OrchestratorAgent:
    """Turns one broad question into a small set of complementary searches."""

    def plan(self, question: str) -> ResearchPlan:
        clean_question = re.sub(r"\s+", " ", question).strip()
        return ResearchPlan(
            question=clean_question,
            queries=[
                f"{clean_question} overview latest evidence",
                f"{clean_question} key findings data analysis",
                f"{clean_question} expert perspectives limitations",
                f"{clean_question} recent developments primary sources",
            ],
        )