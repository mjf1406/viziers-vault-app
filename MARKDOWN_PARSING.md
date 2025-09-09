<!-- @format -->

# Markdown / Obsidian parsing guide (Next.js App Router — build-time static pages)

Goal: parse standard Markdown + Obsidian features (wikilinks, callouts, embeds, frontmatter)
at build time and produce static pages.

---

## 1) Libraries to install

Run:

    npm install remark remark-parse remark-gfm remark-rehype rehype-stringify
    npm install remark-obsidian gray-matter

Relevant docs:

-   remark core: https://github.com/remarkjs/remark
-   remark-gfm: https://github.com/remarkjs/remark-gfm
-   remark-obsidian (example/fork — check the package you install): https://www.npmjs.com/search?q=remark-obsidian
    -   https://github.com/heavycircle/remark-obsidian
-   gray-matter: https://github.com/jonschlinkert/gray-matter
-   rehype-stringify: https://github.com/rehypejs/rehype/tree/main/packages/rehype-stringify

Next.js App Router SSG docs:

-   generateStaticParams / page: https://nextjs.org/docs/app/building-your-application/routing#dynamic-routes
-   data fetching at build time: https://nextjs.org/docs/app/building-your-application/data-fetching

---

## 2) Recommended parsing stack (build-time only)

-   Use `gray-matter` to split frontmatter + body.
-   Use `remark` with:
    -   `remark-gfm` (tables, strikethrough)
    -   `remark-obsidian` (handles Obsidian syntax: wikilinks, callouts, embeds — configure per project)
-   Convert to HTML via remark → rehype → `rehype-stringify`.

Rationale: parsing at build time keeps runtime lean and avoids shipping parsing logic to the client.

---

## 3) Example helper (build-time Markdown loader)

Place markdown files in `/content`. Minimal helper (use this as a copyable snippet — indented code block style):

    // lib/content.ts
    import fs from "fs";
    import path from "path";
    import matter from "gray-matter";
    import { remark } from "remark";
    import gfm from "remark-gfm";
    import obsidian from "remark-obsidian";
    import remarkRehype from "remark-rehype";
    import rehypeStringify from "rehype-stringify";

    const CONTENT_DIR = path.join(process.cwd(), "content");

    export function listSlugs() {
      return fs
        .readdirSync(CONTENT_DIR)
        .filter((f) => /\.mdx?$/.test(f))
        .map((f) => f.replace(/\.mdx?$/, ""));
    }

    export async function renderMarkdownFile(slug: string) {
      const filePath = path.join(CONTENT_DIR, `${slug}.md`);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { content, data } = matter(raw);

      const vfile = await remark()
        .use(gfm)
        .use(obsidian, {
          // Example options — adapt to your site linking structure
          wikiLinkBaseUrl: "/",
          wikiLinkExtension: ".md",
          // embed handling options, asset transforms, etc.
        })
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(content);

      return {
        html: String(vfile),
        frontmatter: data,
      };
    }

Notes:

-   Use `.md` or `.mdx` consistently. Adjust file detection if mixing.
-   If using TypeScript, ensure tsconfig allows importing .md files if you plan to import them directly elsewhere.

---

## 4) Next.js App Router integration (generateStaticParams + page)

Example app route (indented code block):

    // app/[slug]/page.tsx
    import React from "react";
    import { listSlugs, renderMarkdownFile } from "@/lib/content";

    export async function generateStaticParams() {
      return listSlugs().map((slug) => ({ slug }));
    }

    export default async function Page({ params }: { params: { slug: string } }) {
      const { html, frontmatter } = await renderMarkdownFile(params.slug);
      return (
        <article>
          <h1>{frontmatter.title ?? params.slug}</h1>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      );
    }

Notes:

-   These functions run at build time. Avoid browser-only packages in the pipeline.
-   Use `dangerouslySetInnerHTML` only for static/trusted content. If content can be user-supplied, sanitize.

---

## 5) remark-obsidian specifics & options to consider

-   Wikilinks:
    -   Map `[[Note Name]]` → anchor to `/note-name` (or other canonical URL).
    -   Support `[[Note|Alias]]` aliases.
    -   Configure base path and extension in plugin options.
