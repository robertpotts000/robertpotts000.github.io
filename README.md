# How to update the site

This is a reference for the jobs you'll want to do most often: adding a new piece to
the Journalism archive, changing the writing on the About and Editing pages, and the
smaller jobs — taking a piece down, fixing a typo, choosing the featured piece — in
Part 4. All file paths below are relative to the site's main folder — the one that
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
need to match the on-site headline exactly. Try to keep punctuation out of it:
apostrophes, commas and colons all turn into hyphens in the address (`Kate Bush's`
becomes `kate-bush-s`), and the address can't be tidied up afterwards without
breaking any link anyone has to the piece.

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

If the details run to more than one line — a book title, then the author, then the
price — end each line with **Shift + Enter** rather than Enter. A plain Enter starts
a new paragraph, and the lines end up run together with no break between them.

**Important:** all three tags must be present, and each needs both of its angle
brackets in place. A missing `>` just after the tag name (`<headlineThe Uses of
Difficulty>`) is the usual slip: the piece is then left out until it's fixed, and
the tag text turns up in the middle of the article instead of the headline.

### Step 3 — Save the Word document here

`content-src/docx/`

Then **close it in Word**. Word holds on to a document it has open, which can stop
the next steps from reading it.

### Step 4 — Add a cover image

Every piece needs one: it's the picture on the piece's card in the archive, and the
site has no stand-in for a missing one. Name the image exactly the same as the Word
document, but swap `.docx` for the image's own file ending (`.jpg`, `.jpeg`, `.png`,
`.webp` or `.avif`).

**Example** — for `R G 2001 03 10 John Ashbery.docx`, the image would be named:
`R G 2001 03 10 John Ashbery.jpg`

Save it here:

`public/images/pieces/`

Step 5 renames it to match the piece's web address for you, so you don't have to.
Aim for something under about 300 KB — a photo straight off a phone is far bigger
than the card needs.

You can leave the image until later if you don't have one to hand, but the piece
stays off the site until it has one. Nothing else you've done is lost: drop the
image in whenever you're ready and run Step 5 again.

### Step 5 — Publish it

You have two options here: ask Claude to do it, or do it yourself. Either way you
can do several pieces in one go — put all the documents and their images in place
first, and a single run handles the lot.

#### Option A — Ask Claude

1. Open the site's main folder in File Explorer.
2. Click into the empty address bar at the top of the window (where the folder path
   is written), type `cmd`, and press Enter. A black Command Prompt window will open,
   already pointed at the right folder.
3. Type `claude` and press Enter. This starts Claude Code.
4. Type `/add-piece` and press Enter.

   `add-piece` is a set of instructions kept with the site, in
   `.claude/skills/add-piece/`, telling Claude exactly how this job is done here:
   the file-name pattern, the document tags, the cover image, checking the site
   builds, and publishing. You don't need to explain any of it.

   If you'd rather just say it in your own words, that works too — Claude picks up
   the same instructions from a description of the job. Something like:

   ```
   I've added one or more new pieces to the site — the Word documents are
   in content-src/docx and their cover images are in public/images/pieces.
   Please add them: run the conversion, check the headline, subheading,
   date, type and publication are right, make sure each cover image is
   linked correctly, confirm the site builds without errors, then commit
   and push.
   ```

5. Claude will report back once it's done, or ask you a question if anything about
   the new piece is unclear or missing. When it's finished it'll give you the new
   piece's web address.

#### Option B — Do it yourself

