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

## 1. Gather what you need before touching anything

**Required — do not invent, guess, or infer these:**

| Field | What to ask for |
|---|---|
| The document | The `.docx` file itself. |
| `headline` | The title as it should appear on the site. |
| `subheading` | One sentence that draws the reader in. His words, not yours. |
| `type` | Exactly one of: `Article`, `Blog`, `Interview`, `Obituary`, `Review`. |
| `date` | Publication date. Convert to `YYYY-MM-DD` and read it back to confirm. |

**Optional — offer, don't insist:**

| Field | Default if not given |
|---|---|
| `image` | Generate an SVG placeholder (step 5). |
| `featured` | Not featured. |
| `draft` | Not a draft. |
| slug | Derived from the headline (step 2). |

If anything required is missing, **stop and ask for all of it in one message** —
never one question at a time, and never proceed with a placeholder. Say plainly
what you have and what you still need. For example:

> I have the document and the date (18 May 2026). Before I can publish this I
> still need:
> - **Headline** — the title as it should appear on the site
> - **Subheading** — one sentence to draw the reader in
> - **Type** — Article, Blog, Interview, Obituary or Review
>
> Optionally: a thumbnail image (I'll make a plain one otherwise), and whether
> this should be the featured piece on the About page.

Two exceptions to asking:
- You may **propose** a headline and subheading drawn from the document itself,
  clearly marked as a suggestion, and use them only if he says yes.
- If he gives extra information there is no field for — the publication it
  appeared in, a strapline, a co-author — do not add a new JSON key. The schema
  in `src/content.config.ts` will reject it and the build will fail. Tell him it
  would need a schema change, and offer to fold it into the subheading instead.

## 2. Decide the slug

Derive from the headline: lowercase, spaces to hyphens, drop punctuation and
apostrophes, ASCII only. *The Uses of Difficulty* → `the-uses-of-difficulty`.

Check `src/data/pieces/` and `src/pieces/html/` for a collision. If the slug
already exists, ask whether this replaces the existing piece or needs a
different slug — do not silently overwrite.

**Slugs are permanent.** They are the public URL. Never rename one on an
already-published piece without being asked to explicitly.

## 3. Convert the document

1. Copy the file to `content-src/docx/<slug>.docx`.
2. Run `npm install` first if `node_modules/` is absent.
3. Run `npm run convert`.
4. Confirm `src/pieces/html/<slug>.html` now exists and is not empty. If it
   doesn't, stop and report the converter's output — do not hand-write the HTML.

Extracted images land in `public/images/pieces/<slug>/` automatically. The
converter never overwrites metadata, so it is safe to re-run.

If you cannot run shell commands in this environment, do everything you can with
files, then stop and give him the exact commands to paste into a terminal in the
repo folder. Do not claim the piece is published when it isn't.

## 4. Write the metadata

First read `src/content.config.ts` and match the schema as it actually is today.
As of writing, `src/data/pieces/<slug>.json` looks like:

```json
{
  "headline": "The Uses of Difficulty",
  "subheading": "One sentence that draws the reader in.",
  "type": "Review",
  "date": "2026-05-18",
  "image": "/images/pieces/the-uses-of-difficulty.svg",
  "featured": true
}
```

- `image` is a web path with a leading slash, resolved from `public/`.
- Add `"draft": true` only if asked. Omit `featured` entirely when false.
- Copy an existing JSON file's shape rather than reconstructing it from memory.

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
git add content-src/docx/<slug>.docx \
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

- Write the subheading, date, or type from your own inference.
- Push when the build failed.
- `git add -A`, `git push --force`, or rename an existing slug uninvited.
- Add JSON keys that aren't in `src/content.config.ts`.
- Hand-edit generated files in `src/pieces/html/`.
- Report success for a step that didn't actually run.
