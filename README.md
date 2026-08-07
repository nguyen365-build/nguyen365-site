# nguyen365.com

The "hire me" site - case studies, resume, certifications. Sells nothing, proves
everything. Part of the [career-relaunch](https://github.com/nguyen365-build/career-relaunch)
project; build steps tracked in that repo's issue #9.

Astro + Cloudflare Pages, per [career-relaunch/docs/tech-stack.md](https://github.com/nguyen365-build/career-relaunch/blob/main/docs/tech-stack.md).

## Commands

| Command                      | Action                                             |
| :--------------------------- | :------------------------------------------------- |
| `npm install`                | Install dependencies                               |
| `npm run dev`                | Start local dev server at `localhost:4321`         |
| `npm run build`              | Build the production site to `./dist/`             |
| `npm run preview`            | Preview the build locally before deploying         |
| `python scripts/make-og.py`  | Regenerate the `/og.png` social card               |
| `bash scripts/check-links.sh`| Verify every external citation still resolves      |

## Structure

- `/` - home
- `/case-studies/` - content collection, one entry per write-up
- `/learning/` - practice projects, kept separate from case studies
- `/certifications/` - list ordered by relevance, not alphabetically
- `/resume/` - full resume, print-optimised (browser print-to-PDF produces the file)

## Where the facts live

`src/data/profile.ts` is the single source of truth for every personal fact on the
site: contact details, roles, certifications, education, and the stack list. Nothing
factual should be hardcoded into a page.

Everything in that file is transcribed from Minh's own LinkedIn export or the
career-relaunch repo. Items commented `VERIFY` still need confirmation before the
site is treated as final - currently the two leading certification titles and the
Athabasca education date (see career-relaunch issue #1).

## Editorial rules for case studies

These are the constraints the existing write-ups follow, and new ones should too.

- **Clean-room.** No employer source code, configuration, vendor contract terms,
  member data, internal metrics, or volumes. The pattern and the reasoning only.
- **No invented numbers.** If a figure would be persuasive but cannot be published,
  leave it out rather than rounding it into something vague. Every page says so
  explicitly, which is only credible if it stays true.
- **Cite primary sources.** Specifications, regulator and network rule text, and
  vendor documentation, linked directly. Run `scripts/check-links.sh` after editing.
- **Get the vocabulary exactly right.** Episys is the core, Symitar is the Jack Henry
  division. SymXchange is SOAP, not REST. VTS is the token service, VDEP is the
  commercial programme. Precision here is most of the credibility.
- Set `status: "published"` in frontmatter to make an entry visible. Drafts are
  excluded from the build entirely rather than shown with a "draft" badge.

## Quality bar

Checked before the last commit, on the built site:

- Lighthouse: Accessibility 100, Best Practices 100, SEO 100 (home and case-study pages)
- No horizontal overflow at a 390px viewport on any of the 10 routes
- All external citations resolve (`scripts/check-links.sh`)
