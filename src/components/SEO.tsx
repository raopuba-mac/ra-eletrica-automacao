import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  canonicalUrl?: string;
}

export default function SEO({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage = '/og-image.png',
  canonicalUrl,
}: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to get or create a meta tag helper
    const getOrCreateMeta = (attrName: string, attrVal: string, contentKey: 'content' | 'property' = 'content') => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      return element;
    };

    // 2. Standard Meta Tags
    const descMeta = getOrCreateMeta('name', 'description');
    descMeta.setAttribute('content', description);

    // Auto update keywords if provided
    const keysMeta = getOrCreateMeta('name', 'keywords');
    keysMeta.setAttribute('content', keywords || 'elétrica, automação, segurança eletrônica, gestão de serviços, orçamentos, ordens de serviço');

    // 3. Open Graph Tags
    const ogUrlMeta = getOrCreateMeta('property', 'og:url');
    ogUrlMeta.setAttribute('content', canonicalUrl || window.location.href);

    const ogTypeMeta = getOrCreateMeta('property', 'og:type');
    ogTypeMeta.setAttribute('content', ogType);

    const ogTitleMeta = getOrCreateMeta('property', 'og:title');
    ogTitleMeta.setAttribute('content', title);

    const ogDescMeta = getOrCreateMeta('property', 'og:description');
    ogDescMeta.setAttribute('content', description);

    const ogImageMeta = getOrCreateMeta('property', 'og:image');
    const absoluteImageUrl = ogImage.startsWith('http') 
      ? ogImage 
      : `${window.location.origin}${ogImage}`;
    ogImageMeta.setAttribute('content', absoluteImageUrl);

    // 4. Twitter Cards Tag Info
    const twCardMeta = getOrCreateMeta('name', 'twitter:card');
    twCardMeta.setAttribute('content', 'summary_large_image');

    const twTitleMeta = getOrCreateMeta('name', 'twitter:title');
    twTitleMeta.setAttribute('content', title);

    const twDescMeta = getOrCreateMeta('name', 'twitter:description');
    twDescMeta.setAttribute('content', description);

    const twImageMeta = getOrCreateMeta('name', 'twitter:image');
    twImageMeta.setAttribute('content', absoluteImageUrl);

    // 5. Canonical Url Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || window.location.href);

  }, [title, description, keywords, ogType, ogImage, canonicalUrl]);

  return null;
}
