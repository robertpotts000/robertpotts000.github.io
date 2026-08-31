---
name: add-piece
description: Publish pieces of writing to Robert Potts's portfolio site. Use whenever one or more Word documents (.docx) are supplied to be added to the site, or when asked to add, publish, or put up a new article, review, blog post, interview or obituary, to update the journalism archive, to replace a piece's cover image, to take a piece down, to fix a typo in a published piece, or to change which piece is featured on the About page. Runs the conversion, checks the metadata, verifies the build, and commits and pushes to GitHub.
---

# Add a piece to the portfolio site

An Astro site published to GitHub Pages. Adding a piece means: convert the Word
document, let the converter seed the metadata from the filename and the document's
own tags, check what it produced, verify the build, then commit and push so Pages
redeploys.

`npm run convert` does most of the work. Your job is to read its output honestly,
chase what it says is missing, and never publish a piece it held back.

Work in order. Never push a build that failed.

## What a piece needs before it can go live

| Thing | Comes from | If it's missing |
|---|---|---|
| The `.docx` | Robert | Ask for the file. |
| `headline` | `<headline>` tag in the doc | Ask. His words, not yours. |
| `subheading` | `<subheading>` tag in the doc | Ask. His words, not yours. |
| `type`, `date`, `publication` | The filename | Fix the filename (§2). |
| Cover image | An image file Robert drops in `public/images/pieces/` | **Ask him for one and stop.** There is no placeholder — see §5. |
| `details` | `<details>` tag in the doc | Optional. Genuinely fine to omit. |

Never write the headline, subheading, date, type or publication from your own
inference. He is a critic and an editor; the words on his site are his.

If the filename doesn't parse and the tags are absent you may **propose** a
headline and subheading drawn from the document body, clearly labelled as a
suggestion, and use them only if he says yes.

Ask for everything that's missing in one message. Never one question at a time.

## 1. Layout

| Path | Holds |
|---|---|
| `content-src/docx/` | The source Word documents, under their original names. |
| `src/pieces/html/<slug>.html` | Converted body. **Generated — never hand-edit.** |
| `src/data/pieces/<slug>.json` | The piece's metadata. Hand-editable; the converter writes it once and never again. |
| `public/images/pieces/<slug>.<ext>` | Cover image (the card thumbnail). |
| `src/content.config.ts` | The metadata schema. The build enforces it. |

A piece exists on the site only if it has a JSON file. An orphan HTML body with
no JSON is invisible — which is exactly how the converter holds back an
incomplete piece.

## 2. The filename carries type, date, publication and slug

```
<Type> <Publication> <YYYY> <MM> <DD> <Title...>.docx
```

e.g. `R G 2001 03 10 John Ashbery.docx` → Review / Guardian / 2001-03-10 / slug
`john-ashbery`.

| Token | Values |
|---|---|
| Type letter | `A` Article, `B` Blog, `I` Interview, `O` Obituary, `R` Review |
| Publication code | `TLS`, `G` Guardian, `T` Times, `S` Spectator, `DT` Daily Telegraph, `LRB`, `NS` New Statesman, `O` Observer |
| Date | `YYYY` `MM` `DD` as three separate tokens, zero-padded, a real calendar date |
| Title | Everything after the date. Becomes the slug. Needn't match the headline. |

Notes that matter in practice:

- **Keep the `.docx` under its original name.** The filename is a metadata
  source, not just a label. Don't rename it to the slug.
- **Punctuation in the title becomes hyphens.** `Kate Bush's Wuthering Heights`
  → `kate-bush-s-wuthering-heights`. Live and permanent, so if he's naming a new
  file, suggest punctuation-free title words.
- A missing token, a bad date (`2003 13 40`), or an unknown letter/code means
  type/date/publication aren't filled in at all — the converter warns and falls
  back to slugifying the whole filename. Fix the filename and re-run rather than
  hand-writing the JSON.
