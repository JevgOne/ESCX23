/**
 * SEO utility functions that can be used on both client and server
 * This file contains no database imports
 */

import { SEOMetadata } from './seo-types';

/**
 * Calculate SEO score (like Yoast SEO)
 * @param seo - SEO metadata to analyze
 * @returns Score from 0-100
 */
export function calculateSEOScore(seo: Partial<SEOMetadata>): number {
  let score = 0;

  // Meta title (20 points)
  if (seo.meta_title) {
    score += 10;
    if (seo.meta_title.length >= 50 && seo.meta_title.length <= 60) {
      score += 10; // Perfect length
    } else if (seo.meta_title.length >= 30 && seo.meta_title.length <= 70) {
      score += 5; // Acceptable length
    }
  }

  // Meta description (20 points)
  if (seo.meta_description) {
    score += 10;
    if (seo.meta_description.length >= 150 && seo.meta_description.length <= 160) {
      score += 10; // Perfect length
    } else if (seo.meta_description.length >= 100 && seo.meta_description.length <= 180) {
      score += 5; // Acceptable length
    }
  }

  // Focus keyword (30 points)
  if (seo.focus_keyword) {
    score += 10; // Has focus keyword

    // Check if keyword is in title
    if (seo.meta_title && seo.meta_title.toLowerCase().includes(seo.focus_keyword.toLowerCase())) {
      score += 10;
    }

    // Check if keyword is in description
    if (seo.meta_description && seo.meta_description.toLowerCase().includes(seo.focus_keyword.toLowerCase())) {
      score += 10;
    }
  }

  // OG Image (10 points)
  if (seo.og_image) {
    score += 10;
  }

  // Meta keywords (10 points)
  if (seo.meta_keywords) {
    score += 10;
  }

  // Canonical URL (10 points)
  if (seo.canonical_url) {
    score += 10;
  }

  return Math.min(score, 100);
}
