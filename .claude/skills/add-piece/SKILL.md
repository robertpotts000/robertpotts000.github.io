---
name: add-piece
description: Publish a new piece of writing to Robert Potts's portfolio site. Use whenever a Word document (.docx) is supplied to be added to the site, or when asked to add, publish, or put up a new article, review, blog post, interview or obituary, to update the journalism archive, to take a piece down, or to change which piece is featured on the About page. Gathers the required metadata, asks for anything missing, converts the document, writes the JSON, verifies the build, and commits and pushes to GitHub.
---

# Add a piece to the portfolio site

This publishes one new piece to the Astro portfolio site: converts the Word
document, writes its metadata, generates a thumbnail if needed, verifies the
site still builds, then commits and pushes so GitHub Pages redeploys.

Work in order. Do not skip the verification step, and never push a build that
failed.

## 0. Find the site and check the working tree

Locate the repository root by finding the folder that contains `astro.config.mjs`
alongside `src/data/pieces/`. If more than one candidate exists, ask which one.
All paths below are relative to that root.

Run `git status`. If there are unrelated uncommitted changes, say so and carry
on — but at the end stage **only** the files this workflow created. Never run
`git add -A` or `git add .`.

## 1. The filename and the document tags carry most of the metadata

Robert names each file and tags each document so the converter (`npm run
convert`, see step 3) can derive most of the required metadata automatically.
You should not normally need to ask for `type`, `date`, or `publication` — and
often not `headline` or `subheading` either.

**The filename** must follow this convention exactly:

```
<Type> <Publication> <YYYY> <MM> <DD> <Title...>.docx
```

e.g. `R G 2001 03 10 John Ashbery.docx`. Space-separated tokens:

| Token | Meaning | Values |
|---|---|---|
| 1 | Type letter | `A` Article, `B` Blog, `I` Interview, `O` Obituary, `R` Review |
| 2 | Publication code | `TLS`, `G` Guardian, `T` Times, `S` Spectator, `DT` Daily Telegraph, `LRB`, `NS` New Statesman, `O` Observer |
| 3–5 | Date | `YYYY`, `MM`, `DD` as separate tokens |
| 6+ | Title | Becomes the slug (step 2) — does not need to match the headline |

**The document itself** should have, as the first one to three paragraphs, any
of `<headline>...</headline>`, `<subheading>...</subheading>`,
`<details>...</details>` — each tag on its own paragraph. The converter reads
these, strips them from the body, and uses them to seed the metadata.

**Required — do not invent, guess, or infer these if the converter can't find them:**

| Field | Source | If missing, ask for |
|---|---|---|
| The document | Supplied by Robert | The `.docx` file itself. |
| `headline` | `<headline>` tag | The title as it should appear on the site. |
| `subheading` | `<subheading>` tag | One sentence that draws the reader in. His words, not yours. |
| `type` | Filename token 1 | Exactly one of: `Article`, `Blog`, `Interview`, `Obituary`, `Review`. |
| `date` | Filename tokens 3–5 | Publication date. Convert to `YYYY-MM-DD` and read it back to confirm. |
| `publication` | Filename token 2 | The outlet it appeared in (see table above). |

**Optional — offer, don't insist:**

| Field | Source | Default if not given |
|---|---|---|
| `details` | `<details>` tag | Omitted. Not displayed on the site yet — stored for later. |
| `image` | Supplied by Robert | Generate an SVG placeholder (step 5). |
| `featured` | — | Not featured. |
| `draft` | — | Not a draft. |

Once the converter has run (step 3), check what it filled in and read the
extracted `headline`/`subheading`/`type`/`date`/`publication` back to Robert to
confirm rather than asking from scratch — he may not remember what he typed in
the filename. **Only** ask outright for whatever the converter reports as
still missing (its console output lists exactly this). Never one question at a
time — ask for everything missing in one message.

Two exceptions:
- If the filename doesn't parse or the tags are absent, you may **propose** a
  headline and subheading drawn from the document body itself, clearly marked
  as a suggestion, and use them only if he says yes.
- If he gives extra information there is no field for — a strapline, a
  co-author — do not add a new JSON key. The schema in `src/content.config.ts`
  will reject it and the build will fail. Tell him it would need a schema
  change, and offer to fold it into the subheading instead.

## 2. The slug

The converter derives the slug from the filename's title tokens (everything
after the date): lowercase, spaces to hyphens, punctuation dropped, ASCII only.
`R G 2001 03 10 John Ashbery.docx` → `john-ashbery`. It does **not** need to
match the headline — the filename title can be a short subject tag (an author
surname, say) even when the on-site headline is more elaborate.

Check `src/data/pieces/` and `src/pieces/html/` for a collision before
converting. If the slug already exists, ask whether this replaces the existing
piece or the filename's title words need to change — do not silently overwrite.

**Slugs are permanent.** They are the public URL. Never rename one on an
already-published piece without being asked to explicitly.

## 3. Convert the document

1. Copy the file into `content-src/docx/`, **keeping its original filename** —
   do not rename it to the slug. The filename is a metadata source now, not
   just an identifier.
2. Run `npm install` first if `node_modules/` is absent.
3. Run `npm run convert`.
4. Confirm `src/pieces/html/<slug>.html` now exists and is not empty. If it
   doesn't, stop and report the converter's output — do not hand-write the HTML.
