/** @format */

import React from "react";
import { listParams, renderMarkdown } from "@/lib/markdown";

export async function generateStaticParams() {
    return listParams("blog");
}

export default async function BlogPostPage({
    params,
}: {
    params: { slug: string[] };
}) {
    const { html, frontmatter } = await renderMarkdown("blog", params.slug);
    return (
        <article className="prose dark:prose-invert prose-container">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
                {(frontmatter as any)?.title ?? params.slug.at(-1)}
            </h1>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
    );
}
