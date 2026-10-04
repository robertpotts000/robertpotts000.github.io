---
name: digitize-piece
description: Turn a photograph of a printed piece (a newspaper or magazine clipping) into a piece on the portfolio site. Use whenever Robert supplies a photo of something in print rather than a Word document — a cutting he's found, an old piece he never has a digital copy of. Transcribes the piece from the image, tags it, confirms everything with Robert, then builds a .docx and hands off to add-piece for the actual publish.
---

# Digitize a photographed piece

This is `add-piece` for a piece that only exists in print. Same destination —
same file layout, same metadata rules, same "never invent his words" — but the
source is a photo instead of a `.docx`, so there's a transcription step first
and everything transcribed must be shown back to Robert before it goes near
`npm run convert`.

Read `.claude/skills/add-piece/SKILL.md` before using this — steps 4 onward
below are exactly its steps 4 onward, unrepeated here.

## What's different from a typed-up piece

The `.docx` doesn't exist yet — it has to be built from what's in the photo.
Everything else (filename convention, `<headline>`/`<subheading>`/`<details>`
tags, cover image rules, build-then-push, never hand-editing generated output)
is identical to `add-piece`.

## 1. Read the photo

Read the image(s) directly — you're multimodal, no OCR tool needed. Ask for a
retake if a photo is blurry, cropped mid-sentence, or too low-res to read with
confidence; don't guess at illegible text.

If the piece runs across more than one photo (a long piece spanning two pages),
ask Robert for both/all of them before transcribing, and transcribe in order.

Transcribe **verbatim** — this is digitizing his already-published words, not
writing them, so the "never invent, paraphrase or improve his words" rule in
`CLAUDE.md` applies to the transcription with zero latitude. Specifically:

- Body text: exactly as printed, paragraph breaks where the print has them.
- Headline: the actual words, but reading case rather than replicating a
  newspaper's shouting-caps typesetting (`ALL IS POETRY` → `All Is Poetry`) —
  that's a print-production artifact, not part of the wording.
- Any word you're not confident of — a smudge, a name, a number — flag it
  inline rather than guessing, e.g. `[unclear: "Ashbery" or "Asbury"?]`, and
  ask Robert about every flagged spot before going further.

## 2. Identify what's on the page

From the same photo, work out:

- **Headline** — the piece's title as printed.
- **Details**, if the piece has any (book being reviewed, author, extent,
  publisher, price — the same kind of thing typed pieces carry in their
  `<details>` tag). If there's nothing of that kind on the page, that's
  `Null`, per the site's convention — not an error, don't ask about it.
- **Type, publication, date** — read these off the page if the masthead,
  section header, or a printed date is visible (including on a second photo
  of the masthead/strap, if Robert has one). Propose what you read for
  confirmation in step 3; don't silently commit to a guess.

**Subheading is never on this list** — even when the clipping has a printed
standfirst/deck, that's not the same as asking Robert for the subheading he
wants on the site now, and doc-based pieces don't get one auto-filled either.
Always ask him for it fresh, same as `add-piece` does.

## 3. Show him everything before converting anything

Per his standing preference, don't trickle questions — one message, covering:

1. **The full transcription** — headline, details (or confirmation it's
   `Null`), and the complete body text, exactly as you'll write it into the
   `.docx`. He needs to actually read this, not just be told it's done —
   a misread name or number would otherwise go live as if it were his own
   copy.
2. Any `[unclear: ...]` spots that need his call.
3. Type / publication / date — as read off the page, flagged as a proposal,
   or asked outright if nothing on the page showed them.
4. **Subheading** — his words, always asked, never drafted unless he asks you
   to and labels it a suggestion.
5. **Cover image** — same rule as `add-piece`: no placeholder, ask for the
   file now so it's ready by the time the `.docx` exists.
6. A proposed filename/title-for-slug, built from the headline with
   punctuation stripped to spaces (matching how `add-piece` slugifies
   titles) — this becomes the permanent URL, so confirm it rather than
   silently picking one.

Do not build the `.docx` until he's answered. If he corrects the
transcription, re-check the rest of the page for the same kind of error
before moving on — a misread word is often not the only one.

## 4. Build the `.docx`

Once confirmed, write a JSON file describing the piece — to the scratchpad,
not the repo — shaped like:

```json
{
  "headline": "All Is Poetry",
  "subheading": "A brilliant reading of a misunderstood poet",
  "details": "John Ashbery and American Poetry\nDavid Herd\n208pp, Manchester University Press, £45.",
  "category": "pop, guardian",
  "body": [
    "First paragraph of the piece, exactly as transcribed.",
    "Second paragraph.",
    "..."
  ]
}
```

Notes:

- `details` and `category` are optional keys — omit them entirely (don't
  write `"Null"` into the JSON) if there's nothing to put there; leave
  `category` out unless Robert mentioned one, exactly as `add-piece` does.
- A multi-line `details` value needs `\n` between lines — that becomes a
  soft line break in the `.docx`, matching the Shift+Enter convention
  `add-piece` documents.
- Each array entry in `body` becomes one paragraph. Split at the print's own
  paragraph breaks.

Then generate the file:

```
node scripts/docx-from-text.mjs <scratch>/piece.json "content-src/docx/<Type> <Publication> <YYYY> <MM> <DD> <Title...>.docx"
```

using the confirmed filename convention from `add-piece` §2. Confirm the
`.docx` was written (the script prints the path) before moving on.

## 5. Hand off to `add-piece`

From here it's an ordinary source document. Follow
`.claude/skills/add-piece/SKILL.md` starting at §4 (Convert) through to §10
(Report back) exactly as written — `npm run convert`, cover image, checking
the metadata back to him, `npm run build`, commit, push. Stage the newly
generated `.docx` alongside the other files in the commit, same as any other
piece.

## PDFs – Robert's standing instructions (Oct 2026)

Robert may send a PDF instead of a photo or a .docx, and expects it to be
prepared end to end. Read it with the Read tool (use `pages`), and follow this
skill's steps with these differences. If the PDF is a scan, transcribe as above;
if it has real text, take the text exactly as printed.

- **Don't gate on a read-back.** Prepare the piece, then ask only about genuine
  doubts (an illegible word, a missing date or publication). Report what you
  chose in the final message so he can correct it.
- **Write the subheading yourself.** Brief and precise: a few words naming the
  subject, e.g. "A history of Wasps" or "Martin Amis's Money". Not a standfirst,
  not a sentence of opinion. Tell him what you chose.
- **Categories:** apply the scheme in `CLAUDE.md` without asking. Politics covers
  non-fiction with any political element (Parliament, legislation, government
  action, war).
- **Cover image: find a picture of the dust jacket** and save it as
  `public/images/pieces/<Original filename>.jpg` so the converter picks it up.
  With more than one book, choose by priority: the clearest image; the most
  discussed work; the first work mentioned. Say which book you used and where the
  image came from. Keep it under roughly 300 KB.
- **Indented quotations:** wrap any long quotation set apart in the print in
  `<quote>…</quote>` inside the body paragraph text (add-piece §3a), so it
  renders as the indented block quote. Use `*italic*` for italics.

## Never

- Everything `add-piece`'s "Never" section says.
- Guess at illegible text instead of flagging it and asking.
- Replicate print typography (all-caps headlines, drop caps, justified
  hyphenation) as if it were part of the wording.
- Build the `.docx` before Robert has read back and confirmed the full
  transcription.
- Treat a printed standfirst as the subheading without asking him for it.
