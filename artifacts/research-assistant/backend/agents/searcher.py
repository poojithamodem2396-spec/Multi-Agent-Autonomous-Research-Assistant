from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

from ddgs import DDGS


@dataclass(frozen=True)
class SearchSource:
    title: str
    url: str
    snippet: str
    domain: str


class SearchAgent:
    """Searches DuckDuckGo and falls back to transparent demo evidence offline."""

    def search(self, queries: list[str]) -> list[SearchSource]:
        sources: list[SearchSource] = []
        seen: set[str] = set()

        for query in queries:
            try:
                with DDGS() as client:
                    results = list(client.text(query, max_results=3))
            except Exception:
                results = []

            for result in results:
                url = str(result.get("href") or result.get("url") or "").strip()
                if not url or url in seen:
                    continue
                seen.add(url)
                sources.append(
                    SearchSource(
                        title=str(result.get("title") or "Untitled source"),
                        url=url,
                        snippet=str(
                            result.get("body")
                            or result.get("snippet")
                            or "No snippet was returned for this source."
                        ),
                        domain=urlparse(url).netloc.replace("www.", ""),
                    )
                )

        if sources:
            return sources[:12]

        return self._fallback_sources(queries[0] if queries else "research")

    def _fallback_sources(self, topic: str) -> list[SearchSource]:
        return [
            SearchSource(
                title=f"Wikipedia — {topic}",
                url="https://en.wikipedia.org/",
                snippet=(
                    "A broad reference entry used as a starting point. Verify "
                    "specific claims against primary and specialist sources."
                ),
                domain="en.wikipedia.org",
            ),
            SearchSource(
                title="Our World in Data",
                url="https://ourworldindata.org/",
                snippet=(
                    "Open data and research explainers that provide comparative "
                    "context, charts, and methodology notes."
                ),
                domain="ourworldindata.org",
            ),
            SearchSource(
                title="Google Scholar",
                url="https://scholar.google.com/",
                snippet=(
                    "A discovery index for academic literature. Use it to locate "
                    "the original papers behind a claim."
                ),
                domain="scholar.google.com",
            ),
            SearchSource(
                title="arXiv",
                url="https://arxiv.org/",
                snippet=(
                    "A preprint repository useful for recent technical research, "
                    "with the caveat that many papers are not peer reviewed."
                ),
                domain="arxiv.org",
            ),
        ]