/**
 * Ahrefs Web Analytics — cookieless, stores no personal data, so it sits
 * outside the consent gate the way this site is set up.
 *
 * Deliberately a plain <script> in <head> rather than next/script: with
 * strategy="afterInteractive" the tag only exists after hydration, so it is
 * absent from the initial HTML — and Ahrefs' "Verify installation" fetches the
 * raw document. It is async and ~2 kB, so it costs nothing to have it here.
 *
 * Not rendered on /admin or /studio: counting our own sessions would skew
 * every number the tool reports.
 */
const AHREFS_KEY = 'KQd1chiTKLGeBAdJmpAd0A';

export default function AhrefsAnalytics() {
  return (
    <script src="https://analytics.ahrefs.com/analytics.js" data-key={AHREFS_KEY} async />
  );
}
