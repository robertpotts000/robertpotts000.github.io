// Convert Robert's Word documents into HTML body fragments the site can load.
//
//   input:  content-src/docx/<Type> <Publication> <YYYY> <MM> <DD> <Title...>.docx
//   output: src/pieces/html/<slug>.html          (the converted body)
//           public/images/pieces/<slug>/...       (any images embedded in the doc)
//           src/data/pieces/<slug>.json           (seeded once, if it doesn't exist yet)
//
// The filename encodes type, publication and date (see TYPE_BY_LETTER /
// PUBLICATION_BY_CODE below); the trailing title words become the <slug> — it is
// the URL and the join key to the piece's metadata. A <headline>, <subheading> and
// optional <details> tag at the very top of the document (each its own paragraph)
// supply the rest of the required metadata and are stripped from the body before
// it is written out.
//
// This script only ever *creates* a metadata file when one is missing — it never
// overwrites an existing src/data/pieces/<slug>.json, so re-running (e.g. after
// fixing a typo in the doc) is always safe.
//
// Run with:  npm run convert

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCX_DIR = path.join(root, 'content-src', 'docx');
const HTML_DIR = path.join(root, 'src', 'pieces', 'html');
const META_DIR = path.join(root, 'src', 'data', 'pieces');
const IMG_DIR = path.join(root, 'public', 'images', 'pieces');

const rel = (p) => path.relative(root, p).split(path.sep).join('/');

// First token of the filename.
const TYPE_BY_LETTER = { A: 'Article', B: 'Blog', I: 'Interview', O: 'Obituary', R: 'Review' };

// Second token of the filename.
const PUBLICATION_BY_CODE = {
  TLS: 'TLS',
  G: 'Guardian',
  T: 'Times',
  S: 'Spectator',
  DT: 'Daily Telegraph',
  LRB: 'LRB',
  NS: 'New Statesman',
  O: 'Observer',
};

