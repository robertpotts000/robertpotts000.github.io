# CLAUDE.md

Guidance for Claude Code working in this repo.

## Adding a piece

Use the `add-piece` skill (`.claude/skills/add-piece/`) for the full workflow —
filename convention, tag extraction, metadata schema, thumbnail rules, build
verification, commit/push. `README.md` is Robert's own plain-language version
of the same process. Don't duplicate that guidance here; this file only holds
gotchas discovered in practice that aren't (yet) written into the skill.

## Pushing

The local branch is `master` but tracks `origin/main` — plain `git push` fails
with an upstream-mismatch error. Push explicitly:

```
git push origin HEAD:main
```

## `<details>Null</details>` is not an error

If a piece's `<details>` tag (or the JSON's `"details"` field) is the literal
string `"Null"`, that's Robert's documented convention for "no details" (see
`README.md`) — every existing piece uses it. Don't flag it, don't try to make
it empty/omitted instead.

## Malformed `<headline>`/`<subheading>` tags

If `npm run convert` reports a piece is missing `headline` or `subheading`
even though the document visibly has `<headline>...</headline>` /
`<subheading>...</subheading>` text at the top, check for a typo before asking
Robert to redo it by hand — the most common one is a missing `>` right after
the opening tag name (e.g. `<headlineSome Title></headline>`). The extractor
in `scripts/convert-docs.mjs` matches the literal string `<headline>`, so a
missing bracket means the tag isn't recognised, gets left in place, and leaks
into the article body as garbled escaped text (`&lt;headlineSome Title...`).

**Fix it in the source `.docx`, never in the generated `src/pieces/html/*.html`
or by hand-writing the JSON** — a re-run of `npm run convert` would silently
wipe a hand-edit of the generated files, and the same typo would resurface if
the doc is ever reconverted.

To patch a `.docx` (it's a zip of XML) when Word isn't available in-session:

1. Unzip it (`unzip` via Bash, or `Expand-Archive` in PowerShell) to a scratch
   folder.
2. Find the malformed run in `word/document.xml` — Word usually splits a
   run-on phrase like `<headlineThrough the oval window>` across several
   `<w:r><w:t>...</w:t></w:r>` elements (spell-check often wraps the
   concatenated word in `<w:proofErr>` tags). Insert or move a `&gt;` run so
   the encoded text reads exactly `&lt;headline&gt;...&lt;/headline&gt;` —
   check the *whole* tag, not just the opening: a doc can have a stray extra
   `&gt;` near the closing tag as well as a missing one at the opening.
3. Rebuild the archive with the `jszip` package (already in
   `node_modules`) — **not** PowerShell's `Compress-Archive`, which produces a
   zip that mammoth rejects with `Could not find main document part`. A
   minimal rebuild:

   ```js
   const JSZip = require('jszip');
   // read every file under the unzipped folder, zip.file(relPath, buffer),
   // then zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
   ```

4. Write the rebuilt file to a **new** filename first, then move it over the
   original — writing straight back to the original path can hit `EBUSY`
   (OneDrive file lock) if it was just read.
5. Delete any stale `src/data/pieces/<slug>.json` the converter wrote before
   the fix (it won't overwrite an existing metadata file), then re-run
   `npm run convert`.
6. There's no `python3` in this environment — do XML/zip work in Node.

## Environment

- No `python3` available (Windows, no Python install). Use Node for scripting.
- `mammoth` is the docx→HTML converter (`npm run convert` /
  `scripts/convert-docs.mjs`); `jszip` is available for raw docx/zip surgery.
