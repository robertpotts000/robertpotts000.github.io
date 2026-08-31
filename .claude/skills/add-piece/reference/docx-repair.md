# Repairing a malformed tag in a `.docx`

For when `npm run convert` reports a piece as missing `headline` or `subheading`
even though the document visibly has the tag at the top.

## Diagnose first

The extractor in `scripts/convert-docs.mjs` matches the **literal** string
`<headline>` (as `&lt;headline&gt;` in mammoth's escaped output). The usual cause
is a missing `>` right after the opening tag name — `<headlineSome Title>` — so
the tag isn't recognised, isn't stripped, and leaks into the article body as
garbled escaped text.

Check for it before asking Robert to redo anything:

```bash
grep -o '&lt;[a-z]*[^&]\{0,40\}' src/pieces/html/<slug>.html | head
```

Check the **whole** tag, not just the opening — a document can have a stray extra
`>` near the closing tag as well as a missing one at the start.

## Fix it in the source `.docx`, never in the generated files

Never patch `src/pieces/html/*.html` or hand-write the JSON to work around it: a
re-run of `npm run convert` silently wipes an edit to the generated HTML, and the
same typo resurfaces the next time the document is converted.

If Word is available, the one-character fix in Word is the best option — ask him.
Otherwise a `.docx` is a zip of XML and can be patched in-session.

## Patching without Word

There is **no `python3`** in this environment. Do the XML and zip work in Node;
`jszip` and `mammoth` are already in `node_modules`.

1. Unzip the document to a scratch folder (`unzip` via Bash, or `Expand-Archive`
   in PowerShell).
2. Find the malformed run in `word/document.xml`. Word usually splits a run-on
   phrase like `<headlineThrough the oval window>` across several
   `<w:r><w:t>…</w:t></w:r>` elements, and spell-check often wraps the
   concatenated word in `<w:proofErr>` tags. Insert or move a `&gt;` run so the
   encoded text reads exactly `&lt;headline&gt;…&lt;/headline&gt;`.
3. Rebuild the archive with `jszip` — **not** PowerShell's `Compress-Archive`,
   which produces a zip mammoth rejects with `Could not find main document part`:

   ```js
   const JSZip = require('jszip');
   // read every file under the unzipped folder, zip.file(relPath, buffer),
   // then zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
   ```

4. Write the rebuilt file to a **new** filename first, then move it over the
   original — writing straight back to the path you just read can hit `EBUSY`
   from a OneDrive lock.
5. Delete any stale `src/data/pieces/<slug>.json` the converter wrote before the
   fix — it won't overwrite an existing metadata file — then re-run
   `npm run convert`.
6. Confirm the leaked text is gone from `src/pieces/html/<slug>.html` and that
   the converter now reports `+ wrote src/data/pieces/<slug>.json`.
