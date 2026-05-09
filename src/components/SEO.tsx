import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export const SEO = ({
    title,
    description,
    image = "https://credswap.app/og-image.png",
    url = "https://credswap.app",
    type = "website",
}: SEOProps) => {
    const fullTitle = title ? `${title} - CredSwap` : "CredSwap";
    const defaultDescription = "CredSwap is your all-in-one campus platform — discover verified student housing, browse the campus marketplace, and join student communities.";


    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};
