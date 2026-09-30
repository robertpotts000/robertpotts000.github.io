// Recent pieces stay behind the originating outlet's paywall for a year: only
// the first two paragraphs render, followed by a link out to where the piece
// was actually published. After a year the piece reverts to showing in full.
//
// Because this is a static site that only rebuilds on push (see
// .github/workflows/static.yml's schedule trigger), the one-year check below
// is re-evaluated at every build, not continuously — a piece crosses over the
// next time the site happens to build after its anniversary.

interface GateableData {
  type: string;
  date: Date;
  sourceUrl?: string;
}

/** Self-published pieces have no outlet paywall to respect. */
const EXEMPT_TYPES = new Set(['Blog']);

/** How many paragraphs the teaser shows before the "continue reading" link. */
const PARAGRAPH_COUNT = 2;

export function isGated(data: GateableData): boolean {
  if (EXEMPT_TYPES.has(data.type) || !data.sourceUrl) return false;
  const embargoEnds = new Date(data.date);
  embargoEnds.setUTCFullYear(embargoEnds.getUTCFullYear() + 1);
  return Date.now() < embargoEnds.getTime();
}

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Splits a piece's converted body, from the top, into paragraph-sized units.
 * Most of Robert's documents use a real <p> (or <blockquote>, for a <quote>
 * tag) per paragraph, but some run several paragraphs together as a single
 * <p> separated by a blank line (a double <br />) rather than a proper
 * paragraph break — those get split on the blank line too, so "paragraph 2"
 * means the same amount of text either way the document was typed.
 */
function splitParagraphs(bodyHtml: string): string[] {
  const units: string[] = [];
  const blockRe = /<(p|blockquote)[^>]*>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(bodyHtml))) {
    const [full, tag] = match;
    if (tag.toLowerCase() !== 'p') {
      units.push(full);
      continue;
    }
    const inner = full.slice(full.indexOf('>') + 1, full.lastIndexOf('<'));
    const parts = inner.split(/(?:\s*<br\s*\/?>\s*){2,}/i).filter((p) => p.trim());
    if (parts.length <= 1) {
      units.push(full);
    } else {
      units.push(...parts.map((p) => `<p>${p.trim()}</p>`));
    }
  }
  return units;
}

/**
 * Truncates a piece's converted HTML body to its first couple of paragraphs
 * plus a "continue reading" link out to `sourceUrl`. Returns null (meaning:
 * show the body in full, gating isn't safe here) when the body doesn't have
 * enough left over to be worth hiding — gating a piece down to nothing but a
 * "continue reading" link with no piece left behind it defeats the point.
 */
export function teaser(bodyHtml: string, sourceUrl: string): string | null {
  const units = splitParagraphs(bodyHtml);
  if (units.length <= PARAGRAPH_COUNT) return null;

  const shown = units.slice(0, PARAGRAPH_COUNT);
  const shownLength = plainText(shown.join('')).length;
  if (shownLength > plainText(bodyHtml).length * 0.6) return null;

  return (
    shown.join('') +
    `<p class="piece-gate">To continue reading, please ` +
    `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">click here</a>.</p>`
  );
}
