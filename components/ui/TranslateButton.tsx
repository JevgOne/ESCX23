'use client';

import { useState } from 'react';

const LANG_MAP: Record<string, string> = {
  cs: 'cs',
  en: 'en',
  de: 'de',
  uk: 'uk',
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
      const url = `https://translate.google.com/?sl=auto&tl=${target}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener');
    } finally {
      setLoading(false);
    }
  }

  const isActive = translated && !showOriginal;

  return (
    <div className="rev-translate-wrap">
      <button
        type="button"
        className={`rev-translate-btn${isActive ? ' active' : ''}`}
        onClick={handleTranslate}
        disabled={loading}
        title={translated ? (showOriginal ? 'Translate' : 'Original') : 'Translate'}
      >
        {loading ? '⏳' : '🌐'}
      </button>
      {translated && !showOriginal && (
        <div className="rev-item-translated-bubble">
          {translated}
        </div>
      )}
    </div>
  );
}
