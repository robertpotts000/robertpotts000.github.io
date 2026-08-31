# CLAUDE.md

Robert Potts's portfolio site — an Astro static site (About, Editing, and a
Journalism archive) published to GitHub Pages at robertpotts.co.uk.

Two other documents carry the detail, and this file deliberately doesn't repeat
them:

- **`.claude/skills/add-piece/`** — the publishing workflow (filenames, document
  tags, cover images, metadata, build, commit, push). Use the skill for any job
  that touches the archive.
- **`README.md`** — Robert's own plain-language version of the same jobs, written
  for him to follow without Claude. If a step changes, both need updating.

Everything below is what doesn't fit in either: how Robert wants to be worked
with, and the things about this repo that have actually caused mistakes.

## Working with Robert

These are settled preferences, learned in practice. Follow them without being
asked.

- **He's a writer and editor, not a developer.** Explain in plain language, name
  files by their full path, and describe actions the way they appear on screen
  (File Explorer, Command Prompt) rather than assuming a dev toolchain. Anything
  written *for* him — README, reports, questions — should read that way too.
- **The words on the site are his.** Headlines, subheadings, biography, the text
  of a piece: never invent, paraphrase or "improve" them. If something is
  missing, ask. You may offer a draft only when it's clearly labelled a
  suggestion, and only use it if he says yes.
- **Ask for everything missing in one message.** Not one question at a time.
- **The source document is the source of truth.** Metadata comes from the
  `.docx` filename and the tags inside the document; body text comes from the
  document. Fix problems there, never in generated output
  (`src/pieces/html/*.html`) — a re-run of `npm run convert` wipes such edits and
  the original fault resurfaces.
- **Finish the job.** A piece isn't added until the build passes and the change
  is pushed; he expects the live URL back, not a handoff. The one hard stop is a
  failing build — never push one, and say plainly what broke.
- **Don't add what he didn't ask for.** `details` and `publication` are stored
  but deliberately not rendered anywhere; the About and Editing pages still carry
  placeholder copy he intends to write himself. Leave all of it alone unless he
  raises it. No new fields, pages, or markup on your own initiative.
- **Stage explicit paths — never `git add -A`.** (His own README tells *him* to
  use `git add -A`, which is fine for him; that asymmetry is intentional, don't
  "fix" it.)

## Repo facts that bite

**Push target.** The local branch is `master` but tracks `origin/main`, so plain
`git push` fails with an upstream mismatch. Always:

```
git push origin HEAD:main
```

**`<details>Null</details>` is not an error.** The literal string `"Null"` in a
piece's `<details>` tag or its JSON `"details"` field is his documented
convention for "no details" (see `README.md`) and nearly every piece uses it.
Don't flag it and don't try to make it empty or omitted.

**Files on disk are CRLF.** `core.autocrlf=true`, no `.gitattributes`, so the
repo stores LF and checks out CRLF. A multi-line string match against a file read
from disk will silently fail: normalise to LF before matching, and write back
CRLF (or rewrite the whole file in LF — just don't leave one file mixed).

**Windows, OneDrive, Word.** No `python3` — script in Node. Word leaves `~$…docx`
lock files (the converter skips them) and holds the real file open, so writing to
a `.docx` you just read can fail with `EBUSY`; write to a new filename and move it
over. `mammoth` is the docx→HTML converter, `jszip` is available for raw
docx/zip surgery.

**A tag the converter says is missing is usually a typo.** Most often a dropped
`>` after the opening tag name (`<headlineSome Title>`), which leaks into the
body as escaped text. Diagnosis and the full repair procedure — including
patching a `.docx` without Word — is in
`.claude/skills/add-piece/reference/docx-repair.md`. Check for the typo before
asking him to redo anything by hand.

## Keeping this current

When Robert corrects you or states a preference, write it down before the session
ends:

- a preference about *how* to work → a bullet under **Working with Robert**
- a repo behaviour that caused a mistake → **Repo facts that bite**
- a change to the publishing steps → `.claude/skills/add-piece/SKILL.md`, and
  `README.md` too if it changes anything he does by hand

Keep this file short enough that it's always worth reading in full; long
procedures belong in the skill's `reference/` folder.
