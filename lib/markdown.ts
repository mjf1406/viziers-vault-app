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
    headings: Array<{
        id: string;
        text: string;
        depth: number; // 1-6
    }>;
};

export type SectionIndexItem = {
    slug: string[];
    href: string;
    title: string;
    description?: string;
    date?: string;
    category?: string;
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
            const category =
                (data?.category as string | undefined) ?? undefined;

            items.push({
                slug: slugParts,
                href: `/${section}/${slugParts.join("/")}`,
                title,
                description,
                date,
                category,
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

export type FolderTree = {
    name: string; // folder or file base name
    slug: string[]; // accumulated
    href?: string; // for files
    title?: string; // from frontmatter or slug
    children?: FolderTree[]; // for folders
};

export function listSectionFolderTree(section: "docs" | "blog"): FolderTree[] {
    const baseDir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(baseDir)) return [];

    function readDir(dir: string, parts: string[]): FolderTree[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const folders: FolderTree[] = [];
        const files: FolderTree[] = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const sub = readDir(path.join(dir, entry.name), [
                    ...parts,
                    slugify(entry.name),
                ]);
                folders.push({
                    name: entry.name,
                    slug: [...parts, slugify(entry.name)],
                    children: sub,
                });
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
            files.push({
                name: fileBase,
                slug: slugParts,
                href: `/${section}/${slugParts.join("/")}`,
                title,
            });
        }

        // Sort folders and files by title/name
        folders.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) =>
            (a.title ?? a.name).localeCompare(b.title ?? b.name)
        );
        return [...folders, ...files];
    }

    return readDir(baseDir, []);
}

// Resolve a filesystem path from a `[...slug]` array, trying .md then .mdx
function resolveFilePath(
    section: "docs" | "blog",
    slugParts: string[]
): string | null {
    // Walk the filesystem by matching each slug to the slugified entry name
    let currentDir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(currentDir)) return null;

    // If there is only one part, it may be a file at root or a folder with index
    const parts = [...slugParts];

    // Try to resolve as a file at each level when we are at the last part
    for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        if (isLast) {
            // 1) Try to find a file whose base name slugifies to part
            for (const entry of entries) {
                if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
                    const base = entry.name.replace(/\.mdx?$/, "");
                    if (slugify(base) === part) {
                        return path.join(currentDir, entry.name);
                    }
                }
            }
            // 2) Try a directory whose slug matches, then index.md(x)
            let matchedDir: string | null = null;
            for (const entry of entries) {
                if (entry.isDirectory() && slugify(entry.name) === part) {
                    matchedDir = path.join(currentDir, entry.name);
                    break;
                }
            }
            if (matchedDir) {
                const idxMd = path.join(matchedDir, "index.md");
                const idxMdx = path.join(matchedDir, "index.mdx");
                if (fs.existsSync(idxMd)) return idxMd;
                if (fs.existsSync(idxMdx)) return idxMdx;
            }
            // 3) Fallback: try direct exact file path constructions (legacy)
            const legacyCandidates = [
                path.join(currentDir, `${part}.md`),
                path.join(currentDir, `${part}.mdx`),
            ];
            for (const candidate of legacyCandidates) {
                if (fs.existsSync(candidate)) return candidate;
            }
            return null;
        }

        // Not last: must be a directory that matches this slug
        let nextDir: string | null = null;
        for (const entry of entries) {
            if (entry.isDirectory() && slugify(entry.name) === part) {
                nextDir = path.join(currentDir, entry.name);
                break;
            }
        }
        if (!nextDir) return null;
        currentDir = nextDir;
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

    // Collect headings and assign slug ids that will survive into HTML
    const collectedHeadings: Array<{
        id: string;
        text: string;
        depth: number;
    }> = [];
    function remarkCollectHeadings() {
        return (tree: any) => {
            visit(tree, "heading", (node: any) => {
                const depth: number = node.depth;
                if (!Array.isArray(node.children)) return;
                const text = node.children
                    .filter((c: any) => c.type === "text" || c.value)
                    .map((c: any) => (c.value ?? c.alt ?? "").toString())
                    .join("")
                    .trim();
                if (!text) return;
                const baseId = slugify(text);
                let id = baseId;
                // De-duplicate ids (rare but possible on long pages)
                let i = 2;
                while (collectedHeadings.some((h) => h.id === id)) {
                    id = `${baseId}-${i++}`;
                }
                // Ensure id is attached so rehype-stringify emits it on the element
                node.data = node.data || {};
                node.data.hProperties = node.data.hProperties || {};
                node.data.hProperties.id = id;
                collectedHeadings.push({ id, text, depth });
            });
        };
    }

    const vfile = await remark()
        .use(gfm)
        .use(remarkMath)
        .use(remarkRemoveFirstH1)
        .use(remarkCollectHeadings)
        // Add remark-obsidian or other plugins here as needed in the future
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify)
        .process(withEmbeds);

    return {
        html: String(vfile),
        frontmatter: data,
        headings: collectedHeadings,
    };
}

export function listParams(section: "docs" | "blog"): { slug: string[] }[] {
    return listSectionSlugs(section).map((parts) => ({ slug: parts }));
}

// Render a raw markdown string (e.g., fetched from external storage) using the
// same Obsidian-friendly pipeline as above. Since we are not on the filesystem,
// we parse frontmatter from the string and convert Obsidian embeds to standard
// markdown image links without section-relative rewriting.
export async function renderMarkdownString(
    markdown: string,
    opts?: { assetsBaseUrl?: string }
): Promise<RenderedMarkdown> {
    const { content, data } = matter(markdown);

    // Normalize single-line $$...$$ expressions into display blocks
    const normalized = content.replace(
        /^[\t ]*\$\$(.+?)\$\$[\t ]*$/gm,
        (_m, expr) => {
            return `$$\n${expr}\n$$`;
        }
    );

    // Convert Obsidian image embeds ![[...]] into standard markdown images
    const withEmbeds = normalized.replace(
        /!\[\[([^\]]+)\]\]/g,
        (_m, target: string) => {
            const cleanTarget = target.trim();
            const href = opts?.assetsBaseUrl
                ? `${opts.assetsBaseUrl.replace(/\/$/, "")}/${cleanTarget}`
                : cleanTarget;
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

    // Collect headings and assign slug ids that will survive into HTML
    const collectedHeadings: Array<{
        id: string;
        text: string;
        depth: number;
    }> = [];
    function remarkCollectHeadings() {
        return (tree: any) => {
            visit(tree, "heading", (node: any) => {
                const depth: number = node.depth;
                if (!Array.isArray(node.children)) return;
                const text = node.children
                    .filter((c: any) => c.type === "text" || c.value)
                    .map((c: any) => (c.value ?? c.alt ?? "").toString())
                    .join("")
                    .trim();
                if (!text) return;
                const baseId = slugify(text);
                let id = baseId;
                // De-duplicate ids (rare but possible on long pages)
                let i = 2;
                while (collectedHeadings.some((h) => h.id === id)) {
                    id = `${baseId}-${i++}`;
                }
                // Ensure id is attached so rehype-stringify emits it on the element
                (node as any).data = (node as any).data || {};
                (node as any).data.hProperties =
                    (node as any).data.hProperties || {};
                (node as any).data.hProperties.id = id;
                collectedHeadings.push({ id, text, depth });
            });
        };
    }

    const vfile = await remark()
        .use(gfm)
        .use(remarkMath)
        .use(remarkRemoveFirstH1)
        .use(remarkCollectHeadings)
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify)
        .process(withEmbeds);

    return {
        html: String(vfile),
        frontmatter: data,
        headings: collectedHeadings,
    };
}