1. Open Command Prompt at the site's main folder (see steps 1–2 under Option A above).
2. Type `npm run convert` and press Enter. For each document this writes the article
   text to `src/pieces/html/<slug>.html`, renames your cover image to `<slug>` plus
   its own file ending, and creates a metadata file at
   `src/data/pieces/<slug>.json`. (`<slug>` is the piece's web address, made from the
   title in the file name — the Command Prompt window prints it, e.g.
   `✓ ... → src/pieces/html/john-ashbery.html`.)

   Read what it prints. A piece is ready when you see
   `+ wrote src/data/pieces/<slug>.json`. If instead it's listed at the bottom under
   **"These pieces still need attention"**, that line says exactly what's missing —
   a file name that doesn't fit the pattern, a missing or malformed tag, or no cover
   image. Put that right and run `npm run convert` again; it's safe to run as often
   as you like, and it never overwrites work you've already done.
3. Open the new `src/data/pieces/<slug>.json` in a text editor and check it looks
   like this:

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
   `date` and `publication` come from the file name; `image` is your cover image under
   its new name. Check they're all correct — this is the moment to catch a wrong
   publication code or a mistyped date.

   From here on it's this file, not the Word document, that the site reads for those
   details: `npm run convert` will never overwrite it. So to change a headline later,
   edit it here — see Part 4.
4. Type `npm run build` and press Enter. This checks the whole site still works.
   Look for `Complete!` near the bottom with no red error text. If you see an
   error, don't publish — fix what it points to and run this step again.
5. (Optional) Type `npm run preview` and press Enter to view the site locally
   before publishing — open the address it prints (something like
   `http://localhost:4321`) in a web browser. Press `Ctrl + C` in the Command
   Prompt window to stop the preview when you're done.
6. Publish it by typing each of these, pressing Enter after each one:

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

---

## Part 4 — The smaller jobs

The quickest route for any of these is to ask Claude (Part 1, Step 5, Option A) and
say which piece you mean — `/add-piece` covers these jobs as well as adding a new
piece, so "take the Tom Paulin review down for now" is enough. If you'd rather do it yourself, here's what each one
involves. They all finish the same way: `npm run build` to check nothing's broken,
then the three `git` commands at the end of Part 1, Step 5, Option B.

`<slug>` throughout is the piece's web address — the last part of its link, e.g.
`john-ashbery` for `robertpotts.co.uk/journalism/john-ashbery`.

### Taking a piece down

Open `src/data/pieces/<slug>.json` and add a `"draft"` line as the last one inside
the curly brackets — putting a comma at the end of the line above it, and no comma
after `true`:

```json
{
  "headline": "The Uses of Difficulty",
  "subheading": "One sentence that draws the reader in.",
  "type": "Review",
  "date": "2026-05-18",
  "image": "/images/pieces/the-uses-of-difficulty.jpg",
  "publication": "Guardian",
  "details": "Null",
  "draft": true
}
```

It disappears from the archive and from the About page. Nothing is deleted — take
the `"draft"` line out again to put it back, and its web address will still work.
Don't delete the files themselves.

### Fixing a typo in a piece

Correct it in the Word document in `content-src/docx/`, save, close Word, then run
`npm run convert`. Don't edit the files in `src/pieces/html/` — they're written
fresh from the Word document every time, so a fix made there is lost on the next
run.

### Changing a headline, subheading, date or details after publishing

Edit `src/data/pieces/<slug>.json` directly — that file is what the site reads, and
`npm run convert` won't touch it again. It's worth correcting the tags in the Word
document to match, so the two don't disagree if the piece is ever converted afresh.

The one thing not to change here is the piece's web address: that comes from the
file name and people may already have linked to it.

### Changing which piece is featured on the About page

Add a `"featured": true` line to that piece's `src/data/pieces/<slug>.json` (same
pattern as `"draft"` above) — and remove it from whichever piece has it now, since
only one piece can be featured at a time. With none set, the About page shows the
most recent piece, which is how it currently works.

### Replacing a cover image

Put the new image in `public/images/pieces/` named exactly `<slug>` plus its own
file ending — e.g. `john-ashbery.jpg` — and delete the old one. If the new file
ending is different from the old one (`.jpg` where it used to be `.jpeg`), change
the `"image"` line in `src/data/pieces/<slug>.json` to match.
