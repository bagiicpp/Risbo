"""Local-first BM25 wiki search for the Risbo AI backend."""
from .pipeline import build_wiki_context
from .router import route
from .searcher import WikiSearcher

__all__ = ["WikiSearcher", "build_wiki_context", "route"]
