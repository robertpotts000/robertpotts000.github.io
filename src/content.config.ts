import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * "pieces" — the Journalism archive.
 *
 * Each entry is a hand-authored metadata file at `src/data/pieces/<slug>.json`.
 * The entry `id` is the file's slug and is used as the URL (`/journalism/<slug>`)
 * and as the join key to its converted body at `src/pieces/html/<slug>.html`.
 * Keep the slug stable — it is what people link to.
 */
const pieces = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/pieces' }),
  schema: z.object({
    headline: z.string(),
    subheading: z.string(),
    type: z.enum(['Article', 'Blog', 'Interview', 'Obituary', 'Review']),
    date: z.coerce.date(),
    /** Curated card thumbnail — distinct from images inside the piece body. */
    image: z.string(),
    /** At most one piece: shown as the "hero" on the About page. */
    featured: z.boolean().optional().default(false),
    /** Hide from the archive without deleting. */
    draft: z.boolean().optional().default(false),
    /** Outlet it appeared in, decoded from the filename's publication code. Not yet shown on the site. */
    publication: z.string().optional(),
    /** Extra context (e.g. book/publisher details) from the doc's <details> tag. Not yet shown on the site. */
    details: z.string().optional(),
    /**
     * Where the piece first appeared online, from the doc's <url> tag. Pieces less
     * than a year old (and not type "Blog") show only their first paragraph plus a
     * link here, out of respect for the outlet's paywall — see src/lib/gating.ts.
     */
    sourceUrl: z.string().url().optional(),
    /** How many opening paragraphs the paywall teaser shows. Defaults to 2; raise it for a piece whose paragraphs are very short. */
    teaserParagraphs: z.number().int().min(1).max(10).optional(),
    /** Curated-page groupings; a piece may carry several. "music", "interviews", "fiction", "poetry" and "recreation" drive /journalism/music, /journalism/interviews, /journalism/fiction, /journalism/poetry and /journalism/recreations. */
    categories: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { pieces };
