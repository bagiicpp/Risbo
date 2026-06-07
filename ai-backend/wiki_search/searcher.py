"""
BM25 search over the curated Risbo wiki.

Index granularity is the SUB-CHUNK, not the whole file: most chunk files concatenate
several articles, each delimited by a `**Source:** <url>` marker. Indexing per-article
gives BM25 sharper relevance and keeps the injected context small (token budget).

The index is built ONCE at startup (see WikiSearcher()) and reused for every query.
"""
import logging
import os
import re

from rank_bm25 import BM25Okapi

logger = logging.getLogger(__name__)

WIKI_BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "wiki", "chunks")

# Below this BM25 score a chunk is considered not relevant enough to inject.
SCORE_THRESHOLD = float(os.getenv("WIKI_SCORE_THRESHOLD", "1.5"))
TOP_N_RESULTS = int(os.getenv("WIKI_TOP_N", "3"))

# Drop fragments shorter than this (stray titles / boilerplate slivers).
_MIN_CHUNK_WORDS = 40

_SOURCE_RE = re.compile(r"(?m)^\*\*Source:\*\*\s*(\S+).*$")
_TOKEN_RE = re.compile(r"[^\w\s]")


def _tokenize(text: str) -> list[str]:
    """Lowercase + strip punctuation, same approach as intent.py."""
    return _TOKEN_RE.sub(" ", text.lower()).split()


def _split_into_chunks(text: str) -> list[tuple[str, str]]:
    """
    Split one .md file into (chunk_text, source_url) per article.

    `**Source:**` markers delimit articles; their position is inconsistent (sometimes
    at the top of a block, sometimes at the bottom), so we split on the marker and
    attach the nearest captured URL to each surrounding text segment.
    """
    matches = list(_SOURCE_RE.finditer(text))
    if not matches:
        stripped = text.strip()
        return [(stripped, "")] if len(stripped.split()) >= _MIN_CHUNK_WORDS else []

    urls = [m.group(1) for m in matches]
    # Text segments between consecutive source markers.
    segments: list[str] = []
    prev_end = 0
    for m in matches:
        segments.append(text[prev_end:m.start()])
        prev_end = m.end()
    segments.append(text[prev_end:])  # tail after the last marker

    chunks: list[tuple[str, str]] = []
    for i, seg in enumerate(segments):
        seg = seg.strip()
        if len(seg.split()) < _MIN_CHUNK_WORDS:
            continue
        # Segment i sits between marker i-1 and marker i; attach the closest URL.
        url = urls[i] if i < len(urls) else (urls[i - 1] if i > 0 else "")
        chunks.append((seg, url))
    return chunks


class WikiSearcher:
    def __init__(self) -> None:
        self.chunks: list[str] = []      # raw text of each sub-chunk
        self.folders: list[str] = []     # folder name each sub-chunk belongs to
        self.sources: list[str] = []     # source URL per sub-chunk (may be "")
        self.bm25: BM25Okapi | None = None
        self._build_index()

    def _build_index(self) -> None:
        """Runs once at startup. Loads every .md sub-chunk into BM25."""
        tokenized: list[list[str]] = []
        base = os.path.abspath(WIKI_BASE_PATH)

        if not os.path.isdir(base):
            logger.warning("[WikiSearcher] wiki path not found: %s", base)
            return

        for folder_name in sorted(os.listdir(base)):
            folder_path = os.path.join(base, folder_name)
            if not os.path.isdir(folder_path):
                continue
            for filename in os.listdir(folder_path):
                if not filename.endswith(".md"):
                    continue
                path = os.path.join(folder_path, filename)
                try:
                    with open(path, encoding="utf-8") as fh:
                        text = fh.read()
                except OSError as e:
                    logger.warning("[WikiSearcher] could not read %s: %s", path, e)
                    continue

                for chunk_text, source_url in _split_into_chunks(text):
                    self.chunks.append(chunk_text)
                    self.folders.append(folder_name)
                    self.sources.append(source_url)
                    tokenized.append(_tokenize(chunk_text))

        if tokenized:
            self.bm25 = BM25Okapi(tokenized)
        logger.info(
            "[WikiSearcher] Indexed %d sub-chunks from %d folders.",
            len(self.chunks),
            len({f for f in self.folders}),
        )

    def search(
        self,
        english_query: str,
        folders: list[str],
        top_n: int = TOP_N_RESULTS,
        threshold: float = SCORE_THRESHOLD,
    ) -> str | None:
        """
        Search sub-chunks within the given folders.
        Returns the combined text of the top matches (each tagged with its source),
        or None if nothing clears the relevance threshold (caller may fall back).
        """
        if not self.bm25 or not self.chunks:
            return None

        allowed = set(folders)
        candidate_idx = [i for i, f in enumerate(self.folders) if f in allowed]
        if not candidate_idx:
            return None

        scores = self.bm25.get_scores(_tokenize(english_query))
        ranked = sorted(candidate_idx, key=lambda i: scores[i], reverse=True)

        blocks: list[str] = []
        for i in ranked[:top_n]:
            if scores[i] < threshold:
                continue
            src = f"\n(Source: {self.sources[i]})" if self.sources[i] else ""
            blocks.append(f"{self.chunks[i]}{src}")

        if not blocks:
            return None

        return "\n\n---\n\n".join(blocks)
