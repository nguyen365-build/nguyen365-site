import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/case-studies" }),
  schema: z.object({
    title: z.string(),
    /** One-sentence hook used on cards and in social previews. */
    summary: z.string(),
    /** Only "published" entries are listed; drafts stay off the site entirely. */
    status: z.enum(["draft", "published"]).default("draft"),
    tags: z.array(z.string()).default([]),
    /** Display order across listings - lower comes first. */
    order: z.number().default(99),
    /** Rough reading time in minutes, shown on cards. */
    readTime: z.number().default(5),
  }),
});

export const collections = { "case-studies": caseStudies };
