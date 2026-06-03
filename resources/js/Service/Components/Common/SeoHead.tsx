import { Head } from "@inertiajs/react";
import type { SeoData } from "@/types";

interface SeoHeadProps {
    seo?: SeoData & { ogImage?: string };
    defaultTitle?: string;
}

export default function SeoHead({ seo = {}, defaultTitle = "" }: SeoHeadProps) {
    const title = seo.title ?? defaultTitle;
    const description = seo.description ?? "";
    const canonical = seo.canonical ?? "";
    const ogImage = seo.ogImage ?? null;

    return (
        <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonical} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonical} />
            {ogImage && <meta property="og:image" content={ogImage} />}
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}
        </Head>
    );
}