- **Slugs are permanent.** They are the public URL. Check
  `src/data/pieces/` for a collision before converting; if the slug already
  exists, ask whether this replaces that piece or the title words should change.
  Never silently overwrite, and never rename an existing slug uninvited.

## 3. The document tags carry the headline, subheading and details

At the top of the document, each on its own paragraph:

```
<headline>The headline as it should appear on the site</headline>
<subheading>One sentence that draws the reader in</subheading>
<details>Book, author, extent, publisher, price</details>
```

The converter finds these anywhere in the document, strips them from the body so
they never render, and seeds the metadata with them.

- **`<details>Null</details>` is not an error.** It's Robert's documented
  convention for "nothing to put here" and nearly every piece uses it. Leave it
  alone; don't try to empty or remove it.
- **Multi-line details need Shift+Enter, not Enter.** Inside the tag, a real
  paragraph break is lost and the lines run together
  (`"Slow AirRobin Robertson66pp, Picador, £7.99."`), whereas a soft line break
  becomes a newline. If you see run-together details, fix the source `.docx` —
  not the JSON.
- **A tag reported as missing is usually a typo, not an absent tag.** The
  extractor matches the literal string `<headline>`, so a dropped `>`
  (`<headlineSome Title>`) means the tag isn't recognised and leaks into the body
  as escaped text. Before asking Robert to redo anything, look at the body for
  `&lt;headline`. Repair procedure: `reference/docx-repair.md`.

## 4. Convert

1. If Word has the document open, ask him to close it — Word leaves a `~$…docx`
   lock file (the converter skips those) and OneDrive can hold the real file
   locked (`EBUSY`).
2. Copy each `.docx` into `content-src/docx/` under its original name.
3. `npm install` first if `node_modules/` is absent.
4. `npm run convert`.

It handles every document in the folder, so several pieces at once is normal and
fine. It never overwrites an existing `src/data/pieces/*.json`, so re-running is
always safe.

Then **read the output**, per piece:

| Output | Means |
|---|---|
| `✓ <file> → src/pieces/html/<slug>.html` | Body converted. |
| `+ cover image "<name>" → public/images/pieces/<slug>.<ext>` | It found and renamed his image. |
| `+ wrote src/data/pieces/<slug>.json` | Complete. Go to §6. |
| `! two cover images match this piece` | Two candidates; it used the slug-named one. Ask which he wants, delete the other. |
| `! …has "image": …but the cover image here is…` | Existing JSON disagrees with the file on disk. Ask before changing either. |
| listed under `These pieces still need attention` | Incomplete — it names exactly what's missing. That's what you ask for. |

Confirm `src/pieces/html/<slug>.html` exists and is non-empty. If it doesn't,
stop and report the converter's output — never hand-write the body.

If a piece was held back, fix the cause (rename the file, repair the tag, get the
image) and re-run `npm run convert`. To re-seed metadata from a corrected
document, delete the stale `src/data/pieces/<slug>.json` first — the converter
won't overwrite it.

If you can't run shell commands here, do everything you can with files, then give
him the exact commands to paste. Don't call a piece published when it isn't.

## 5. Cover image

Robert drops the image into `public/images/pieces/`, named either after the
`.docx` or after the slug, in any of `.jpg .jpeg .png .webp .avif .gif`. The
converter renames a docx-named one to `<slug>.<ext>` and writes that real path
into the JSON.

**A piece with no cover image does not get published.** The converter holds its
metadata back; ask him for an image and leave the piece alone until it arrives.
Don't generate a placeholder, don't reuse another piece's image, and don't point
`image` at a file that isn't there — the card would render broken. (Publishing
image-less pieces would need a schema change plus a card fallback; that's a
separate job, offer it if he asks.)

Keep images under roughly 300 KB. If one is much larger, say so rather than
silently shipping it.

## 6. Check the metadata

Read `src/content.config.ts` — it is the authority — then read the JSON back to
him to confirm rather than re-deriving it:

