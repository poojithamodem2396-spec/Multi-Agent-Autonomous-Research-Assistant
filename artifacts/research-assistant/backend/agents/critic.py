from __future__ import annotations

import re


class CriticAgent:
    """Checks minimum report quality before the result reaches the user."""

    def review(self, report: str, source_count: int) -> tuple[str, float]:
        checks = [
            bool(re.search(r"## Evidence ledger", report)),
            bool(re.search(r"## Limitations", report)),
            source_count > 0,
            len(report) >= 900,
        ]
        confidence = round(0.58 + (0.08 * sum(checks)), 2)
        if not all(checks):
            report += (
                "\n\n## Critic note\n\n"
                "The evidence set is incomplete. Treat this as a discovery draft "
                "and add primary sources before relying on it."
            )
        return report, confidence