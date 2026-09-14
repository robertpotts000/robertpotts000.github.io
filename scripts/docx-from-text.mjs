// Build a minimal .docx from transcribed text — for pieces digitized from a
// photographed clipping rather than typed up in Word.
//
// Input: a JSON file shaped like:
//   {
//     "headline": "...",
//     "subheading": "...",
//     "details": "...",            // "Null" for none; "\n" for a soft line break
//     "category": "pop, guardian", // optional, comma-separated
//     "body": ["First paragraph.", "Second paragraph.", ...]
//   }
//
// Output: a .docx with each of headline/subheading/details/category as its own
// paragraph at the top — matching the "<p>&lt;tag&gt;...&lt;/tag&gt;</p>" shape
// scripts/convert-docs.mjs looks for — followed by the body paragraphs. From
// there it's an ordinary source document: drop it in content-src/docx/ and run
// npm run convert exactly as for a typed-up piece.
//
// Run with: node scripts/docx-from-text.mjs <input.json> <output.docx>

import { promises as fs } from 'node:fs';
import JSZip from 'jszip';

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// "\n" becomes a soft line break (Shift+Enter) within the same paragraph — the
// converter needs that, not a paragraph break, for multi-line <details> content.
function paragraphXml(text) {
  const lines = String(text).split('\n');
  const runs = lines
    .map((line, i) => {
      const run = `<w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`;
      return i < lines.length - 1 ? `${run}<w:r><w:br/></w:r>` : run;
    })
    .join('');
  return `<w:p>${runs}</w:p>`;
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/docx-from-text.mjs <input.json> <output.docx>');
    process.exit(1);
  }

  const data = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const paragraphs = [];

  if (data.headline) paragraphs.push(paragraphXml(`<headline>${data.headline}</headline>`));
  if (data.subheading) paragraphs.push(paragraphXml(`<subheading>${data.subheading}</subheading>`));
  if (data.details) paragraphs.push(paragraphXml(`<details>${data.details}</details>`));
  if (data.category) paragraphs.push(paragraphXml(`<category>${data.category}</category>`));

  for (const p of data.body ?? []) {
    paragraphs.push(paragraphXml(p));
  }

  if (paragraphs.length === 0) {
    console.error('Nothing to write — input has no tags and no body paragraphs.');
    process.exit(1);
  }

  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${paragraphs.join('')}<w:sectPr/></w:body></w:document>`;

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>';

  const relsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await fs.writeFile(outputPath, buffer);
  console.log(`Wrote ${outputPath}`);
}

main();