```json
{
  "headline": "All Is Poetry",
  "subheading": "A brilliant reading of a misunderstood poet",
  "type": "Review",
  "date": "2001-03-10",
  "image": "/images/pieces/john-ashbery.jpeg",
  "publication": "Guardian",
  "details": "John Ashbery and American Poetry\nDavid Herd\n208pp, Manchester University Press, £45."
}
```

Don't second-guess a correct auto-fill, but this is the moment to catch a wrong
publication code or a transposed date — cheaper now than after publishing.

- `image` is a web path with a leading slash, resolved from `public/`.
- `details` and `publication` are stored but **deliberately not rendered
  anywhere** on the site. Leave them; don't add display markup unless separately
  asked.
- `featured` and `draft` are optional booleans — omit them when false.
- Extra information with no field (a strapline, a co-author) is not a new JSON
  key: the schema will reject it and the build will fail. Say it would need a
  schema change, and offer to fold it into the subheading.

## 7. Featured piece (About page)

`featured: true` marks the one piece shown as the hero on the About page. **At
most one piece in the whole site may have it.** With none set, the About page
falls back to the most recent piece, which is the current state — so leave
`featured` out unless he asks for it.

If he does ask, read every file in `src/data/pieces/`, remove `"featured": true`
from whichever piece has it, and tell him which piece you demoted.

## 8. Verify

```
npm run build
```

This validates every piece against the schema and catches a bad `type`, a
malformed date, a missing required field. Confirm `dist/journalism/<slug>/`
was generated for the new piece.

If the build fails, **stop. Don't commit, don't push.** Report the error in plain
language and what would fix it. A broken commit on `main` takes the live site
down.

## 9. Commit and push

Only once the build has passed. Stage explicit paths — never `git add -A`:

```bash
git add "content-src/docx/<original filename>.docx" \
        src/pieces/html/<slug>.html \
        src/data/pieces/<slug>.json \
        public/images/pieces/<slug>.<ext>
git commit -m "Add piece: <headline>"
git push origin HEAD:main
```

- **The push target is not optional.** The local branch is `master` but tracks
  `origin/main`; plain `git push` fails with an upstream mismatch.
- Commit message: `Add piece: <headline>` for one, or
  `Publish N more journalism pieces` for a batch.
- If the push is rejected, don't force it. Report the message. Usually it's a
  credentials prompt, or the remote moved ahead — for the latter,
  `git pull --rebase` then push again.

## 10. Report back

Briefly:

- the live URL, `/journalism/<slug>`
- anything you had to ask about or fix along the way
- which piece you demoted, if you changed the featured piece
- that GitHub Pages takes a minute or two to redeploy (Actions → "Deploy to
  GitHub Pages")

## Related tasks

- **Take a piece down:** add `"draft": true` to its JSON, build, commit, push.
  Don't delete files — the slug should still work if it's restored.
- **Fix a typo in a piece:** correct the source `.docx`, re-run `npm run
  convert`, build, commit, push. Never hand-edit `src/pieces/html/` — the next
  conversion silently wipes it.
- **Change a headline, subheading, date or details after publishing:** edit
  `src/data/pieces/<slug>.json` directly (the converter won't touch it again).
  Where the doc's tags are also wrong, fix them too so a future re-seed is right.
- **Replace a cover image:** drop the new file in `public/images/pieces/` named
  `<slug>.<ext>`, delete the old one if the extension changed, and update
  `"image"` in the JSON to match.
- **Change the look:** everything visual is in `src/styles/tokens.css`. Separate
  job from adding a piece.

## Never

- Invent a headline, subheading, date, type or publication.
- Publish a piece with no cover image, or with `image` pointing at a file that
  doesn't exist.
- Rename a supplied `.docx`, or rename an existing slug uninvited.
- Push a failed build. `git add -A`. `git push --force`.
- Add JSON keys that aren't in `src/content.config.ts`.
- Hand-edit anything in `src/pieces/html/`.
- Add display markup for `details` or `publication` — intentionally not shown.
- Report success for a step that didn't actually run.
