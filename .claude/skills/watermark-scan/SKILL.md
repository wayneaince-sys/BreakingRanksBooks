---
name: watermark-scan
description: "Measure a piece of text for provenance signals — hidden-character payloads (zero-width, Unicode tag-block, homoglyphs), green-list statistical watermarks (Kirchenbauer z-test), and stylometry (burstiness, lexical diversity, AI-tell vocabulary). Use when someone asks whether a text is watermarked, carries a hidden mark, was machine-generated or AI-written, or whether Wayne's own writing risks being falsely flagged by an AI detector. Also for building a personal baseline so 'unusual for this author' can be answered honestly. This skill only measures and reports; it never edits or strips text. Trigger on: 'is this watermarked', 'hidden characters', 'zero-width', 'check for a watermark', 'was this AI-generated', 'will this get flagged', 'AI detector', 'false positive', 'provenance', 'scan this text'."
---

# Watermark & provenance scan

## What this does, and what it refuses to do

This skill runs `tools/watermark_scan.py`, a measurement harness. It answers
three separate questions and keeps them separate, because they carry very
different evidentiary weight:

1. **Is there a hidden payload in the characters?** Zero-width text, Unicode
   tag-block steganography, homoglyph swaps, bidi controls. This is the only
   question the tool answers *decisively* — those characters do not appear by
   accident.
2. **Does a specific green-list watermark fire?** A keyed statistical test
   (Kirchenbauer et al.). A high z-score is strong evidence *under the
   parameters you supply*. A low score proves almost nothing.
3. **What is the document's statistical shape?** Burstiness, lexical
   diversity, repetition, punctuation, flagged vocabulary. Descriptive only.
   Never a verdict on human-vs-machine.

The tool reads text and prints numbers. It does **not** modify text, remove
marks, paraphrase, or "clean" anything. If the request is to strip a watermark
or defeat a detector, this skill is the wrong tool — say so. Stripping
provenance from text so it passes as human-authored is exactly what this skill
is built *not* to do. Measuring is fine; laundering is not.

## The honest framing — say this when it matters

No statistic in section 3, and no single result in section 2, can prove a
document was or wasn't written by an AI. Public AI-text detectors have
documented false-positive rates that land hardest on plain declarative prose
and on non-native-English writers. For an author, the dangerous failure is the
**false accusation**: a human-written chapter flagged as machine output.

So the tool earns its keep on two questions it can actually answer:

- Catching a real **hidden payload** (section 1). Real, and provable.
- Building a **baseline of the author's own known writing** so the honest
  question — "is this document unusual *for this author*?" — can be tested
  (section 5). "Unusual for Wayne" is answerable. "Written by a machine" is not.

Lead with this framing whenever the user's real worry is being falsely flagged.

## How to run it

The script is pure standard library — nothing to install for the core scan.

```bash
# basic scan of one file (all three sections)
python3 tools/watermark_scan.py draft.md

# read from stdin (e.g. pasted text)
pbpaste | python3 tools/watermark_scan.py -

# suspect a partial or spliced watermark: sliding-window scan
python3 tools/watermark_scan.py draft.md --windows

# test many candidate keys at once (Bonferroni-corrected)
python3 tools/watermark_scan.py draft.md --keys candidate_keys.txt

# the high-value mode: calibrate against the author's own corpus
python3 tools/watermark_scan.py draft.md --baseline 'archive/**/*.md'

# scan a whole folder; machine-readable output
python3 tools/watermark_scan.py chapters/ --json > report.json

# verify the detector itself still works
python3 tools/watermark_scan.py --selftest
```

Optional model-based perplexity + GLTR token-rank profile (needs `torch` and
`transformers`; the tokenizer should match the suspected generator):

```bash
python3 tools/watermark_scan.py draft.md --model gpt2
python3 tools/watermark_scan.py draft.md --tokenizer hf:gpt2 --key <secret>
```

## Reuse Wayne's own AI-tell vocabulary

The stylometry section flags cliché "AI voice" phrases. By default it uses a
built-in list, but the repo's `anti-ai-writing-style` skill already ships a
curated one. Point the scanner at it so the flags match the house style:

```bash
python3 tools/watermark_scan.py draft.md \
  --lexicon ~/.claude/skills/synced/anti-ai-writing-style/references/banned-vocabulary.md
```

The `.md` loader pulls phrases from the file's `*emphasis*` spans. A plain
`.txt` file (one phrase per line, `#` comments allowed) also works.

## Reading the output back to the user

Translate; don't dump the raw report. Cover the sections in order of strength:

- **Section 1 first, plainly.** `CONFIRMED` → there is a hidden payload; show
  the decoded string. `SUSPICIOUS` (zero-width / homoglyph) → invisible or
  look-alike characters are present, which is often a mark but sometimes just
  messy copy-paste; recommend they retype or run the text through a plain-text
  normalizer. `CLEAN` → nothing hidden in the code points.
- **Section 2 with its caveat attached.** `SIGNAL DETECTED` means the tested
  key/gamma/tokenizer fired — real evidence, but name the parameters and
  suggest confirming against a known-unwatermarked sample from the same
  source. `NO SIGNAL` means *those* parameters found nothing; it is **not**
  proof of human authorship and **not** proof the text is unwatermarked. Below
  ~200 scored tokens, say the test is underpowered and stop there.
- **Section 3 as description, never verdict.** Report burstiness, diversity,
  and any flagged phrases as "here is the shape of this document," and if the
  user is worried about detectors, say explicitly that these numbers are not a
  test of authorship. If flagged AI-tell vocabulary shows up in Wayne's own
  draft, that is a cue to hand off to the `anti-ai-writing-style` skill for a
  rewrite — not evidence the draft is machine-written.
- **Section 5 (baseline) is the payoff when it's available.** "This document
  is statistically ordinary for your corpus" or "these N metrics sit more than
  2 SD from your usual" is the most defensible thing the tool can say. Push the
  user toward this mode whenever they have a body of their own past work.

## Practical playbooks

**"Is this text I received watermarked / does it have a hidden mark?"**
Run the basic scan, then `--windows` if section 2 is ambiguous. Section 1 is
the decisive part. If candidate keys are known or guessable, put them in a file
and use `--keys`.

**"Will my chapter get flagged by an AI detector?"**
Reframe honestly first: detectors are unreliable and false-positive-prone. Run
the scan against a `--baseline` of Wayne's published work. If the draft is
ordinary for his corpus, that is his evidence. If section 3 lights up with
AI-tell vocabulary, route to `anti-ai-writing-style` to fix the prose itself.

**"Someone accused my writing of being AI."**
Section 5 baseline plus draft-history is the rebuttal. The tool provides the
statistical half: "this reads as ordinary for this author's established
corpus." Pair it with timestamped revision history where available.

## Maintenance

`python3 tools/watermark_scan.py --selftest` verifies the z-test math, the
green-list separation, the false-positive rate, the sliding-window scan, the
hidden-character detectors, sentence splitting, and baseline calibration. Run
it after any edit to the script. All checks must pass.

## Files

- `tools/watermark_scan.py` — the harness (pure stdlib; `--selftest` built in).
- This skill — how and when to use it, and how to report results honestly.
  