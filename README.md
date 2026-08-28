# How to update the site

This is a reference for the two things you'll want to do most often: adding a new
piece to the Journalism archive, and changing the writing on the About and Editing
pages. All file paths below are relative to the site's main folder — the one that
contains this file.

---

## Part 1 — Adding a new piece to the archive

### Step 1 — Name the Word document

The file name tells the site what type of piece it is, where it was published, and
when. Name the `.docx` file exactly like this, with spaces between each part:

`<Type> <Publication> <Year> <Month> <Day> <Title>.docx`

**Type** is one letter:

| Letter | Means |
|---|---|
| A | Article |
| B | Blog |
| I | Interview |
| O | Obituary |
| R | Review |

**Publication** is one of these codes:

| Code | Means |
|---|---|
| TLS | TLS |
| G | Guardian |
| T | Times |
| S | Spectator |
| DT | Daily Telegraph |
| LRB | LRB |
| NS | New Statesman |
| O | Observer |

**Year, Month, Day** are numbers — Year as 4 digits, Month and Day as 2 digits each
(e.g. `03` not `3`).

**Title** is whatever you like — it becomes the piece's web address, so it doesn't
need to match the on-site headline exactly.

**Example** — a review published in the Guardian on 10 March 2001 about John Ashbery:
`R G 2001 03 10 John Ashbery.docx`

### Step 2 — Add three tags to the top of the document

At the very top of the Word document, each on its own line, add:

```
<headline>The headline as it should appear on the site</headline>
<subheading>One sentence that draws the reader in</subheading>
<details>Any extra details — e.g. the book being reviewed, its price</details>
```

If there's nothing to put in `<details>`, write `<details>Null</details>`.

**Important:** all three tags must be present, or the piece cannot be published —
it'll be left out until the tags are added.

### Step 3 — Save the Word document here

`content-src/docx/`

### Step 4 — Add a cover image (optional, but recommended)

If you have a photo or cover image, name it exactly the same as the Word document,
but swap `.docx` for the image's own file ending (`.jpg`, `.jpeg`, `.png`, `.webp`,
or `.avif`).

**Example** — for `R G 2001 03 10 John Ashbery.docx`, the image would be named:
`R G 2001 03 10 John Ashbery.jpg`

Save it here:

`public/images/pieces/`

You can skip this step — the piece can be published without an image and one can be
added later.

### Step 5 — Publish it

You have two options here: ask Claude to do it, or do it yourself.

#### Option A — Ask Claude

1. Open the site's main folder in File Explorer.
2. Click into the empty address bar at the top of the window (where the folder path
   is written), type `cmd`, and press Enter. A black Command Prompt window will open,
   already pointed at the right folder.
3. Type `claude` and press Enter. This starts Claude Code.
4. Paste in this prompt:

   ```
   I've just added a new piece to the site — the Word document is in
   content-src/docx and (if I added one) its cover image is in
   public/images/pieces. Please add it: run the conversion, check the
   headline, subheading, date, type and publication are correct, make
   sure the cover image is linked correctly, confirm the site builds
   without errors, then commit and push.
   ```

5. Claude will report back once it's done, or ask you a question if anything about
   the new piece is unclear or missing.

#### Option B — Do it yourself

1. Open Command Prompt at the site's main folder (see steps 1–2 under Option A above).
2. Type `npm run convert` and press Enter. This reads the Word document, writes its
   body to `src/pieces/html/<slug>.html`, and creates a starter metadata file at
   `src/data/pieces/<slug>.json` (`<slug>` is generated from the title — the Command
   Prompt window will print it, e.g. `✓ ... → src/pieces/html/john-ashbery.html`).
3. Open that new file, `src/data/pieces/<slug>.json`, in a text editor and check it
   looks like this:

   ```json
   {
     "headline": "The Uses of Difficulty",
     "subheading": "One sentence that draws the reader in.",
     "type": "Review",
     "date": "2026-05-18",
     "image": "/images/pieces/the-uses-of-difficulty.jpg",
     "publication": "Guardian",
     "details": "Null"
   }
   ```

   `headline`, `subheading` and `details` come from the document's tags; `type`,
   `date` and `publication` come from the file name. Check they're all correct.
4. If you added a cover image in Step 4, rename it (in `public/images/pieces/`) so
   it matches `<slug>` exactly, keeping its own file ending — e.g.
   `the-uses-of-difficulty.jpg` — then make sure the `"image"` line in the JSON
   file above points to that same name.
5. Type `npm run build` and press Enter. This checks the whole site still works.
   Look for `Complete!` near the bottom with no red error text. If you see an
   error, don't publish — fix what it points to and run this step again.
6. (Optional) Type `npm run preview` and press Enter to view the site locally
   before publishing — open the address it prints (something like
   `http://localhost:4321`) in a web browser. Press `Ctrl + C` in the Command
   Prompt window to stop the preview when you're done.
7. Publish it by typing each of these, pressing Enter after each one:

   ```
   git add -A
   git commit -m "Add <piece title>"
   git push origin HEAD:main
   ```

   Replace `<piece title>` with a short description, e.g. `git commit -m "Add John Ashbery review"`.

That's it — the site will rebuild automatically and the new piece will appear live
within a few minutes.

---

## Part 2 — Changing the About page writing

The About page's biography text lives in:

`src/pages/index.astro`

Open it in a text editor and look for the paragraphs inside the section that starts
`<section class="about__bio" ...>`. There's currently a placeholder line:

```
<p class="placeholder-note">
  Placeholder biography — Robert will replace the text below.
</p>
```

Delete that whole `<p class="placeholder-note">...</p>` block once you've added the
real writing. Below it are two more `<p>...</p>` paragraphs of sample biography
text — replace the sentences between each pair of `<p>` and `</p>` tags with your
own writing, but leave the tags themselves (anything in `< >`) untouched. You can
add more `<p>...</p>` paragraphs the same way if you want more than two.

Leave the `<ul class="about__links" ...>` block below it alone — that's the
Substack/LinkedIn links, not part of the biography text.

## Part 3 — Changing the Editing page writing

The Editing page's text lives in:

`src/pages/editing.astro`

Open it and look inside the section that starts `<div class="editing__body">`.
Same pattern as the About page: delete the placeholder paragraph —

```
<p class="placeholder-note">
  Placeholder text — Robert will write about his editing work here.
</p>
```

— then replace the sentences inside the other `<p>...</p>` paragraphs with your own
writing, leaving the `< >` tags in place. The last paragraph contains a link to the
About page (`<a href="/">About</a>`) — you can keep, move, or remove that link, just
keep the surrounding `<p>` and `</p>` tags either side of whatever text you write.

**After editing either page**, publish the change the same way as a new piece
(Part 1, Step 5) — either ask Claude, or run `npm run build` to check it, then
`git add -A`, `git commit -m "Update About page"` (or `"Update Editing page"`), and
`git push origin HEAD:main` yourself.