-   Embeds:
    -   `![[file.png]]` → transform to `<img src="/assets/...">` or copy assets into `/public`.
    -   `![[Other Note]]` → either inline the rendered HTML of the target note or render a link.
    -   If inlining, implement embed-depth limits and cycle detection.
-   Callouts:
    -   Convert Obsidian callouts like `> [!note]` into semantic HTML: e.g., `<aside class="callout note">...</aside>`.
-   Frontmatter:
    -   Keep YAML frontmatter (title, tags, date, draft flag) via `gray-matter`.
    -   Use frontmatter to filter pages in `generateStaticParams` (e.g., skip draft: true).

Check the README of the remark-obsidian package you installed — options differ across forks.

---

## 6) Handling assets and embeds

-   Prefer storing images/assets used by content under a dedicated folder such as `/public/assets` or `content/assets`.
-   Normalize paths in the remark plugin config or add a small transform plugin that rewrites Obsidian-style relative paths to `/assets/...`.
-   For note-embeds:
    -   Option A (link): replace embed with a link to the target static page.
    -   Option B (inline): include rendered HTML of target note. If you choose this:
        -   Detect cycles and limit recursion depth (e.g., maxDepth = 3).
        -   Avoid duplicating large amounts of content that blow up build size.

---

## 7) Linking strategy & slug normalization

-   Centralize slug function:

    function slugify(input: string) {
    return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
    }

-   Reuse that same function in:
    -   generateStaticParams
    -   remark-obsidian wikilink resolver
    -   sitemap generation
    -   canonical URLs

Consistency prevents broken links.

---

## 8) Performance & caching

-   For many files, parsing every build can be slow.
-   Strategies:
    -   Cache HTML output to a `.cache/` folder keyed by file mtime or git hash.
    -   On build, skip parsing files whose hash/mtime matches cache.
    -   Use incremental/static regeneration offered by your hosting platform (if available).
-   Avoid deep recursive inlining of many notes at build time.

---

## 9) Security & sanitization

-   Trusted content: minimal sanitization required.
-   Untrusted content: run `rehype-sanitize` before injecting HTML.
-   Avoid evaluating code blocks. If syntax highlighting is needed, render it at build time using e.g., `shiki` or `rehype-highlight`.
-   rehype-sanitize: https://github.com/rehypejs/rehype-sanitize

---

## 10) Tests & validation

-   Unit tests to cover:
    -   slug normalization
    -   wikilink → URL transform
    -   embed resolution with depth and cycle cases
    -   frontmatter parsing and filtering
-   Snapshot tests:
    -   Render representative markdown files (callouts, embeds, wikilinks) and snapshot the HTML.

---

## 11) Dev tips & troubleshooting

-   Use AST inspection when things don’t behave:
    -   Use `unist-util-visit` to log AST nodes.
    -   AST explorer: https://astexplorer.net/ (choose unified/remark parser)
-   If remark-obsidian lacks behavior you need:
    -   Write a small remark plugin that walks the AST and rewrites nodes to rehype nodes or plain HTML.
-   Keep remark plugin config deterministic to ensure reproducible builds.

---

## 12) Quick checklist before commit

-   [ ] All `.md` files are in a single content dir (e.g., `/content`)
-   [ ] Centralized slug function used everywhere
-   [ ] remark-obsidian configured for wiki base path and asset paths
-   [ ] generateStaticParams uses `listSlugs()` and respects frontmatter (drafts)
-   [ ] HTML sanitization applied if content is user-supplied
-   [ ] Caching or incremental build strategy for large collections
-   [ ] Tests for wikilinks, embeds, callouts

---

## 13) Next steps (pick one)

-   I can produce a minimal working repo structure (files + sample content) demonstrating the full flow.
-   I can write a focused remark plugin to tweak wikilinks and alias handling using your slug rules.
-   I can add an example caching layer that writes parsed HTML to disk and reuses it on subsequent builds.

Which one do you want? (Reply with: "repo", "plugin", or "cache")
