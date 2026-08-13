// Convert Robert's Word documents into HTML body fragments the site can load.
//
//   input:  content-src/docx/<slug>.docx
//   output: src/pieces/html/<slug>.html          (the converted body)
//           public/images/pieces/<slug>/...       (any images embedded in the doc)
//
// The file name (minus .docx) becomes the <slug> — it is the URL and the join key
// to the piece's metadata. This script ONLY writes converted HTML + extracted
// images; it never touches src/data/pieces/*.json, so re-running is always safe.
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

function slugify(filename) {
  return filename
    .replace(/\.docx$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  await fs.mkdir(HTML_DIR, { recursive: true });

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

  const missingMeta = [];

  for (const file of files) {
    const slug = slugify(file);
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
    await fs.writeFile(path.join(HTML_DIR, `${slug}.html`), `${result.value.trim()}\n`, 'utf8');

    console.log(`✓ ${file} → ${rel(path.join(HTML_DIR, `${slug}.html`))}`);
    for (const m of result.messages) {
      console.warn(`    ${m.type}: ${m.message}`);
    }

    try {
      await fs.access(path.join(META_DIR, `${slug}.json`));
    } catch {
      missingMeta.push(slug);
    }
  }

  if (missingMeta.length) {
    console.log('\nThese pieces still need a metadata file to appear in the archive:');
    for (const slug of missingMeta) {
      console.log(`  • ${rel(path.join(META_DIR, `${slug}.json`))}`);
    }
    console.log('Copy an existing one in src/data/pieces/ and edit the fields.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