function slugifyText(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fallbackSlug(filename) {
  return slugifyText(filename.replace(/\.docx$/i, ''));
}

/**
 * Parses "<Type> <Publication> <YYYY> <MM> <DD> <Title...>" out of a filename, e.g.
 * "R G 2001 03 10 John Ashbery.docx" -> Review / Guardian / 2001-03-10 / "john-ashbery".
 * Returns null if the filename doesn't follow the convention.
 */
function parseFilename(filename) {
  const base = filename.replace(/\.docx$/i, '').trim();
  const tokens = base.split(/\s+/);
  if (tokens.length < 6) return null;

  const [typeToken, pubToken, yearToken, monthToken, dayToken, ...titleTokens] = tokens;

  const type = TYPE_BY_LETTER[typeToken.toUpperCase()];
  if (!type) return null;

  const publication = PUBLICATION_BY_CODE[pubToken.toUpperCase()];
  if (!publication) return null;

  if (!/^\d{4}$/.test(yearToken) || !/^\d{2}$/.test(monthToken) || !/^\d{2}$/.test(dayToken)) {
    return null;
  }
  const iso = `${yearToken}-${monthToken}-${dayToken}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (
    Number.isNaN(check.getTime()) ||
    check.getUTCFullYear() !== Number(yearToken) ||
    check.getUTCMonth() + 1 !== Number(monthToken) ||
    check.getUTCDate() !== Number(dayToken)
  ) {
    return null;
  }

  const slug = slugifyText(titleTokens.join(' '));
  if (!slug) return null;

  return { type, publication, date: iso, slug };
}

// Decode the handful of HTML entities mammoth's escaped text can contain.
function decodeEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

/**
 * Finds a "<p>&lt;tag&gt;...&lt;/tag&gt;</p>" metadata paragraph anywhere in the
 * converted HTML, decodes its contents to plain text, and strips it out of the
 * body so it never renders. `value` is undefined if the tag isn't present.
 */
function extractTag(html, tag) {
  const re = new RegExp(
    `<p>\\s*&lt;${tag}&gt;([\\s\\S]*?)&lt;/${tag}&gt;\\s*(?:<br\\s*/?>\\s*)*</p>\\s*`,
    'i',
  );
  const match = html.match(re);
  if (!match) return { value: undefined, html };
  const inner = match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  const value = decodeEntities(inner).trim();
  return { value, html: html.slice(0, match.index) + html.slice(match.index + match[0].length) };
}

async function main() {
  await fs.mkdir(HTML_DIR, { recursive: true });
  await fs.mkdir(META_DIR, { recursive: true });

  let files;
  try {
    files = (await fs.readdir(DOCX_DIR)).filter(
      (f) => f.toLowerCase().endsWith('.docx') && !f.startsWith('~$'),
    );
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`No source folder at ${rel(DOCX_DIR)} — create it and drop .docx files in.`);
      return;
    }
    throw err;
  }

  if (files.length === 0) {
    console.log(`No .docx files found in ${rel(DOCX_DIR)}.`);
    return;
  }

  const needsAttention = [];

  for (const file of files) {
    const parsed = parseFilename(file);
    const slug = parsed?.slug ?? fallbackSlug(file);

    if (!parsed) {
      console.warn(
        `  ! "${file}" doesn't match the "<Type> <Publication> <YYYY> <MM> <DD> <Title>" ` +
          `filename convention — falling back to slug "${slug}". Type/date/publication won't be auto-filled.`,
      );
    }

    const docxPath = path.join(DOCX_DIR, file);
    const imgOutDir = path.join(IMG_DIR, slug);
    let imgCount = 0;

    // Extract embedded images to /public and rewrite their src to an absolute URL.
    const convertImage = mammoth.images.imgElement(async (image) => {
      const b64 = await image.read('base64');
      const ext = (image.contentType?.split('/')[1] ?? 'png').replace('jpeg', 'jpg');
      const name = `image-${++imgCount}.${ext}`;
      await fs.mkdir(imgOutDir, { recursive: true });
      await fs.writeFile(path.join(imgOutDir, name), b64, 'base64');
      return { src: `/images/pieces/${slug}/${name}`, alt: image.altText ?? '' };
    });

    const result = await mammoth.convertToHtml({ path: docxPath }, { convertImage });

    let html = result.value.trim();
    const headline = extractTag(html, 'headline');
    html = headline.html;
    const subheading = extractTag(html, 'subheading');
    html = subheading.html;
    const details = extractTag(html, 'details');
    html = details.html;

    await fs.writeFile(path.join(HTML_DIR, `${slug}.html`), `${html.trim()}\n`, 'utf8');

    console.log(`✓ ${file} → ${rel(path.join(HTML_DIR, `${slug}.html`))}`);
    for (const m of result.messages) {
      console.warn(`    ${m.type}: ${m.message}`);
    }

    const metaPath = path.join(META_DIR, `${slug}.json`);
    const alreadyHasMeta = await fs
      .access(metaPath)
      .then(() => true)
      .catch(() => false);

    if (alreadyHasMeta) continue;

    if (parsed && headline.value && subheading.value) {
      const meta = {
        headline: headline.value,
        subheading: subheading.value,
        type: parsed.type,
        date: parsed.date,
        image: `/images/pieces/${slug}.svg`,
        publication: parsed.publication,
      };
      if (details.value) meta.details = details.value;

      await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
      console.log(`  + wrote ${rel(metaPath)} (headline/subheading/details from the doc; type/date/publication from the filename)`);
      console.log(`    Still needs a real thumbnail at ${rel(path.join(IMG_DIR, `${slug}.svg`))} (or update "image"), and a look-over before publishing.`);
    } else {
      needsAttention.push({ slug, parsed, headline, subheading });
    }
  }

  if (needsAttention.length) {
    console.log('\nThese pieces still need attention before they have valid metadata:');
    for (const { slug, parsed, headline, subheading } of needsAttention) {
      const missing = [];
      if (!parsed) missing.push('type/date/publication (fix the filename)');
      if (!headline.value) missing.push('headline (add a <headline> tag to the doc, or ask)');
      if (!subheading.value) missing.push('subheading (add a <subheading> tag to the doc, or ask)');
      console.log(`  • ${rel(path.join(META_DIR, `${slug}.json`))} — missing: ${missing.join(', ')}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
