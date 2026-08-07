# nguyen365.com

The "hire me" site - case studies, resume, certifications. Sells nothing, proves
everything. Part of the [career-relaunch](https://github.com/nguyen365-build/career-relaunch)
project; build steps tracked in that repo's issue #9.

Astro + Cloudflare Pages, per [career-relaunch/docs/tech-stack.md](https://github.com/nguyen365-build/career-relaunch/blob/main/docs/tech-stack.md).

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`       | Install dependencies                        |
| `npm run dev`       | Start local dev server at `localhost:4321`  |
| `npm run build`     | Build the production site to `./dist/`      |
| `npm run preview`   | Preview the build locally before deploying  |

## Structure

- `/` - home
- `/case-studies/` - content collection, one entry per write-up
- `/learning/` - practice projects, kept separate from case studies
- `/certifications/` - list ordered by relevance, not alphabetically
- `/resume/` - resume summary + contact
