import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
}

export function SEOHead({ 
  title = "DAP Connect - Digital Address Portal",
  description = "India's Digital Address Project. Create precision digital addresses backed by DIGIPIN geospatial codes. Private, precise, and portable.",
  keywords = "Digital Address, DIGIPIN, India Post, DAP, Digital Public Infrastructure, Address Verification",
  canonicalUrl
}: SEOHeadProps) {
  const fullTitle = title.includes("DAP Connect") ? title : `${title} | DAP Connect`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
