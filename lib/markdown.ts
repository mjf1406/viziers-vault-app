/** @format */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";

// Centralized slug function to keep URLs consistent across sections
export function slugify(input: string): string {
    return input
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-/]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

const CONTENT_DIR = path.join(process.cwd(), "content");

export type RenderedMarkdown = {
    html: string;
    frontmatter: Record<string, unknown>;
};

export type SectionIndexItem = {
    slug: string[];
    href: string;
    title: string;
    description?: string;
    date?: string;
};

// List all slugs (including nested) under a section, returning `[...slug]` arrays
export function listSectionSlugs(section: "docs" | "blog"): string[][] {
    const baseDir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(baseDir)) return [];

    const results: string[][] = [];

    const walk = (dir: string, parts: string[]) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                walk(path.join(dir, entry.name), [
                    ...parts,
                    slugify(entry.name),
                ]);
                continue;
            }

            const isMarkdown = /\.mdx?$/.test(entry.name);
            if (!isMarkdown) continue;

            const name = entry.name.replace(/\.mdx?$/, "");
            const slug = slugify(name);
            results.push([...parts, slug]);
        }
    };

    walk(baseDir, []);
    return results;
}

export function listSectionIndex(section: "docs" | "blog"): SectionIndexItem[] {
    const baseDir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(baseDir)) return [];

    const items: SectionIndexItem[] = [];

    const walk = (dir: string, parts: string[]) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                walk(path.join(dir, entry.name), [
                    ...parts,
                    slugify(entry.name),
                ]);
                continue;
            }

            if (!/\.mdx?$/.test(entry.name)) continue;

            const isIndex = /^index\.mdx?$/.test(entry.name);
            const fileBase = entry.name.replace(/\.mdx?$/, "");
            const fileSlug = slugify(fileBase);
            const slugParts = isIndex ? parts : [...parts, fileSlug];

            const fullPath = path.join(dir, entry.name);
            const raw = fs.readFileSync(fullPath, "utf-8");
            const { data } = matter(raw);

            const title =
                (data?.title as string) ??
                slugParts[slugParts.length - 1] ??
                "Untitled";
            const description = data?.description as string | undefined;
            const date = (data?.date as string | Date | undefined)?.toString();

            items.push({
                slug: slugParts,
                href: `/${section}/${slugParts.join("/")}`,
                title,
                description,
                date,
            });
        }
    };

    walk(baseDir, []);

    // Sort: docs by title; blog by date desc then title
    if (section === "blog") {
        items.sort((a, b) => {
            const aTime = a.date ? Date.parse(a.date) : 0;
            const bTime = b.date ? Date.parse(b.date) : 0;
            if (bTime !== aTime) return bTime - aTime;
            return a.title.localeCompare(b.title);
        });
    } else {
        items.sort((a, b) => a.title.localeCompare(b.title));
    }

    return items;
}

// Resolve a filesystem path from a `[...slug]` array, trying .md then .mdx
function resolveFilePath(
    section: "docs" | "blog",
    slugParts: string[]
): string | null {
    const baseDir = path.join(CONTENT_DIR, section);
    const rel = slugParts.join(path.sep);
    const candidates = [
        path.join(baseDir, `${rel}.md`),
        path.join(baseDir, `${rel}.mdx`),
        // also support files that already end with index.md under a folder
        path.join(baseDir, rel, "index.md"),
        path.join(baseDir, rel, "index.mdx"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
    }
    return null;
}

export async function renderMarkdown(
    section: "docs" | "blog",
    slugParts: string[]
): Promise<RenderedMarkdown> {
    const filePath = resolveFilePath(section, slugParts);
    if (!filePath) {
        throw new Error(
            `Markdown file not found for ${section}: ${slugParts.join("/")}`
        );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const { content, data } = matter(raw);

    // Normalize single-line $$...$$ expressions into display blocks
    const normalized = content.replace(
        /^[\t ]*\$\$(.+?)\$\$[\t ]*$/gm,
        (_m, expr) => {
            return `$$\n${expr}\n$$`;
        }
    );

    // Convert Obsidian image embeds ![[...]] into standard markdown images
    const sectionRoot = path.join(CONTENT_DIR, section);
    const currentDirRel = path.relative(sectionRoot, path.dirname(filePath));
    const withEmbeds = normalized.replace(
        /!\[\[([^\]]+)\]\]/g,
        (_m, target: string) => {
            const cleanTarget = target.trim();
            const joined = path
                .join(currentDirRel, cleanTarget)
                .replace(/\\/g, "/");
            const href = `/api/content-files/${section}/${joined}`;
            return `![](${href})`;
        }
    );

    // Remove the first H1 from the document to avoid duplicate titles
    function remarkRemoveFirstH1() {
        return (tree: any) => {
            let removed = false;
            visit(tree, "heading", (node, index, parent) => {
                if (
                    !removed &&
                    (node as any).depth === 1 &&
                    parent &&
                    typeof index === "number"
                ) {
                    (parent as any).children.splice(index, 1);
                    removed = true;
                }
            });
        };
    }

    const vfile = await remark()
        .use(gfm)
        .use(remarkMath)
        .use(remarkRemoveFirstH1)
        // Add remark-obsidian or other plugins here as needed in the future
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify)
        .process(withEmbeds);

    return { html: String(vfile), frontmatter: data };
}

export function listParams(section: "docs" | "blog"): { slug: string[] }[] {
    return listSectionSlugs(section).map((parts) => ({ slug: parts }));
}
