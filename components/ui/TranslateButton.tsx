'use client';

import { useState } from 'react';

const LANG_MAP: Record<string, string> = {
  cs: 'cs',
  en: 'en',
  de: 'de',
  uk: 'uk',
};

const LABEL: Record<string, string> = {
  cs: 'Přeložit',
  en: 'Translate',
  de: 'Übersetzen',
  uk: 'Перекласти',
};

const ORIGINAL_LABEL: Record<string, string> = {
  cs: 'Originál',
  en: 'Original',
  de: 'Original',
  uk: 'Оригінал',
};

interface Props {
  text: string;
  targetLocale: string;
}

export default function TranslateButton({ text, targetLocale }: Props) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const target = LANG_MAP[targetLocale] ?? 'en';

  async function handleTranslate() {
    if (translated) {
      setShowOriginal((v) => !v);
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(text);
      const res = await fetch(
        `https://lingva.ml/api/v1/auto/${target}/${encoded}`
      );
      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      setTranslated(data.translation ?? text);
    } catch {
      // Fallback: open Google Translate in new tab
      const url = `https://translate.google.com/?sl=auto&tl=${target}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {translated && !showOriginal && (
        <p className="rev-item-text rev-item-translated">{translated}</p>
      )}
      <button
        type="button"
        className="rev-translate-btn"
        onClick={handleTranslate}
        disabled={loading}
      >
        {loading
          ? '...'
          : translated
            ? showOriginal
              ? LABEL[targetLocale] ?? 'Translate'
              : ORIGINAL_LABEL[targetLocale] ?? 'Original'
            : `🌐 ${LABEL[targetLocale] ?? 'Translate'}`}
      </button>
    </>
  );
}