5. Read the converter's console output. If it wrote
   `src/data/pieces/<slug>.json` for you, it will say so — that means the
   filename parsed and both `<headline>` and `<subheading>` tags were found.
   If instead it lists the piece under "still need attention," it will say
   exactly what's missing (bad filename, missing tag) — that's what you ask
   Robert for.

Extracted images land in `public/images/pieces/<slug>/` automatically. The
converter never overwrites metadata, so it is always safe to re-run.

If you cannot run shell commands in this environment, do everything you can with
files, then stop and give him the exact commands to paste into a terminal in the
repo folder. Do not claim the piece is published when it isn't.

## 4. Check and finish the metadata

First read `src/content.config.ts` and match the schema as it actually is today.
As of writing, `src/data/pieces/<slug>.json` looks like:

```json
{
  "headline": "The Uses of Difficulty",
  "subheading": "One sentence that draws the reader in.",
  "type": "Review",
  "date": "2026-05-18",
  "image": "/images/pieces/the-uses-of-difficulty.svg",
  "publication": "Guardian",
  "featured": true
}
```

If the converter already wrote this file (step 3), read it back to Robert to
confirm rather than re-deriving it — don't second-guess a correct auto-fill,
but do catch a wrong filename (e.g. wrong publication code) here rather than
after publishing. If it didn't write the file, create it by copying an
existing piece's shape rather than reconstructing it from memory, filling in
whatever the converter reported as missing.

- `image` is a web path with a leading slash, resolved from `public/`. The
  converter pre-fills this as `/images/pieces/<slug>.svg` even before the file
  exists — step 5 is what actually creates it.
- `details` (optional, from the `<details>` tag) and `publication` (from the
  filename) are stored but **not currently rendered anywhere on the site** —
  leave them as the converter wrote them; don't add display markup for them
  unless separately asked to.
- Add `"draft": true` only if asked. Omit `featured` entirely when false.

## 5. Thumbnail

**If he supplied an image:** copy it to `public/images/pieces/<slug>.<ext>` and
point `image` at it. Keep the file under about 300 KB; if it is much larger,
mention it rather than silently shipping a huge file.

**If not:** generate a placeholder SVG at `public/images/pieces/<slug>.svg`.
Look at an existing placeholder in `public/images/pieces/` first and match its
dimensions and style so the cards stay consistent. If there is none, read the
colour values out of `src/styles/tokens.css` (background, ink, accent) and use
this, substituting the real hex values and the headline:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="HEADLINE">
  <rect width="1200" height="800" fill="BACKGROUND"/>
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="ACCENT" stroke-width="2"/>
  <text x="600" y="400" text-anchor="middle" font-family="Cormorant Garamond, EB Garamond, serif"
        font-size="72" fill="INK">HEADLINE</text>
</svg>
```

Never invent colours. If the headline is long, wrap it across two `<text>` lines
rather than letting it overflow.

## 6. Featured piece

`featured` marks the one piece shown on the About page. **At most one piece in
the whole site may have it.** If this piece is to be featured, read every file in
`src/data/pieces/`, remove `"featured": true` from whichever piece currently has
it, and say which piece you demoted.

## 7. Verify before publishing

Run `npm run build`. This validates the metadata against the schema and catches
a bad `type`, a malformed date, or a missing image.

If the build fails, **stop. Do not commit and do not push.** Report the error in
plain language and what would fix it. A broken commit on `main` takes the live
site down.

## 8. Commit and push

Only once the build has passed. Stage explicit paths only:

```bash
git add "content-src/docx/<original filename>.docx" \
        src/pieces/html/<slug>.html \
        src/data/pieces/<slug>.json \
        public/images/pieces/<slug>.svg      # or the real image / extracted-images folder
# plus src/data/pieces/<other>.json if you demoted a featured piece
git commit -m "Add piece: <headline>"
git push
```

If the push is rejected, do not force it. Report the message. Usually it means
either a credentials prompt or that the remote moved ahead — for the latter,
`git pull --rebase` then push again is safe.

## 9. Report back

Tell him, briefly:
- the live URL: `/journalism/<slug>`
- whether it used a supplied image or a generated placeholder
- if it was made featured, which piece was demoted
- that GitHub Pages usually takes a minute or two to redeploy

## Related tasks

- **Take a piece down:** add `"draft": true` to its JSON, build, commit, push.
  Do not delete files — the slug should keep working if it is restored.
- **Fix a typo in the text:** correct the source `.docx`, re-run `npm run
  convert`, build, commit, push. Do not hand-edit the generated HTML in
  `src/pieces/html/` — the next conversion would silently wipe the fix.
- **Change the look:** everything visual lives in `src/styles/tokens.css`. That
  is a separate job from adding a piece.

## Never

- Write the headline, subheading, date, type, or publication from your own
  inference when the filename/tags didn't supply them — ask instead.
- Rename a supplied `.docx` away from the `<Type> <Publication> <YYYY> <MM>
  <DD> <Title>` convention, or rename it to the slug.
- Push when the build failed.
- `git add -A`, `git push --force`, or rename an existing slug uninvited.
- Add JSON keys that aren't in `src/content.config.ts`.
- Hand-edit generated files in `src/pieces/html/`.
- Add display markup for `details` or `publication` unless separately asked —
  they are stored but intentionally not shown on the site yet.
- Report success for a step that didn't actually run.
