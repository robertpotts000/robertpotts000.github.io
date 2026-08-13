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
  }),
});

export const collections = { pieces };
