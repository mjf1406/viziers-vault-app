/** @format */

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
    question: string;
    answer: string;
    value: string;
}

const FAQList: FAQProps[] = [
    {
        question: "What D&D edition does Vizier's Vault support?",
        answer: "Vizier's Vault is designed specifically for D&D 5e 2024, using the latest rules and content from the updated edition.",
        value: "item-1",
    },
    {
        question: "Can I use the free version for my campaigns?",
        answer: "Yes, the free version includes all generators with premade cities and worlds, but no data persistance, so once you leave the page or your computer has to free up some RAM, you may lose everything. You can export generations as CSV files, though data won't persist between sessions.",
        value: "item-2",
    },
    {
        question: "What's included in the Premium subscription?",
        answer: "Premium includes all current and future generators, custom world/city creation, data persistence, permalink generation, and priority support. You get a free month trial when you sign up.",
        value: "item-3",
    },
    {
        question: "Can I export generated content to my VTT?",
        answer: "Yes, battle maps can be exported in formats compatible with popular virtual tabletop platforms. Other generated content can be exported as CSV files for easy integration.",
        value: "item-4",
    },
    {
        question: "How accurate is the encounter balancing?",
        answer: "Encounters are balanced using official D&D 5e 2024 guidelines, taking into account your party's composition, levels, and the encounter difficulty you select.",
        value: "item-5",
    },
    {
        question: "Can I create custom content or modify the generators?",
        answer: "Currently, the generators use official D&D 5e data. Custom world and city creation is available in Premium, and we're working on more customization options for future releases.",
        value: "item-6",
    },
    {
        question: "What about other systems?",
        answer: "I want to support other systems as I play and learn them, but I'll have to look at licensing agreements to ensure they allow the creation of digital tools. I would also like to make it easy for open source contributions of additional systems.",
        value: "item-7",
    },
];

export const FAQSection = () => {
    return (
        <section
            id="faq"
            className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32"
        >
            <div className="text-center mb-8">
                <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
                    FAQ
                </h2>

                <h2 className="text-3xl md:text-4xl text-center font-bold">
                    Frequently Asked Questions
                </h2>
            </div>

            <Accordion
                type="single"
                collapsible
                className="AccordionRoot"
            >
                {FAQList.map(({ question, answer, value }) => (
                    <AccordionItem
                        key={value}
                        value={value}
                    >
                        <AccordionTrigger className="text-left">
                            {question}
                        </AccordionTrigger>

                        <AccordionContent>{answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
};
