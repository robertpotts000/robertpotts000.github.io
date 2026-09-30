// Recent pieces stay behind the originating outlet's paywall for a year: only
// the first paragraph renders, followed by a link out to where the piece was
// actually published. After a year the piece reverts to showing in full.
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

export function isGated(data: GateableData): boolean {
  if (EXEMPT_TYPES.has(data.type) || !data.sourceUrl) return false;
  const embargoEnds = new Date(data.date);
  embargoEnds.setUTCFullYear(embargoEnds.getUTCFullYear() + 1);
  return Date.now() < embargoEnds.getTime();
}

/**
 * Truncates a piece's converted HTML body to its first paragraph plus a
 * "continue reading" link out to `sourceUrl`. Returns null (meaning: show
 * the body in full, gating isn't safe here) when the body doesn't look like
 * it has more than one paragraph to hide — some of Robert's documents run
 * the whole piece as a single <p> stitched together with soft line breaks,
 * and gating that would show a "continue reading" link with nothing left
 * behind it.
 */
export function teaser(bodyHtml: string, sourceUrl: string): string | null {
  const match = bodyHtml.match(/^\s*<p[^>]*>[\s\S]*?<\/p>/i);
  if (!match || match[0].length > bodyHtml.length * 0.6) return null;
  return (
    match[0] +
    `<p class="piece-gate">To continue reading, please ` +
    `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">click here</a>.</p>`
  );
}
