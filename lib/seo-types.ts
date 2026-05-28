/**
 * SEO metadata types
 * Can be imported on both client and server without side effects
 */

export interface SEOMetadata {
  id?: number;
  page_path: string;
  page_type: string;
  locale: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  schema_type?: string;
  schema_data?: string;
  canonical_url?: string;
  robots_index?: number;
  robots_follow?: number;
  focus_keyword?: string;
  seo_score?: number;
}
