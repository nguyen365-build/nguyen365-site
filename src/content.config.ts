import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/case-studies" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["draft", "published"]).default("draft"),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { "case-studies": caseStudies };
