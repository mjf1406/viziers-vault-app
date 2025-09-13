/** @format */

import React from "react";
import { listParams, renderMarkdown } from "@/lib/markdown";
import Link from "next/link";
import { OnThisPage } from "@/components/ui/on-this-page";
import { ContentWidth } from "@/components/ui/content-width";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export async function generateStaticParams() {
    return listParams("docs");
}

export default async function DocsPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const { slug } = await params;
    const { html, frontmatter, headings } = await renderMarkdown("docs", slug);
    const crumbs = [
        { href: "/", label: "Home" },
        { href: "/docs", label: "Docs" },
        {
            href: `/${["docs", ...slug].join("/")}`,
            label: (frontmatter as any)?.title ?? slug.at(-1) ?? "",
        },
    ];
    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_16rem] gap-16 w-fit">
            <div>
                <Breadcrumb className="mb-4">
                    <BreadcrumbList>
                        {crumbs.map((c, i) => (
                            <BreadcrumbItem key={c.href}>
                                {i > 0 ? <BreadcrumbSeparator /> : null}
                                <BreadcrumbLink href={c.href}>
                                    {c.label}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <ContentWidth>
                    <article className="prose dark:prose-invert">
                        <h1 className="text-4xl font-bold tracking-tight mb-4">
                            {(frontmatter as any)?.title ?? slug.at(-1)}
                        </h1>
                        {/* eslint-disable-next-line react/no-danger */}
                        <div dangerouslySetInnerHTML={{ __html: html }} />
                    </article>
                </ContentWidth>
            </div>
            <div className="hidden xl:block xl:self-start sticky top-18">
                <OnThisPage headings={headings} />
            </div>
        </div>
    );
}
