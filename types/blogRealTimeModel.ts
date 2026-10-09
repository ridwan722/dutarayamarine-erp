export interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  metaKeywords?: string[];
  ogImage?: string;
  twitterCard?: string;
}

export interface BlogSchema {
  "@context": string;
  "@type": string;
  headline: string;
  image?: string[];
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": string;
    name: string;
  };
  publisher: {
    "@type": string;
    name: string;
    logo: {
      "@type": string;
      url: string;
    };
  };
  description: string;
}

export interface BlogM {
  id?: string;
  title: string;
  slug: string;
  image: string;
  id_image: string;
  description: string;
  content: BlogContentBlock[];
  published_at: string;
  author: Author;
  seoMeta?: SeoMeta;
  schemaBlog?: BlogSchema;
}

export interface Author {
  name: string;
  profile_url: string;
}

export interface BlogContentBlock {
  type: "h2" | "h3" | "p" | "ul" | "img" | "blockquote" | "table" | "rows";
  text?: string;
  items?: string[];
  url?: string;
  alt?: string;
  cols?: number;
  columns?: string[];
  rows?: string[][];
}
