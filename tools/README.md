# tools/

## `watermark_scan.py`

A measurement harness that scores text for provenance signals and reports what
each signal does and does not support. It **measures only** — it never edits,
paraphrases, or strips anything from the text.

Three independent sections:

1. **Hidden-character payload** — zero-width characters, Unicode tag-block
   steganography, variation selectors, bidi controls, homoglyph substitution.
   Deterministic. The only section that can prove something on its own.
2. **Green-list watermark** — a keyed z-test (Kirchenbauer et al.). Strong
   evidence *when the key, tokenizer and gamma match generation*; a low score
   proves almost nothing.
3. **Stylometry** — burstiness, lexical diversity, repetition, punctuation, and
   flagged "AI-tell" vocabulary. Descriptive only; never a human-vs-machine
   verdict.

Optional (`--model`, needs `torch` + `transformers`): perplexity and a
GLTR-style token-rank profile.

### Quick start

```bash
python3 tools/watermark_scan.py draft.md            # scan a file
python3 tools/watermark_scan.py draft.md --windows  # look for a partial mark
python3 tools/watermark_scan.py draft.md --baseline 'archive/**/*.md'
python3 tools/watermark_scan.py --selftest          # verify the detector
```

Pure Python standard library (3.8+). Run `--help` for all options, and see the
`watermark-scan` skill in `.claude/skills/` for guidance on interpreting and
reporting results honestly.

### Why measure and not remove

A detector that only tells you a mark is present is a defensive tool: it lets
you find a hidden payload in text you received, or check that your own writing
isn't being falsely flagged. A tool that removed marks would be for passing
machine text off as human-authored. This one deliberately stops at measurement.