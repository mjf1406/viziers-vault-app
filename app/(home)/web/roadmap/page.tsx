/** @format */

export const dynamic = "error";

export const metadata = {
    title: "Vizier's Vault - D&D 5e Tools",
    description:
        "Generate magic shops, encounters, spellbooks, battle maps, and worlds for D&D 5e 2024",
};

import { getR2ObjectText } from "@/lib/r2";
import { renderMarkdownString } from "@/lib/markdown";
import { OnThisPage } from "@/components/ui/on-this-page";
import { ContentWidth } from "@/components/ui/content-width";

export default async function RoadmapPage() {
    let html = "";
    let headings: { id: string; text: string; depth: number }[] = [];
    try {
        const md = await getR2ObjectText("mjf1406/ttrpg tools/Alpha.md");
        const rendered = await renderMarkdownString(md);
        html = rendered.html;
        headings = rendered.headings;
    } catch (_e) {
        html = "<p>Roadmap content is unavailable at the moment.</p>";
    }

    return (
        <section
            id="roadmap"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <div
                id="header"
                className="text-center mb-12"
            >
                <h2 className="text-lg text-primary mb-2 tracking-wider">
                    Roadmap
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    See what we're working on!
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Everything is subject to change based on user feedback,
                    testing, and my current interests. This updates when a new
                    version is pushed to the live site only.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_16rem] gap-16 w-fit">
                <div>
                    <ContentWidth>
                        <article className="prose dark:prose-invert">
                            {/* eslint-disable-next-line react/no-danger */}
                            <div dangerouslySetInnerHTML={{ __html: html }} />
                        </article>
                    </ContentWidth>
                </div>
                <div className="hidden xl:block xl:self-start sticky top-18">
                    <OnThisPage headings={headings} />
                </div>
            </div>
        </section>
    );
}
