#!/usr/bin/env python3
"""
watermark_scan.py - measurement harness for text provenance signals.

Scores a document for three independent classes of evidence and reports what
each one does and does not support:

  1. Hidden-character payloads  - zero-width characters, Unicode tag-block text,
     variation selectors, homoglyph substitution. Deterministic and decisive.
  2. Green-list watermark       - the Kirchenbauer et al. statistical scheme.
     A z-test over token green-list membership. Only meaningful when the key,
     tokenizer and gamma you test with match the ones used at generation time.
  3. Stylometry                 - burstiness, lexical diversity, repetition,
     punctuation and vocabulary profile. Descriptive only. Never a verdict.

Optionally, with `transformers` + `torch` installed, adds model-based
perplexity and a GLTR-style token-rank profile.

This tool measures. It does not modify text and it does not remove anything.

Usage
-----
  python3 tools/watermark_scan.py draft.md
  python3 tools/watermark_scan.py draft.md --key 15485863 --gamma 0.25 --windows
  python3 tools/watermark_scan.py draft.md --keys keys.txt
  python3 tools/watermark_scan.py draft.md --baseline corpus/*.md
  python3 tools/watermark_scan.py draft.md --model gpt2
  python3 tools/watermark_scan.py draft.md --json > report.json
  python3 tools/watermark_scan.py --selftest

Pure standard library. Python 3.8+.
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
import math
import os
import re
import statistics
import sys
import unicodedata
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

__version__ = "1.0.0"

# Kirchenbauer et al. reference implementation's default hash key. Using it as
# our default only makes sense for self-tests and for corpora you watermarked
# yourself; a real vendor key is secret. See NOTES in the report.
DEFAULT_KEY = "15485863"
DEFAULT_GAMMA = 0.25
DEFAULT_Z_THRESHOLD = 4.0
MIN_RELIABLE_TOKENS = 200


# --------------------------------------------------------------------------
# small stats helpers
# --------------------------------------------------------------------------

def _mean(xs: Sequence[float]) -> float:
    return statistics.fmean(xs) if xs else 0.0


def _sd(xs: Sequence[float]) -> float:
    return statistics.stdev(xs) if len(xs) > 1 else 0.0


def normal_sf(z: float) -> float:
    """One-sided upper-tail p-value for a standard normal."""
    return 0.5 * math.erfc(z / math.sqrt(2.0))


def safe_div(a: float, b: float) -> float:
    return a / b if b else 0.0


# --------------------------------------------------------------------------
# 1. hidden-character payload scan
# --------------------------------------------------------------------------

ZERO_WIDTH = {
    0x200B: "ZERO WIDTH SPACE",
    0x200C: "ZERO WIDTH NON-JOINER",
    0x200D: "ZERO WIDTH JOINER",
    0x2060: "WORD JOINER",
    0xFEFF: "ZERO WIDTH NO-BREAK SPACE / BOM",
}

BIDI_CONTROLS = {
    0x200E: "LEFT-TO-RIGHT MARK",
    0x200F: "RIGHT-TO-LEFT MARK",
    0x202A: "LEFT-TO-RIGHT EMBEDDING",
    0x202B: "RIGHT-TO-LEFT EMBEDDING",
    0x202C: "POP DIRECTIONAL FORMATTING",
    0x202D: "LEFT-TO-RIGHT OVERRIDE",
    0x202E: "RIGHT-TO-LEFT OVERRIDE",
    0x2066: "LEFT-TO-RIGHT ISOLATE",
    0x2067: "RIGHT-TO-LEFT ISOLATE",
    0x2068: "FIRST STRONG ISOLATE",
    0x2069: "POP DIRECTIONAL ISOLATE",
}

EXOTIC_SPACES = {
    0x00A0: "NO-BREAK SPACE",
    0x2000: "EN QUAD", 0x2001: "EM QUAD", 0x2002: "EN SPACE", 0x2003: "EM SPACE",
    0x2004: "THREE-PER-EM SPACE", 0x2005: "FOUR-PER-EM SPACE",
    0x2006: "SIX-PER-EM SPACE", 0x2007: "FIGURE SPACE",
    0x2008: "PUNCTUATION SPACE", 0x2009: "THIN SPACE", 0x200A: "HAIR SPACE",
    0x202F: "NARROW NO-BREAK SPACE", 0x205F: "MEDIUM MATHEMATICAL SPACE",
    0x3000: "IDEOGRAPHIC SPACE",
}

# Latin letters that have visually identical counterparts in other scripts.
HOMOGLYPHS = {
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
    "у": "y", "х": "x", "і": "i", "ј": "j", "һ": "h",
    "Ѕ": "S", "А": "A", "В": "B", "Е": "E", "К": "K",
    "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C",
    "Т": "T", "Х": "X",
    "ο": "o", "α": "a", "ε": "e", "ρ": "p", "υ": "u",
    "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H",
    "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O",
    "Ρ": "P", "Τ": "T", "Χ": "X",
}


def scan_hidden_characters(text: str) -> Dict:
    """Deterministic scan for out-of-band payloads carried in the code points."""
    findings = {
        "zero_width": [],
        "tag_block": [],
        "variation_selectors": [],
        "bidi_controls": [],
        "exotic_spaces": [],
        "homoglyphs": [],
        "other_controls": [],
    }

    for idx, ch in enumerate(text):
        cp = ord(ch)
        if cp in ZERO_WIDTH:
            findings["zero_width"].append((idx, cp, ZERO_WIDTH[cp]))
        elif 0xE0000 <= cp <= 0xE007F:
            # Unicode tag block: an ASCII character encoded invisibly. This is
            # the standard carrier for hidden-text steganography.
            decoded = chr(cp - 0xE0000) if 0xE0020 <= cp <= 0xE007E else ""
            findings["tag_block"].append((idx, cp, decoded))
        elif 0xFE00 <= cp <= 0xFE0F or 0xE0100 <= cp <= 0xE01EF:
            findings["variation_selectors"].append((idx, cp, "VARIATION SELECTOR"))
        elif cp in BIDI_CONTROLS:
            findings["bidi_controls"].append((idx, cp, BIDI_CONTROLS[cp]))
        elif cp in EXOTIC_SPACES:
            findings["exotic_spaces"].append((idx, cp, EXOTIC_SPACES[cp]))
        elif ch in HOMOGLYPHS:
            findings["homoglyphs"].append((idx, cp, f"looks like {HOMOGLYPHS[ch]!r}"))
        elif unicodedata.category(ch) == "Cf":
            findings["other_controls"].append((idx, cp, unicodedata.name(ch, "?")))

    # Reconstruct any ASCII string hidden in the tag block.
    tag_payload = "".join(d for _, _, d in findings["tag_block"] if d)

    # A homoglyph inside an otherwise-Latin word is far more suspicious than a
    # document that is legitimately multi-script. Measure the mixing directly.
    mixed_script_words = []
    for m in re.finditer(r"\S+", text):
        w = m.group(0)
        if any(c in HOMOGLYPHS for c in w) and any("a" <= c.lower() <= "z" for c in w):
            mixed_script_words.append((m.start(), w))

    counts = {k: len(v) for k, v in findings.items()}
    total = sum(counts.values())

    if findings["tag_block"]:
        verdict = "CONFIRMED"
        summary = "Unicode tag-block characters present: text carries a hidden payload."
    elif findings["zero_width"] or findings["variation_selectors"]:
        verdict = "SUSPICIOUS"
        summary = ("Invisible formatting characters present. These occur benignly "
                   "(ligature control, emoji sequences) but are also the most "
                   "common carrier for hidden marks.")
    elif mixed_script_words:
        verdict = "SUSPICIOUS"
        summary = "Non-Latin letters substituted inside Latin-script words."
    elif findings["bidi_controls"] or findings["other_controls"]:
        verdict = "NOTE"
        summary = "Format-control characters present. Usually benign, worth eyeballing."
    elif findings["exotic_spaces"]:
        verdict = "NOTE"
        summary = ("Non-standard space characters present. Common from word "
                   "processors and web copy-paste; rarely a mark on their own.")
    else:
        verdict = "CLEAN"
        summary = "No hidden-character payload detected."

    return {
        "verdict": verdict,
        "summary": summary,
        "counts": counts,
        "total": total,
        "tag_payload": tag_payload,
        "mixed_script_words": mixed_script_words[:20],
        "samples": {k: v[:10] for k, v in findings.items() if v},
    }


# --------------------------------------------------------------------------
# 2. green-list watermark detector
# --------------------------------------------------------------------------

def _h64(*parts) -> int:
    h = hashlib.blake2b(digest_size=8)
    for p in parts:
        h.update(str(p).encode("utf-8", "surrogatepass"))
        h.update(b"\x1f")
    return int.from_bytes(h.digest(), "big")


def _context_seed(key: str, context: Sequence, scheme: str) -> int:
    if scheme == "lefthash":
        return _h64(key, context[-1])
    if scheme == "sumhash":
        return sum(_h64(key, t) for t in context) % (1 << 64)
    if scheme == "minhash":
        return min(_h64(key, t) for t in context)
    raise ValueError(f"unknown hash scheme: {scheme}")


def is_green(context: Sequence, token, key: str, gamma: float, scheme: str) -> bool:
    """
    True if `token` falls in the green list induced by `context`.

    Equivalent in distribution to seeding an RNG with the context, permuting the
    vocabulary and taking the first gamma-fraction as green - but done by hashing
    the (context, token) pair directly, so no vocabulary list is required.
    """
    seed = _context_seed(key, context, scheme)
    return (_h64(seed, token) / float(1 << 64)) < gamma


def greenlist_test(
    tokens: Sequence,
    key: str = DEFAULT_KEY,
    gamma: float = DEFAULT_GAMMA,
    context: int = 1,
    scheme: str = "lefthash",
    dedup: bool = True,
) -> Dict:
    """
    One-proportion z-test on green-list membership.

        z = (|s|_G - gamma*T) / sqrt(T * gamma * (1 - gamma))

    `dedup` scores each distinct (context, token) pair once. Without it, a
    repeated phrase inflates z and manufactures false positives.
    """
    indicators: List[int] = []
    positions: List[int] = []
    seen = set()

    for i in range(context, len(tokens)):
        ctx = tuple(tokens[i - context:i])
        tok = tokens[i]
        if dedup:
            k = (ctx, tok)
            if k in seen:
                continue
            seen.add(k)
        indicators.append(1 if is_green(ctx, tok, key, gamma, scheme) else 0)
        positions.append(i)

    scored = len(indicators)
    green = sum(indicators)
    denom = math.sqrt(scored * gamma * (1.0 - gamma)) if scored else 0.0
    z = safe_div(green - gamma * scored, denom)

    return {
        "key": key,
        "gamma": gamma,
        "context": context,
        "scheme": scheme,
        "dedup": dedup,
        "scored_tokens": scored,
        "green_tokens": green,
        "green_fraction": safe_div(green, scored),
        "expected_fraction": gamma,
        "z": z,
        "p_value": normal_sf(z),
        "_indicators": indicators,
        "_positions": positions,
    }


def window_scan(result: Dict, sizes: Sequence[int] = (100, 200, 400), step: int = 25) -> Dict:
    """
    Sliding-window maximum z, for text where only a span is watermarked.

    Testing many windows inflates the false-positive rate, so the reported
    p-value is Bonferroni-corrected by the number of windows examined.
    """
    ind = result["_indicators"]
    gamma = result["gamma"]
    n = len(ind)
    if n == 0:
        return {"tested": 0, "best": None}

    prefix = [0]
    for v in ind:
        prefix.append(prefix[-1] + v)

    best = None
    tested = 0
    for w in sizes:
        if w > n:
            continue
        denom = math.sqrt(w * gamma * (1.0 - gamma))
        for start in range(0, n - w + 1, step):
            tested += 1
            g = prefix[start + w] - prefix[start]
            z = (g - gamma * w) / denom
            if best is None or z > best["z"]:
                best = {
                    "z": z,
                    "window_tokens": w,
                    "start_index": result["_positions"][start],
                    "end_index": result["_positions"][start + w - 1],
                    "green_fraction": g / w,
                }

    if best is not None:
        raw = normal_sf(best["z"])
        best["p_value_raw"] = raw
        best["p_value_bonferroni"] = min(1.0, raw * max(tested, 1))

    return {"tested": tested, "best": best}


def key_scan(tokens: Sequence, keys: Sequence[str], **kw) -> Dict:
    """Run the z-test under each candidate key and correct for the search."""
    results = []
    for k in keys:
        r = greenlist_test(tokens, key=k, **kw)
        r.pop("_indicators", None)
        r.pop("_positions", None)
        results.append(r)
    results.sort(key=lambda r: r["z"], reverse=True)
    n = max(len(keys), 1)
    for r in results:
        r["p_value_bonferroni"] = min(1.0, r["p_value"] * n)
    return {"keys_tested": n, "results": results}


# --------------------------------------------------------------------------
# tokenization
# --------------------------------------------------------------------------

WORD_RE = re.compile(r"[A-Za-z0-9']+")


def tokenize(text: str, mode: str = "word") -> List:
    if mode == "word":
        return WORD_RE.findall(text.lower())
    if mode == "wordcase":
        return WORD_RE.findall(text)
    if mode == "char":
        return list(text)
    if mode.startswith("hf:"):
        name = mode[3:]
        try:
            from transformers import AutoTokenizer  # type: ignore
        except ImportError:
            raise SystemExit(
                f"--tokenizer {mode} needs `transformers` installed:\n"
                f"    pip install transformers"
            )
        tk = AutoTokenizer.from_pretrained(name)
        return tk.encode(text, add_special_tokens=False)
    raise ValueError(f"unknown tokenizer mode: {mode}")


# --------------------------------------------------------------------------
# 3. stylometry
# --------------------------------------------------------------------------

ABBREV = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "st", "lt", "sgt", "capt",
    "col", "gen", "maj", "cpl", "cmd", "adm", "gov", "rep", "sen", "vs", "etc",
    "eg", "ie", "al", "inc", "ltd", "co", "no", "vol", "fig", "approx", "dept",
    "univ", "u.s", "u.k", "a.m", "p.m",
}

SENT_END = re.compile(r"""([.!?]+)(["')\]]*)(\s+|$)""")

CONTRACTIONS = re.compile(
    r"\b\w+'(?:s|t|re|ve|ll|d|m|clock)\b|\b(?:can't|won't|ain't|y'all)\b", re.I
)

LY_ADVERB = re.compile(r"\b\w{3,}ly\b", re.I)

PASSIVE_HINT = re.compile(
    r"\b(?:is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?\w+(?:ed|en)\b", re.I
)

SENT_INITIAL_CONJ = re.compile(r"(?:^|(?<=[.!?]\s))\s*(But|And|So|Yet|Or|Still|Then)\b")

LIST_MARKER = re.compile(r"^\s*(?:[-*•–]|\d+[.)])\s+", re.M)

DEFAULT_LEXICON = [
    "delve", "delve into", "tapestry", "pivotal", "crucial", "underscore",
    "underscores", "underscoring", "showcase", "showcases", "testament",
    "vibrant", "landscape", "nestled", "boasts", "in the heart of",
    "groundbreaking", "renowned", "interplay", "intricate", "intricacies",
    "foster", "fostering", "garner", "align with", "navigate", "navigating",
    "myriad", "plethora", "multifaceted", "multifarious", "ever-evolving",
    "ever-changing", "emblematic", "embody", "robust", "leverage", "seamless",
    "seamlessly", "holistic", "elevate", "elevates", "unlock", "unlocks",
    "harness", "harnessing", "realm", "cornerstone", "hallmark",
    "quintessential", "profound", "profoundly", "poignant", "resonate",
    "resonates", "resonance", "transformative", "embark", "utilize",
    "furthermore", "moreover", "additionally", "meticulous", "meticulously",
    "nuanced", "vital", "comprehensive", "notably", "significantly",
    "it is important to note", "stands as a testament", "serves as a reminder",
    "highlights the importance of", "reflects a broader trend",
    "represents a shift", "marks a moment", "indelible mark",
    "key turning point", "focal point", "holding space", "showing up",
    "doing the work", "in today's world", "in conclusion", "dive into",
    "at the end of the day", "when it comes to", "a game changer",
]

MD_EMPHASIS = re.compile(r"\*\*?([^*\n]{2,80}?)\*\*?")


def load_lexicon(path: Optional[str]) -> Tuple[List[str], str]:
    """
    Load flagged phrases. Plain text = one phrase per line (# comments allowed).
    Markdown = phrases pulled from *emphasis* spans, comma-split.
    """
    if not path:
        return DEFAULT_LEXICON, "built-in"
    with open(path, "r", encoding="utf-8") as fh:
        raw = fh.read()

    phrases: List[str] = []
    if path.lower().endswith((".md", ".markdown")):
        for span in MD_EMPHASIS.findall(raw):
            for part in span.split(","):
                p = re.sub(r"\([^)]*\)", "", part).strip().strip(".;:").lower()
                if p and len(p.split()) <= 5 and re.fullmatch(r"[a-z' \-]+", p):
                    phrases.append(p)
    else:
        for line in raw.splitlines():
            line = line.split("#", 1)[0].strip().lower()
            if line:
                phrases.append(line)

    seen, out = set(), []
    for p in phrases:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return (out or DEFAULT_LEXICON), (path if out else "built-in (file yielded nothing)")


def split_sentences(text: str) -> List[str]:
    out, start = [], 0
    for m in SENT_END.finditer(text):
        end = m.end(2)
        chunk = text[start:end].strip()
        head = chunk[:-len(m.group(1) + m.group(2))] if m.group(1) else chunk
        last = re.findall(r"[A-Za-z.]+$", head.strip())
        if last and last[0].lower().rstrip(".") in ABBREV:
            continue
        if chunk:
            out.append(chunk)
        start = m.end()
    tail = text[start:].strip()
    if tail:
        out.append(tail)
    return out


def ngram_set(seq: Sequence, n: int) -> List[Tuple]:
    return [tuple(seq[i:i + n]) for i in range(len(seq) - n + 1)]


def mattr(tokens: Sequence[str], window: int = 50) -> float:
    """Moving-average type-token ratio: length-robust lexical diversity."""
    if len(tokens) < window:
        return safe_div(len(set(tokens)), len(tokens))
    ratios = [
        len(set(tokens[i:i + window])) / window
        for i in range(0, len(tokens) - window + 1, max(1, window // 5))
    ]
    return _mean(ratios)


def stylometry(text: str, lexicon: Sequence[str]) -> Dict:
    words = WORD_RE.findall(text.lower())
    sentences = split_sentences(text)
    paragraphs = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    sent_lens = [len(WORD_RE.findall(s)) for s in sentences]
    sent_lens = [n for n in sent_lens if n > 0]
    para_lens = [len(WORD_RE.findall(p)) for p in paragraphs]
    para_lens = [n for n in para_lens if n > 0]

    n_words = len(words)
    per_1k = lambda c: round(safe_div(c, n_words) * 1000, 2)  # noqa: E731

    mu, sd = _mean(sent_lens), _sd(sent_lens)
    within_25 = sum(1 for n in sent_lens if mu and abs(n - mu) <= 0.25 * mu)

    counts = {ch: text.count(ch) for ch in ",;:!?"}
    em_dash = text.count("—")
    en_dash = text.count("–")

    lex_hits: Dict[str, int] = {}
    low = " " + re.sub(r"\s+", " ", text.lower()) + " "
    for phrase in lexicon:
        pat = r"(?<![a-z'])" + re.escape(phrase) + r"(?![a-z'])"
        c = len(re.findall(pat, low))
        if c:
            lex_hits[phrase] = c

    m = {
        "n_chars": len(text),
        "n_words": n_words,
        "n_sentences": len(sent_lens),
        "n_paragraphs": len(para_lens),

        # burstiness / rhythm
        "sent_len_mean": round(mu, 2),
        "sent_len_sd": round(sd, 2),
        "sent_len_cv": round(safe_div(sd, mu), 3),
        "sent_len_burstiness": round(safe_div(sd - mu, sd + mu), 3),
        "sent_len_min": min(sent_lens) if sent_lens else 0,
        "sent_len_median": round(statistics.median(sent_lens), 1) if sent_lens else 0,
        "sent_len_max": max(sent_lens) if sent_lens else 0,
        "sent_len_uniformity": round(safe_div(within_25, len(sent_lens)), 3),
        "para_len_mean": round(_mean(para_lens), 2),
        "para_len_cv": round(safe_div(_sd(para_lens), _mean(para_lens)), 3),

        # lexical diversity
        "type_token_ratio": round(safe_div(len(set(words)), n_words), 4),
        "mattr_50": round(mattr(words, 50), 4),
        "hapax_ratio": round(safe_div(
            sum(1 for w in set(words) if words.count(w) == 1), len(set(words))), 4)
        if n_words and len(words) <= 20000 else None,
        "word_len_mean": round(_mean([len(w) for w in words]), 2),
        "long_word_rate": round(safe_div(sum(1 for w in words if len(w) >= 7), n_words), 4),

        # repetition
        "distinct_2": round(safe_div(len(set(ngram_set(words, 2))), max(len(words) - 1, 1)), 4),
        "distinct_3": round(safe_div(len(set(ngram_set(words, 3))), max(len(words) - 2, 1)), 4),
        "repeated_4gram_rate": round(safe_div(
            len(ngram_set(words, 4)) - len(set(ngram_set(words, 4))),
            max(len(words) - 3, 1)), 4),

        # surface style
        "contractions_per_1k": per_1k(len(CONTRACTIONS.findall(text))),
        "ly_adverbs_per_1k": per_1k(len(LY_ADVERB.findall(text))),
        "passive_hint_per_1k": per_1k(len(PASSIVE_HINT.findall(text))),
        "sent_initial_conj_per_1k": per_1k(len(SENT_INITIAL_CONJ.findall(text))),
        "comma_per_1k": per_1k(counts[","]),
        "semicolon_per_1k": per_1k(counts[";"]),
        "colon_per_1k": per_1k(counts[":"]),
        "question_per_1k": per_1k(counts["?"]),
        "exclaim_per_1k": per_1k(counts["!"]),
        "em_dash_per_1k": per_1k(em_dash),
        "en_dash_per_1k": per_1k(en_dash),
        "list_markers": len(LIST_MARKER.findall(text)),

        # flagged vocabulary
        "lexicon_hits_total": sum(lex_hits.values()),
        "lexicon_per_1k": per_1k(sum(lex_hits.values())),
        "lexicon_distinct": len(lex_hits),
    }
    m["_lexicon_hits"] = dict(sorted(lex_hits.items(), key=lambda kv: -kv[1]))
    m["_em_dash_count"] = em_dash
    return m


# --------------------------------------------------------------------------
# optional: model-based perplexity + GLTR rank profile
# --------------------------------------------------------------------------

def model_metrics(text: str, model_name: str, stride: int = 512) -> Dict:
    try:
        import torch  # type: ignore
        from transformers import AutoModelForCausalLM, AutoTokenizer  # type: ignore
    except ImportError:
        return {
            "available": False,
            "reason": "needs `torch` and `transformers`:  pip install torch transformers",
        }

    tok = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    model.eval()

    ids = tok.encode(text, return_tensors="pt")
    if ids.shape[1] < 2:
        return {"available": False, "reason": "text too short to score"}

    max_len = getattr(model.config, "n_positions", None) or getattr(
        model.config, "max_position_embeddings", 1024)
    window = min(max_len, 1024)

    nlls: List[float] = []
    ranks: List[int] = []

    with torch.no_grad():
        for start in range(0, ids.shape[1] - 1, stride):
            chunk = ids[:, start:start + window]
            if chunk.shape[1] < 2:
                break
            logits = model(chunk).logits[0]
            logprobs = torch.log_softmax(logits[:-1], dim=-1)
            targets = chunk[0, 1:]
            tgt_lp = logprobs.gather(1, targets.unsqueeze(1)).squeeze(1)
            nlls.extend((-tgt_lp).tolist())
            greater = (logprobs > tgt_lp.unsqueeze(1)).sum(dim=1)
            ranks.extend(greater.tolist())

    if not nlls:
        return {"available": False, "reason": "no scoreable tokens"}

    buckets = {"top_10": 0, "top_100": 0, "top_1000": 0, "beyond_1000": 0}
    for r in ranks:
        if r < 10:
            buckets["top_10"] += 1
        elif r < 100:
            buckets["top_100"] += 1
        elif r < 1000:
            buckets["top_1000"] += 1
        else:
            buckets["beyond_1000"] += 1
    n = len(ranks)

    return {
        "available": True,
        "model": model_name,
        "tokens_scored": n,
        "perplexity": round(math.exp(_mean(nlls)), 3),
        "mean_nll": round(_mean(nlls), 4),
        "nll_sd": round(_sd(nlls), 4),
        "nll_burstiness_cv": round(safe_div(_sd(nlls), _mean(nlls)), 4),
        "rank_profile_pct": {k: round(100.0 * v / n, 2) for k, v in buckets.items()},
    }


# --------------------------------------------------------------------------
# baseline calibration
# --------------------------------------------------------------------------

NUMERIC_SKIP = {"n_chars", "n_words", "n_sentences", "n_paragraphs",
                "list_markers", "lexicon_hits_total", "lexicon_distinct"}


def baseline_compare(target: Dict, baselines: List[Dict], min_docs: int = 3) -> Dict:
    if len(baselines) < 2:
        return {"available": False,
                "reason": f"need at least 2 baseline documents, got {len(baselines)}"}

    keys = [k for k, v in target.items()
            if not k.startswith("_") and k not in NUMERIC_SKIP and isinstance(v, (int, float))]

    rows = []
    for k in keys:
        vals = [b[k] for b in baselines if isinstance(b.get(k), (int, float))]
        if len(vals) < 2:
            continue
        mu, sd = _mean(vals), _sd(vals)
        tv = target[k]
        z = safe_div(tv - mu, sd) if sd else 0.0
        rows.append({
            "metric": k, "target": tv,
            "baseline_mean": round(mu, 4), "baseline_sd": round(sd, 4),
            "z": round(z, 2),
        })

    rows.sort(key=lambda r: abs(r["z"]), reverse=True)
    outliers = [r for r in rows if abs(r["z"]) >= 2.0]
    return {
        "available": True,
        "n_baseline_docs": len(baselines),
        "underpowered": len(baselines) < min_docs,
        "rows": rows,
        "outliers": outliers,
        "n_outliers": len(outliers),
    }


# --------------------------------------------------------------------------
# reporting
# --------------------------------------------------------------------------

def rule(title: str = "", width: int = 72) -> str:
    if not title:
        return "-" * width
    return f"--- {title} " + "-" * max(0, width - len(title) - 5)


def fmt_p(p: float) -> str:
    if p == 0.0:
        return "< 1e-300"
    if p < 1e-4:
        return f"{p:.2e}"
    return f"{p:.5f}"


def render_report(rep: Dict, verbose: bool = True) -> str:
    L: List[str] = []
    add = L.append

    add("=" * 72)
    add(f"  TEXT PROVENANCE SCAN   {rep['source']}")
    add(f"  watermark_scan {__version__}")
    add("=" * 72)

    # --- hidden characters ---
    hc = rep["hidden_characters"]
    add("")
    add(rule("1. HIDDEN-CHARACTER PAYLOAD"))
    add(f"  Verdict : {hc['verdict']}")
    add(f"  {hc['summary']}")
    if hc["total"]:
        add("")
        for k, v in hc["counts"].items():
            if v:
                add(f"    {k:<22} {v}")
    if hc["tag_payload"]:
        add("")
        add(f"  DECODED HIDDEN TEXT: {hc['tag_payload']!r}")
    if hc["mixed_script_words"]:
        add("")
        add("  Mixed-script words:")
        for pos, w in hc["mixed_script_words"][:10]:
            add(f"    char {pos:<8} {w!r}")
    if verbose and hc["samples"]:
        add("")
        for cat, items in hc["samples"].items():
            for pos, cp, name in items[:5]:
                add(f"    {cat:<20} char {pos:<8} U+{cp:04X}  {name}")

    # --- greenlist ---
    gl = rep["greenlist"]
    add("")
    add(rule("2. GREEN-LIST WATERMARK (Kirchenbauer z-test)"))
    if gl.get("skipped"):
        add(f"  Skipped: {gl['skipped']}")
    else:
        p = gl["primary"]
        add(f"  Parameters : key={p['key']!r}  gamma={p['gamma']}  "
            f"context={p['context']}  scheme={p['scheme']}  dedup={p['dedup']}")
        add(f"  Tokenizer  : {rep['tokenizer']}")
        add("")
        add(f"  Tokens scored   : {p['scored_tokens']}")
        add(f"  Green tokens    : {p['green_tokens']}  "
            f"({p['green_fraction']*100:.2f}%, expected {p['expected_fraction']*100:.2f}%)")
        add(f"  z-score         : {p['z']:+.3f}")
        add(f"  p-value         : {fmt_p(p['p_value'])}")
        add("")
        add(f"  Verdict : {gl['verdict']}")
        for line in gl["interpretation"]:
            add(f"  {line}")

        if gl.get("windows", {}).get("best"):
            b = gl["windows"]["best"]
            add("")
            add(f"  Sliding-window max ({gl['windows']['tested']} windows tested):")
            add(f"    best z          : {b['z']:+.3f}  over {b['window_tokens']} tokens")
            add(f"    token span      : {b['start_index']}-{b['end_index']}")
            add(f"    green fraction  : {b['green_fraction']*100:.2f}%")
            add(f"    p (Bonferroni)  : {fmt_p(b['p_value_bonferroni'])}")

        if gl.get("key_scan"):
            ks = gl["key_scan"]
            add("")
            add(f"  Key scan ({ks['keys_tested']} keys, Bonferroni-corrected):")
            for r in ks["results"][:8]:
                add(f"    key={r['key']!r:<24} z={r['z']:+7.3f}  "
                    f"p_adj={fmt_p(r['p_value_bonferroni'])}")

    # --- stylometry ---
    st = rep["stylometry"]
    add("")
    add(rule("3. STYLOMETRY (descriptive - not a verdict)"))
    add(f"  {st['n_words']} words / {st['n_sentences']} sentences / "
        f"{st['n_paragraphs']} paragraphs")
    add("")
    add("  Rhythm")
    add(f"    sentence length      mean {st['sent_len_mean']}  sd {st['sent_len_sd']}  "
        f"cv {st['sent_len_cv']}")
    add(f"    range                min {st['sent_len_min']}  med {st['sent_len_median']}  "
        f"max {st['sent_len_max']}")
    add(f"    burstiness           {st['sent_len_burstiness']:+.3f}   "
        f"(higher = more varied; LLM prose trends low)")
    add(f"    uniformity           {st['sent_len_uniformity']:.3f}   "
        f"(fraction of sentences within 25% of mean)")
    add(f"    paragraph length     mean {st['para_len_mean']}  cv {st['para_len_cv']}")
    add("")
    add("  Lexical")
    add(f"    type-token ratio     {st['type_token_ratio']}")
    add(f"    MATTR-50             {st['mattr_50']}   (length-robust diversity)")
    if st.get("hapax_ratio") is not None:
        add(f"    hapax ratio          {st['hapax_ratio']}")
    add(f"    mean word length     {st['word_len_mean']}")
    add(f"    distinct-2 / -3      {st['distinct_2']} / {st['distinct_3']}")
    add(f"    repeated 4-grams     {st['repeated_4gram_rate']}")
    add("")
    add("  Surface style (per 1000 words)")
    add(f"    contractions {st['contractions_per_1k']:>7}   "
        f"-ly adverbs {st['ly_adverbs_per_1k']:>7}   "
        f"passive hint {st['passive_hint_per_1k']:>7}")
    add(f"    commas       {st['comma_per_1k']:>7}   "
        f"semicolons  {st['semicolon_per_1k']:>7}   "
        f"colons       {st['colon_per_1k']:>7}")
    add(f"    em dashes    {st['em_dash_per_1k']:>7}   "
        f"en dashes   {st['en_dash_per_1k']:>7}   "
        f"sent-init conj {st['sent_initial_conj_per_1k']:>5}")
    add(f"    questions    {st['question_per_1k']:>7}   "
        f"exclamations{st['exclaim_per_1k']:>7}   "
        f"list markers {st['list_markers']:>7}")

    add("")
    add(f"  Flagged vocabulary ({rep['lexicon_source']})")
    add(f"    {st['lexicon_hits_total']} hits across {st['lexicon_distinct']} distinct "
        f"phrases ({st['lexicon_per_1k']} per 1k words)")
    if st["_lexicon_hits"]:
        items = list(st["_lexicon_hits"].items())
        for phrase, c in items[:15]:
            add(f"      {c:>3}x  {phrase}")
        if len(items) > 15:
            add(f"      ... and {len(items) - 15} more")
    if st["_em_dash_count"]:
        add(f"    NOTE: {st['_em_dash_count']} em dash(es) present "
            f"(house rule: none in publishable drafts).")

    # --- model ---
    mm = rep.get("model_metrics")
    if mm:
        add("")
        add(rule("4. MODEL-BASED SCORES"))
        if not mm.get("available"):
            add(f"  Unavailable: {mm['reason']}")
        else:
            add(f"  Model            : {mm['model']}  ({mm['tokens_scored']} tokens)")
            add(f"  Perplexity       : {mm['perplexity']}")
            add(f"  Mean NLL         : {mm['mean_nll']}   sd {mm['nll_sd']}   "
                f"cv {mm['nll_burstiness_cv']}")
            add("  Token-rank profile (GLTR-style):")
            for k, v in mm["rank_profile_pct"].items():
                add(f"    {k:<14} {v:>6.2f}%")
            add("  Machine text concentrates in top-10; human text has a fatter tail.")
            add("  This is relative to THIS model, not to 'AI' in general.")

    # --- baseline ---
    bl = rep.get("baseline")
    if bl:
        add("")
        add(rule("5. BASELINE CALIBRATION"))
        if not bl.get("available"):
            add(f"  Unavailable: {bl['reason']}")
        else:
            add(f"  Compared against {bl['n_baseline_docs']} reference document(s).")
            if bl["underpowered"]:
                add("  WARNING: fewer than 3 reference docs. Treat z-scores as indicative.")
            add("")
            if bl["outliers"]:
                add(f"  {bl['n_outliers']} metric(s) more than 2 SD from your baseline:")
                for r in bl["outliers"][:15]:
                    add(f"    {r['metric']:<26} {r['target']:>10}  "
                        f"baseline {r['baseline_mean']:>9} +/- {r['baseline_sd']:<8} "
                        f"z={r['z']:+.2f}")
            else:
                add("  No metric deviates more than 2 SD from your baseline.")
                add("  This document is statistically ordinary for this corpus.")

    # --- how to read ---
    add("")
    add(rule("HOW TO READ THIS"))
    for line in rep["notes"]:
        add(f"  {line}")
    add("")
    return "\n".join(L)


NOTES = [
    "Section 1 is the only section that can prove something on its own. Tag-block",
    "characters do not occur by accident; they are a payload someone inserted.",
    "",
    "Section 2 is a keyed test. A high z is strong evidence a watermark is present",
    "under the parameters you supplied. A low z means only that THOSE parameters",
    "found nothing - it is not evidence the text is unwatermarked, and it is not",
    "evidence of human authorship. Without the generator's secret key, tokenizer",
    "and gamma, a negative result carries almost no information. Below ~200 scored",
    "tokens the z-test is unreliable in either direction.",
    "",
    "Section 3 is descriptive statistics. No threshold here separates human from",
    "machine writing. Published detectors built on these features have documented",
    "false-positive rates that fall hardest on non-native English writers and on",
    "plain, declarative prose. Do not read a verdict into these numbers; read them",
    "as a description of the document's shape.",
    "",
    "The strongest use of this tool is Section 5: compare a document against a",
    "corpus of your own known-authored writing. 'Unusual for this author' is a",
    "question the statistics can actually answer. 'Written by a machine' is not.",
]


# --------------------------------------------------------------------------
# orchestration
# --------------------------------------------------------------------------

def read_text(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return fh.read()


def expand_paths(patterns: Iterable[str]) -> List[str]:
    out: List[str] = []
    for pat in patterns:
        if pat == "-" or os.path.isfile(pat):
            out.append(pat)
            continue
        hits = sorted(glob.glob(pat, recursive=True))
        if os.path.isdir(pat):
            hits = sorted(
                os.path.join(dp, f)
                for dp, _, fs in os.walk(pat)
                for f in fs
                if f.lower().endswith((".md", ".txt", ".markdown"))
            )
        if not hits:
            raise SystemExit(f"no such file or pattern: {pat}")
        out.extend(h for h in hits if os.path.isfile(h))
    return out


def analyze(text: str, source: str, args, lexicon: Sequence[str],
            lexicon_source: str) -> Dict:
    rep: Dict = {
        "version": __version__,
        "source": source,
        "tokenizer": args.tokenizer,
        "lexicon_source": lexicon_source,
        "notes": NOTES,
    }

    rep["hidden_characters"] = scan_hidden_characters(text)

    tokens = tokenize(text, args.tokenizer)
    if len(tokens) <= args.context:
        rep["greenlist"] = {"skipped": "not enough tokens to score"}
    else:
        primary = greenlist_test(
            tokens, key=args.key, gamma=args.gamma, context=args.context,
            scheme=args.scheme, dedup=not args.no_dedup,
        )
        gl: Dict = {"primary": {k: v for k, v in primary.items()
                                if not k.startswith("_")}}

        if args.windows:
            gl["windows"] = window_scan(primary)

        if args.keys:
            with open(args.keys, "r", encoding="utf-8") as fh:
                keys = [ln.strip() for ln in fh
                        if ln.strip() and not ln.startswith("#")]
            gl["key_scan"] = key_scan(
                tokens, keys, gamma=args.gamma, context=args.context,
                scheme=args.scheme, dedup=not args.no_dedup,
            )

        z = primary["z"]
        underpowered = primary["scored_tokens"] < MIN_RELIABLE_TOKENS
        if underpowered:
            gl["verdict"] = "INCONCLUSIVE (too short)"
            gl["interpretation"] = [
                f"Only {primary['scored_tokens']} tokens scored; "
                f"{MIN_RELIABLE_TOKENS}+ needed for a usable z-test.",
            ]
        elif z >= args.z_threshold:
            gl["verdict"] = "SIGNAL DETECTED"
            gl["interpretation"] = [
                "Green-token rate exceeds chance by more than the detection",
                f"threshold (z >= {args.z_threshold}). Under the tested key,",
                "tokenizer and gamma, this is consistent with a watermark.",
                "Confirm by re-running on a text you know to be unwatermarked",
                "from the same source before relying on it.",
            ]
        elif z >= 2.0:
            gl["verdict"] = "WEAK / AMBIGUOUS"
            gl["interpretation"] = [
                "Elevated but below the detection threshold. Repetitive prose,",
                "quotation and boilerplate all push z up on their own.",
                "Do not treat this as a positive.",
            ]
        else:
            gl["verdict"] = "NO SIGNAL under tested parameters"
            gl["interpretation"] = [
                "The green-token rate is consistent with chance FOR THESE",
                "PARAMETERS. This does not indicate the text is unwatermarked,",
                "and says nothing about who or what wrote it. A different key,",
                "tokenizer or gamma would be a different test entirely.",
            ]
        rep["greenlist"] = gl

    rep["stylometry"] = stylometry(text, lexicon)

    if args.model:
        rep["model_metrics"] = model_metrics(text, args.model)

    if args.baseline:
        docs = expand_paths(args.baseline)
        docs = [d for d in docs if os.path.abspath(d) != os.path.abspath(source)]
        base_metrics = [stylometry(read_text(d), lexicon) for d in docs]
        rep["baseline"] = baseline_compare(rep["stylometry"], base_metrics)
        if rep["baseline"].get("available"):
            rep["baseline"]["documents"] = docs

    return rep


# --------------------------------------------------------------------------
# self-test
# --------------------------------------------------------------------------

def selftest() -> int:
    import random
    rng = random.Random(20260815)
    failures: List[str] = []

    def check(name: str, cond: bool, detail: str = "") -> None:
        status = "ok  " if cond else "FAIL"
        print(f"  [{status}] {name}" + (f"  {detail}" if detail else ""))
        if not cond:
            failures.append(name)

    print("watermark_scan self-test")
    print(rule())

    # -- z-test math --
    print("statistics")
    check("normal_sf(0) == 0.5", abs(normal_sf(0.0) - 0.5) < 1e-12)
    check("normal_sf(1.96) ~ 0.025", abs(normal_sf(1.96) - 0.025) < 5e-4,
          f"got {normal_sf(1.96):.5f}")
    check("normal_sf(4) ~ 3.17e-5", abs(normal_sf(4.0) - 3.167e-5) < 1e-7,
          f"got {normal_sf(4.0):.3e}")

    # -- green-list separation --
    print("green-list detector")
    key, gamma, vocab = "test-key-42", 0.25, [f"w{i}" for i in range(600)]

    def synth_watermarked(n: int) -> List[str]:
        """Emulate a watermarked generator: always emit a green token."""
        seq = [rng.choice(vocab)]
        while len(seq) < n:
            for _ in range(400):
                cand = rng.choice(vocab)
                if is_green((seq[-1],), cand, key, gamma, "lefthash"):
                    seq.append(cand)
                    break
            else:
                seq.append(rng.choice(vocab))
        return seq

    def synth_plain(n: int) -> List[str]:
        return [rng.choice(vocab) for _ in range(n)]

    wm = greenlist_test(synth_watermarked(500), key=key, gamma=gamma)
    pl = greenlist_test(synth_plain(500), key=key, gamma=gamma)
    check("watermarked text scores z > 8", wm["z"] > 8.0, f"z={wm['z']:+.2f}")
    check("unwatermarked text scores |z| < 3", abs(pl["z"]) < 3.0, f"z={pl['z']:+.2f}")
    check("watermarked green fraction ~ 1.0", wm["green_fraction"] > 0.95,
          f"{wm['green_fraction']:.3f}")
    check("plain green fraction ~ gamma", abs(pl["green_fraction"] - gamma) < 0.06,
          f"{pl['green_fraction']:.3f}")

    wrong = greenlist_test(synth_watermarked(500), key="wrong-key", gamma=gamma)
    check("wrong key sees no signal", abs(wrong["z"]) < 3.0, f"z={wrong['z']:+.2f}")

    # -- false-positive rate on random text --
    print("false-positive rate (200 trials of 300 random tokens)")
    fps = sum(1 for _ in range(200)
              if greenlist_test(synth_plain(300), key=key, gamma=gamma)["z"] >= 4.0)
    check("FP rate at z>=4 is under 1%", fps <= 2, f"{fps}/200")

    # -- dedup guards against repetition --
    print("repetition guard")
    rep_seq = (["alpha", "beta", "gamma", "delta"] * 80)
    dd = greenlist_test(rep_seq, key=key, gamma=gamma, dedup=True)
    nd = greenlist_test(rep_seq, key=key, gamma=gamma, dedup=False)
    check("dedup scores far fewer tokens", dd["scored_tokens"] < nd["scored_tokens"] / 10,
          f"{dd['scored_tokens']} vs {nd['scored_tokens']}")

    # -- windows find a planted span --
    print("sliding-window scan")
    mixed = synth_plain(400) + synth_watermarked(300) + synth_plain(400)
    full = greenlist_test(mixed, key=key, gamma=gamma)
    win = window_scan(full)
    check("window z beats whole-document z",
          win["best"] and win["best"]["z"] > full["z"],
          f"window {win['best']['z']:+.2f} vs full {full['z']:+.2f}")
    check("window lands inside the planted span",
          win["best"] and 300 <= win["best"]["start_index"] <= 760,
          f"start={win['best']['start_index']}")

    # -- hidden characters --
    print("hidden-character scan")
    clean = scan_hidden_characters("A perfectly ordinary sentence, nothing hidden.")
    check("clean text is CLEAN", clean["verdict"] == "CLEAN", clean["verdict"])

    zw = scan_hidden_characters("Hello​world​ test")
    check("zero-width flagged", zw["verdict"] == "SUSPICIOUS", zw["verdict"])
    check("zero-width counted", zw["counts"]["zero_width"] == 2)

    payload = "".join(chr(0xE0000 + ord(c)) for c in "ID:42")
    tb = scan_hidden_characters("Normal text." + payload)
    check("tag block CONFIRMED", tb["verdict"] == "CONFIRMED", tb["verdict"])
    check("tag payload decoded", tb["tag_payload"] == "ID:42", repr(tb["tag_payload"]))

    hg = scan_hidden_characters("The pаssword is secret")  # Cyrillic a
    check("homoglyph flagged", hg["verdict"] == "SUSPICIOUS", hg["verdict"])
    check("mixed-script word caught", len(hg["mixed_script_words"]) == 1)

    # -- stylometry sanity --
    print("stylometry")
    uniform = " ".join(["The cat sat on the mat today."] * 20)
    varied = ("Rain. The convoy stopped where the road gave out, and for a long "
              "while nobody said anything at all, because there was nothing to "
              "say that would change the shape of it. Then Ruiz laughed. "
              "It was not a good sound.")
    su = stylometry(uniform, DEFAULT_LEXICON)
    sv = stylometry(varied, DEFAULT_LEXICON)
    check("uniform text has low sentence-length cv", su["sent_len_cv"] < 0.05,
          f"cv={su['sent_len_cv']}")
    check("varied text has higher cv", sv["sent_len_cv"] > su["sent_len_cv"],
          f"{sv['sent_len_cv']} > {su['sent_len_cv']}")
    check("uniform text flagged as repetitive",
          su["repeated_4gram_rate"] > 0.8, f"{su['repeated_4gram_rate']}")

    lex = stylometry("We must delve into the rich tapestry and leverage a "
                     "holistic paradigm.", DEFAULT_LEXICON)
    check("lexicon catches known tells", lex["lexicon_hits_total"] >= 4,
          f"{lex['lexicon_hits_total']} hits: {list(lex['_lexicon_hits'])}")

    print("sentence splitting")
    sents = split_sentences("Dr. Rowe went home. She slept. Did she? Yes!")
    check("abbreviation does not split", len(sents) == 4, f"{len(sents)}: {sents}")

    print("baseline calibration")
    human_samples = [
        "The engine would not turn over. Cold morning, dead battery, and a bus "
        "to catch in twenty minutes. I walked instead and got there early.",
        "She read the letter twice. The first time for the words, the second "
        "for what sat underneath them, which was worse. Nobody writes like that "
        "unless they mean it.",
        "Markets fell again. Analysts blamed the weather, then the Fed, then "
        "each other. By Friday the number had climbed back and everyone claimed "
        "they had called it.",
        "My grandfather kept bees. Forty hives on a hill that caught the wind "
        "wrong every spring. He lost half of them one year and started over "
        "without a word of complaint.",
        "The trail forked at the ridge. Left was shorter and meaner; right went "
        "long around the lake. We argued about it, took the left, and regretted "
        "it for six hard miles.",
        "Testing takes patience nobody has. You write the case, watch it fail, "
        "fix the code, watch it pass, and then some other thing breaks two "
        "files over. That is the job.",
    ]
    base = [stylometry(s, DEFAULT_LEXICON) for s in human_samples]
    # A document that is machine-uniform should read as an outlier against
    # genuinely varied human writing.
    bc = baseline_compare(stylometry(uniform, DEFAULT_LEXICON), base)
    check("baseline flags the machine-uniform outlier",
          bc["available"] and bc["n_outliers"] > 0,
          f"{bc.get('n_outliers')} outliers")
    # A held-out human sample should be roughly ordinary against the rest.
    bc2 = baseline_compare(base[0], base[1:])
    check("baseline treats a held-out human doc as ordinary-ish",
          bc2["available"] and bc2["n_outliers"] <= 4,
          f"{bc2.get('n_outliers')} outliers")

    print(rule())
    if failures:
        print(f"FAILED: {len(failures)} check(s): {', '.join(failures)}")
        return 1
    print("All checks passed.")
    return 0


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="watermark_scan.py",
        description="Score text for watermark and machine-generation signals. "
                    "Measures only; never modifies text.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  watermark_scan.py draft.md\n"
            "  watermark_scan.py draft.md --windows --key 15485863\n"
            "  watermark_scan.py draft.md --baseline 'archive/**/*.md'\n"
            "  cat draft.txt | watermark_scan.py -\n"
            "  watermark_scan.py --selftest\n"
        ),
    )
    p.add_argument("paths", nargs="*", help="files to scan, or - for stdin")
    p.add_argument("--selftest", action="store_true",
                   help="run built-in verification of the detector and exit")

    g = p.add_argument_group("green-list watermark test")
    g.add_argument("--key", default=DEFAULT_KEY,
                   help=f"secret hash key (default {DEFAULT_KEY}, the reference "
                        "implementation's public default)")
    g.add_argument("--keys", metavar="FILE",
                   help="file of candidate keys, one per line; scans all and "
                        "Bonferroni-corrects")
    g.add_argument("--gamma", type=float, default=DEFAULT_GAMMA,
                   help=f"green-list fraction (default {DEFAULT_GAMMA})")
    g.add_argument("--context", type=int, default=1,
                   help="number of preceding tokens seeding the green list (default 1)")
    g.add_argument("--scheme", default="lefthash",
                   choices=["lefthash", "sumhash", "minhash"],
                   help="context hashing scheme (default lefthash)")
    g.add_argument("--tokenizer", default="word",
                   help="word | wordcase | char | hf:MODEL (default word). "
                        "hf: requires transformers and should match the generator")
    g.add_argument("--no-dedup", action="store_true",
                   help="score repeated (context, token) pairs more than once "
                        "(inflates z on repetitive text)")
    g.add_argument("--windows", action="store_true",
                   help="sliding-window scan for a partially watermarked span")
    g.add_argument("--z-threshold", type=float, default=DEFAULT_Z_THRESHOLD,
                   help=f"z at which to report a detection (default {DEFAULT_Z_THRESHOLD})")

    o = p.add_argument_group("other measurements")
    o.add_argument("--model", metavar="NAME",
                   help="causal LM for perplexity and token-rank profile, e.g. gpt2 "
                        "(needs torch + transformers)")
    o.add_argument("--lexicon", metavar="FILE",
                   help="flagged-phrase list; .md files are parsed from emphasis "
                        "spans, otherwise one phrase per line")
    o.add_argument("--baseline", nargs="+", metavar="PATH",
                   help="reference documents of known authorship to calibrate "
                        "stylometry against (files, dirs or globs)")

    f = p.add_argument_group("output")
    f.add_argument("--json", action="store_true", help="emit JSON instead of a report")
    f.add_argument("--quiet", action="store_true", help="omit per-character samples")
    return p


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)

    if args.selftest:
        return selftest()

    if not args.paths:
        build_parser().print_help()
        return 2

    lexicon, lex_source = load_lexicon(args.lexicon)
    paths = expand_paths(args.paths)

    reports = []
    for path in paths:
        text = read_text(path)
        if not text.strip():
            print(f"[skip] {path}: empty", file=sys.stderr)
            continue
        reports.append(analyze(text, path if path != "-" else "<stdin>",
                               args, lexicon, lex_source))

    if not reports:
        print("nothing to scan", file=sys.stderr)
        return 1

    if args.json:
        for r in reports:
            r.get("stylometry", {}).pop("_em_dash_count", None)
        print(json.dumps(reports if len(reports) > 1 else reports[0],
                         indent=2, default=str))
    else:
        for i, r in enumerate(reports):
            if i:
                print("\n")
            print(render_report(r, verbose=not args.quiet))

    return 0


if __name__ == "__main__":
    sys.exit(main())
