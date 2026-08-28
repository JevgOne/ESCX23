import Script from 'next/script';

/**
 * Ahrefs Web Analytics — cookieless, no personal data, so it needs no consent
 * gate. It is a second counter next to GA, kept because Ahrefs cross-references
 * it with the backlink and keyword data in the same project.
 *
 * Not rendered on /admin or /studio: those are ours, and counting our own
 * sessions would skew every number the tool reports.
 */
const AHREFS_KEY = 'KQd1chiTKLGeBAdJmpAd0A';

export default function AhrefsAnalytics() {
  return (
    <Script
      src="https://analytics.ahrefs.com/analytics.js"
      data-key={AHREFS_KEY}
      strategy="afterInteractive"
    />
  );
}
