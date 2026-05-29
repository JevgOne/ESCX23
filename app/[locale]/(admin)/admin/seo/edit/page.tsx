"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';


function EditSEOForm() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'cs';
  const pagePath = searchParams?.get('path') || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    focus_keyword: '',
    og_title: '',
    og_description: '',
    og_image: '',
    og_image_alt: '',
    canonical_url: '',
    h1_title: '',
    h2_subtitle: '',
    page_content: '',
  });
  const [generating, setGenerating] = useState(false);

  // Check if this is a hashtag page
  const isHashtagPage = pagePath.includes('/hashtag/') || pagePath.includes('/sluzby/');

  useEffect(() => {
    if (!pagePath) {
      setError('Chybí parametr path v URL');
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const res = await fetch(`/api/seo?page_path=${encodeURIComponent(pagePath)}`);
        const data = await res.json();

        if (data.success && data.metadata) {
          // Auto-fix Vercel Blob URLs without file extension
          let ogImage = data.metadata.og_image || '';
          if (ogImage && ogImage.includes('blob.vercel-storage.com') && !ogImage.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
            ogImage = ogImage + '.png';
          }

          setFormData({
            meta_title: data.metadata.meta_title || '',
            meta_description: data.metadata.meta_description || '',
            meta_keywords: data.metadata.meta_keywords || '',
            focus_keyword: data.metadata.focus_keyword || '',
            og_title: data.metadata.og_title || '',
            og_description: data.metadata.og_description || '',
            og_image: ogImage,
            og_image_alt: data.metadata.og_image_alt || '',
            canonical_url: data.metadata.canonical_url || '',
            h1_title: data.metadata.h1_title || '',
            h2_subtitle: data.metadata.h2_subtitle || '',
            page_content: data.metadata.page_content || '',
          });
        }
      } catch (err: any) {
        console.error(err);
        setError('Chyba při načítání: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [pagePath]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Soubor musí být obrázek');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Velikost souboru nesmí přesáhnout 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/seo/upload-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, og_image: data.url }));
        setSuccess('✅ Obrázek nahrán!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Chyba při nahrávání');
      }
    } catch (err: any) {
      setError('Chyba: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    // Extract locale and page_type from path
    const localeMatch = pagePath.match(/^\/(cs|en|de|uk)/);
    const locale = localeMatch ? localeMatch[1] : 'cs';

    let pageType = 'static';
    if (pagePath.includes('/profily/')) pageType = 'girl';
    else if (pagePath.includes('/blog/')) pageType = 'blog';
    else if (pagePath.includes('/sluzby/')) pageType = 'dynamic';

    const payload = {
      page_path: pagePath,
      page_type: pageType,
      locale: locale,
      ...formData,
      robots_index: 1,
      robots_follow: 1,
      seo_score: 75
    };

    console.log('[SEO SAVE] Sending data:', payload);

    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[SEO SAVE] Response status:', res.status);

      const data = await res.json();
      console.log('[SEO SAVE] Response data:', data);

      if (data.success) {
        setSuccess('✅ SEO metadata uložena!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Chyba při ukládání');
      }
    } catch (err: any) {
      console.error('[SEO SAVE] Error:', err);
      setError('Chyba: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!pagePath) {
    return (
      <>
        
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            Chyba: Chybí parametr 'path' v URL
          </div>
          <Link href={`/${locale}/admin/seo`} style={{ color: '#d4af37', textDecoration: 'none' }}>
            ← Zpět na SEO Manager
          </Link>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        
        <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
          Načítání...
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>SEO Editor</h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          Stránka: <strong style={{ color: '#d4af37' }}>{pagePath}</strong>
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              Meta Title *
            </label>
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="e.g., Escort Praha | LovelyGirls"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              {formData.meta_title.length}/60 znaků
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              Meta Description *
            </label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="e.g., Prémiové escort služby v Praze..."
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              {formData.meta_description.length}/160 znaků
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              Meta Keywords
            </label>
            <input
              type="text"
              value={formData.meta_keywords}
              onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="escort praha, escort služby, vip escort"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Oddělené čárkou
            </small>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              Focus Keyword
            </label>
            <input
              type="text"
              value={formData.focus_keyword}
              onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="e.g., escort praha"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Hlavní klíčové slovo
            </small>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '1.5rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Open Graph (Social Media)
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              OG Title
            </label>
            <input
              type="text"
              value={formData.og_title}
              onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="Fallback to Meta Title if empty"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Titulek pro Facebook/LinkedIn sdílení
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              OG Description
            </label>
            <textarea
              value={formData.og_description}
              onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
              rows={3}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Fallback to Meta Description if empty"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Popis pro sociální sítě
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              OG Image
            </label>
            <small style={{ color: '#9ca3af', fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
              Doporučená velikost: 1200x630px pro optimální sdílení na sociálních sítích
            </small>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                  id="og-image-upload"
                />
                <label
                  htmlFor="og-image-upload"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: uploadingImage ? '#6b7280' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  {uploadingImage ? 'Nahrávám...' : '📁 Nahrát obrázek'}
                </label>
              </div>

              {/* Auto-generate OG image button for profile pages */}
              {pagePath.includes('/profily/') && (
                <button
                  type="button"
                  onClick={() => {
                    // Use the auto-generated opengraph-image endpoint
                    const autoGenUrl = `https://www.lovelygirls.cz${pagePath}/opengraph-image`;
                    setFormData({ ...formData, og_image: autoGenUrl });
                    setSuccess('Automaticky generovaný OG image nastaven!');
                    setTimeout(() => setSuccess(''), 3000);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    borderRadius: '8px',
                    color: '#d4af37',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.3)';
                    e.currentTarget.style.borderColor = '#d4af37';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                  }}
                >
                  ✨ Použít auto-generovaný OG image
                </button>
              )}

              {formData.og_image && (
                <input
                  type="url"
                  value={formData.og_image}
                  onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#9ca3af',
                    fontSize: '13px'
                  }}
                  placeholder="URL obrázku"
                />
              )}
            </div>

            {formData.og_image && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem', fontWeight: '600' }}>Preview:</div>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px'
                }}>
                  <img
                    src={formData.og_image}
                    alt="OG Image Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      height: 'auto',
                      borderRadius: '8px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 2rem;">❌ Nepodařilo se načíst obrázek</div>';
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                ALT Text (Popisek obrázku)
              </label>
              <input
                type="text"
                value={formData.og_image_alt}
                onChange={(e) => setFormData({ ...formData, og_image_alt: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px'
                }}
                placeholder="Stručný popis obrázku pro přístupnost a SEO"
              />
              <small style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
                Doporučeno: 125 znaků. Popisuje obsah obrázku pro nevidomé uživatele a vyhledávače.
              </small>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              Canonical URL
            </label>
            <input
              type="url"
              value={formData.canonical_url}
              onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="https://www.lovelygirls.cz/cs"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Preferovaná URL stránky
            </small>
          </div>

          {/* Page Content Section - mainly for hashtag/service pages */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '1.5rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Obsah stránky (H1, H2, SEO text)
            {isHashtagPage && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#d4af37', marginLeft: '0.75rem' }}>✓ Hashtag/Služba stránka</span>}
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              H1 Nadpis
            </label>
            <input
              type="text"
              value={formData.h1_title}
              onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="Hlavní nadpis stránky (H1)"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Hlavní nadpis viditelný na stránce
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              H2 Podnadpis
            </label>
            <input
              type="text"
              value={formData.h2_subtitle}
              onChange={(e) => setFormData({ ...formData, h2_subtitle: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff' }}
              placeholder="Podnadpis stránky (H2)"
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Sekundární nadpis pod H1
            </small>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
              SEO Text / Obsah
            </label>
            <textarea
              value={formData.page_content}
              onChange={(e) => setFormData({ ...formData, page_content: e.target.value })}
              rows={8}
              style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="SEO text zobrazený na stránce pod seznamem..."
            />
            <small style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              Text zobrazený na stránce pro SEO účely. Může obsahovat HTML.
            </small>
          </div>

          {/* Auto-generate section - only for hashtag and sluzby pages */}
          {(pagePath.includes('/hashtag/') || pagePath.includes('/sluzby/')) && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px' }}>
              <h4 style={{ color: '#d4af37', marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                ✨ Automatické generování
              </h4>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Automaticky vyplní pole na základě cesty stránky.
              </p>
              <button
                type="button"
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    // Extract page name from path
                    const pathParts = pagePath.split('/').filter(Boolean);
                    const hashtagId = pathParts[pathParts.length - 1] || '';

                    // Smart content mapping for hashtags and services
                    const hashtagContent: Record<string, { title: string; h1: string; h2: string; desc: string; keywords: string; content: string }> = {
                      // Hair colors
                      'zrzky-praha': {
                        title: 'Zrzavé Escort Dívky Praha',
                        h1: 'Zrzavé krásky v Praze',
                        h2: 'Ohnivé zrzky pro nezapomenutelné chvíle',
                        desc: 'Hledáte zrzavé escort dívky v Praze? Nabízíme výběr krásných zrzek s ohnivým temperamentem. Diskrétní setkání v centru Prahy.',
                        keywords: 'zrzky praha, zrzavé escort, redhead escort prague',
                        content: '<p>Zrzavé vlasy jsou vzácností, která okouzluje svou jedinečností. Naše zrzavé escort dívky v Praze vynikají nejen svým neobvyklým vzhledem, ale také temperamentem, který je s touto barvou vlasů tradičně spojován.</p><p>Každá z našich zrzek prošla pečlivým výběrem a nabízí nejen krásný vzhled, ale také inteligentní konverzaci a příjemnou společnost. Ať už hledáte doprovod na večeři, společenskou událost nebo intimní setkání, naše zrzavé krásky vám poskytnou nezapomenutelný zážitek.</p>'
                      },
                      'blondynky-praha': {
                        title: 'Blondýnky Escort Praha',
                        h1: 'Blondýnky v Praze',
                        h2: 'Okouzlující blondýnky pro váš večer',
                        desc: 'Překrásné blondýnky v Praze. Elegantní společnice se zlatými vlasy nabízí nezapomenutelné zážitky. Rezervujte diskrétní setkání.',
                        keywords: 'blondýnky praha, blonde escort, escort blondýny',
                        content: '<p>Blondýnky patří mezi nejžádanější escort společnice v Praze. Jejich zlatavé vlasy a zářivý vzhled přitahují pozornost a dodávají každé události nádech luxusu a elegance.</p><p>V naší nabídce najdete blondýnky různých typů - od platinových blond přes medové odstíny až po přirozené světlovlásky. Všechny spojuje profesionální přístup, diskrétnost a schopnost vytvořit příjemnou atmosféru pro jakoukoliv příležitost.</p>'
                      },
                      'brunetky-praha': {
                        title: 'Brunetky Escort Praha',
                        h1: 'Brunetky v Praze',
                        h2: 'Smyslné brunetky pro náročné pány',
                        desc: 'Sofistikované brunetky v Praze. Tmavovlasé krásky s elegancí a šarmem. Prémiové escort služby v diskrétním prostředí.',
                        keywords: 'brunetky praha, brunette escort, escort brunetky',
                        content: '<p>Brunetky symbolizují eleganci, sofistikovanost a tajemnou přitažlivost. Naše tmavovlasé escort společnice v Praze reprezentují to nejlepší, co můžete v této kategorii najít.</p><p>Ať už preferujete kaštanové, čokoládové nebo tmavě hnědé odstíny, naše brunetky vás okouzlí svým šarmem a inteligencí. Jsou ideální společnicí pro obchodní večeře, kulturní akce i soukromá setkání.</p>'
                      },
                      'cernovlasky-praha': {
                        title: 'Černovlásky Escort Praha',
                        h1: 'Černovlásky v Praze',
                        h2: 'Tajemné černovlásky s exotickým půvabem',
                        desc: 'Okouzlující černovlásky v Praze. Dívky s havraními vlasy a mystickým šarmem. Luxusní escort služby.',
                        keywords: 'černovlásky praha, black hair escort, escort černé vlasy',
                        content: '<p>Černé vlasy dodávají ženám tajemný a exotický půvab. Naše černovlasé escort dívky v Praze jsou ztělesněním elegance a smyslnosti, která vás okouzlí od prvního okamžiku.</p><p>Havraní černé vlasy krásně kontrastují s různými typy pleti a vytvářejí nezapomenutelný dojem. Naše černovlásky jsou sofistikované, inteligentní a připravené poskytnout vám prvotřídní společnost.</p>'
                      },
                      // Body features
                      'velka-prsa': {
                        title: 'Dívky s Velkými Prsy Praha',
                        h1: 'Dívky s velkým poprsím',
                        h2: 'Bujné krásky pro milovníky křivek',
                        desc: 'Escort dívky s velkými prsy v Praze. Krásné ženy s bujným poprsím nabízí nezapomenutelné chvíle. Diskrétní služby.',
                        keywords: 'velká prsa escort, busty escort prague, velké poprsí',
                        content: '<p>Bujné poprsí je jedním z nejžádanějších atributů u escort společnic. Naše dívky s velkými prsy v Praze vás okouzlí svými přirozenými i vylepšenými křivkami, které doplňuje profesionální přístup a příjemné vystupování.</p><p>Každá z našich bujných krásek nabízí jedinečný zážitek a dokáže vytvořit atmosféru, ve které se budete cítit výjimečně. Ať už preferujete intimní setkání nebo společenský doprovod, naše dívky s velkým poprsím jsou připraveny splnit vaše očekávání.</p>'
                      },
                      'prirodni-poprsi': {
                        title: 'Dívky s Přirozeným Poprsím Praha',
                        h1: 'Přirozená krása',
                        h2: 'Dívky s přirozeným poprsím',
                        desc: 'Escort dívky s přirozeným poprsím v Praze. Autentická krása bez úprav. Elegantní společnice pro náročné pány.',
                        keywords: 'přirozené poprsí, natural breasts escort, escort přirozená prsa',
                        content: '<p>Přirozená krása má své nezaměnitelné kouzlo. Naše escort dívky s přirozeným poprsím v Praze reprezentují autentickou ženskost bez umělých vylepšení, což oceňují mnozí gentlemani.</p><p>Přirozené poprsí má svou jedinečnou texturu a pohyb, který nelze napodobit. Naše dívky s přírodními křivkami nabízí upřímný a autentický zážitek, kde každý dotek je skutečný a přirozený.</p>'
                      },
                      'dlouhe-nohy': {
                        title: 'Modelky s Dlouhými Nohami Praha',
                        h1: 'Dlouhonohé krásky',
                        h2: 'Modelky s nekonečně dlouhými nohami',
                        desc: 'Vysoké dívky s dlouhými nohami v Praze. Modelky a escort společnice s dokonalou postavou.',
                        keywords: 'dlouhé nohy escort, long legs prague, vysoké modelky',
                        content: '<p>Dlouhé nohy jsou symbolem elegance a ženské přitažlivosti. Naše vysoké escort společnice v Praze disponují proporcemi modelek a vystupováním, které zaujme na první pohled.</p><p>Ať už hledáte společnici na večeři v luxusní restauraci nebo doprovod na společenskou akci, naše dlouhonohé krásky vnesou do každé situace nádech glamouru a sofistikovanosti.</p>'
                      },
                      'fit-holky': {
                        title: 'Fit Dívky Escort Praha',
                        h1: 'Sportovní dívky',
                        h2: 'Fit a atletické krásky',
                        desc: 'Sportovní a fit escort dívky v Praze. Atletické postavy, zdravý životní styl. Energické společnice pro aktivní pány.',
                        keywords: 'fit escort, sportovní dívky praha, athletic escort',
                        content: '<p>Sportovní a fit dívky přinášejí do escort služeb energii a vitalitu. Naše atletické společnice v Praze pečují o své tělo pravidelným cvičením, což se odráží v jejich pevných postavách a pozitivní energii.</p><p>Tyto dívky jsou ideální společnicí pro aktivní gentlemany, kteří oceňují zdravý životní styl. Jejich kondice a energie vám zaručí dynamický a nezapomenutelný zážitek.</p>'
                      },
                      'stihla-postava': {
                        title: 'Štíhlé Dívky Escort Praha',
                        h1: 'Štíhlé krásky',
                        h2: 'Elegantní dívky se štíhlou postavou',
                        desc: 'Štíhlé escort dívky v Praze. Gracilní krásky s dokonalými proporcemi nabízí luxusní společnost.',
                        keywords: 'štíhlé escort, slim escort prague, štíhlá postava',
                        content: '<p>Štíhlá postava je symbolem elegance a gracility. Naše štíhlé escort dívky v Praze vynikají svými jemnými křivkami a noblesním vystupováním, které okouzlí každého gentlemana.</p><p>Tyto gracilní krásky se skvěle hodí do jakéhokoliv prostředí - od intimních večeří po velké společenské události. Jejich štíhlé postavy vyniknou v elegantních šatech a vytvoří nezapomenutelný dojem.</p>'
                      },
                      // Age
                      'mlade-holky': {
                        title: 'Mladé Escort Dívky Praha',
                        h1: 'Mladé dívky v Praze',
                        h2: 'Svěží mladé krásky plné energie',
                        desc: 'Mladé escort dívky v Praze (18+). Energické a hravé společnice pro nezapomenutelné zážitky. Ověřené profily.',
                        keywords: 'mladé escort, young escort prague, mladé dívky',
                        content: '<p>Mladé escort dívky v Praze (všechny starší 18 let) přinášejí do setkání svěžest, energii a hravost. Tyto mladé společnice jsou plné života a nadšení, což se odráží v jejich pozitivním přístupu.</p><p>Každá z našich mladých dívek prošla důkladným ověřením věku a identity. Nabízí bezstarostnou společnost plnou smíchu a nových zážitků pro gentlemany, kteří oceňují mladistvou energii.</p>'
                      },
                      'zrale-zeny': {
                        title: 'Zralé Ženy Escort Praha',
                        h1: 'Zralé ženy v Praze',
                        h2: 'Zkušené dámy s elegancí',
                        desc: 'Zralé a zkušené escort ženy v Praze. Sofistikované dámy s životními zkušenostmi pro náročné gentlemany.',
                        keywords: 'zralé ženy escort, mature escort prague, zkušené dámy',
                        content: '<p>Zralé ženy nabízejí to, co mladší dívky nemohou - životní moudrost, sebejistotu a hluboké porozumění mužským potřebám. Naše zkušené escort dámy v Praze jsou sofistikované, inteligentní a diskrétní.</p><p>Tyto ženy vědí, co chtějí a jak to poskytnout. Jejich zkušenosti z života se promítají do schopnosti vytvořit relaxující a příjemnou atmosféru, kde se budete cítit jako skutečný gentleman.</p>'
                      },
                      'milf-praha': {
                        title: 'MILF Escort Praha',
                        h1: 'MILF v Praze',
                        h2: 'Atraktivní zralé ženy',
                        desc: 'MILF escort dívky v Praze. Přitažlivé zralé ženy s bohatými zkušenostmi. Diskrétní setkání v luxusním prostředí.',
                        keywords: 'milf escort praha, milf prague, zralé ženy escort',
                        content: '<p>MILF kategorie zahrnuje atraktivní zralé ženy, které kombinují zkušenosti s nevybledlou přitažlivostí. Tyto dámy v Praze jsou důkazem, že krása nezná věkové hranice.</p><p>Naše MILF společnice nabízejí sebevědomí a jistotu, kterou získaly životními zkušenostmi. Vědí, jak potěšit muže a vytvořit intimní atmosféru plnou vzájemného respektu a potěšení.</p>'
                      },
                      // Origin
                      'ceske-holky': {
                        title: 'České Escort Dívky Praha',
                        h1: 'České dívky',
                        h2: 'Autentické české krásky',
                        desc: 'České escort dívky v Praze. Místní krásky s přirozeným šarmem a znalostí města. Komunikace bez bariér.',
                        keywords: 'české escort, czech escort girls, české dívky praha',
                        content: '<p>České escort dívky nabízejí jedinečnou kombinaci slovanské krásy a znalosti místního prostředí. Komunikace v rodném jazyce bez bariér činí setkání přirozenější a příjemnější.</p><p>Naše české společnice znají Prahu jako své boty a mohou vám ukázat ta nejlepší místa ve městě. Jejich přirozený šarm a české kořeny zaručují autentický zážitek pro domácí i zahraniční klienty.</p>'
                      },
                      'ukrajinske-holky': {
                        title: 'Ukrajinské Dívky Escort Praha',
                        h1: 'Ukrajinské krásky',
                        h2: 'Půvabné dívky z Ukrajiny',
                        desc: 'Ukrajinské escort dívky v Praze. Slovanská krása a pohostinnost. Ověřené profily, diskrétní služby.',
                        keywords: 'ukrajinské escort, ukrainian escort prague, slovanské dívky',
                        content: '<p>Ukrajinské ženy jsou proslulé svou přirozenou krásou a pohostinností. Naše ukrajinské escort dívky v Praze přinášejí slovanský půvab kombinovaný s vřelým a přátelským přístupem.</p><p>Tyto dívky často hovoří česky, rusky i anglicky, což usnadňuje komunikaci. Jejich kulturní pozadí jim dodává jedinečný šarm a schopnost vytvořit příjemnou atmosféru pro jakoukoliv příležitost.</p>'
                      },
                      'asiatky': {
                        title: 'Asijské Escort Dívky Praha',
                        h1: 'Asijské krásky',
                        h2: 'Exotické dívky z Asie',
                        desc: 'Asijské escort dívky v Praze. Exotická krása z Dálného východu. Jemné a pozorné společnice.',
                        keywords: 'asijské escort, asian escort prague, exotické dívky',
                        content: '<p>Asijské escort dívky v Praze nabízejí exotickou krásu a jedinečné kulturní pozadí. Jejich jemnost, pozornost k detailům a uctivý přístup jsou charakteristické rysy, které oceňují mnozí gentlemani.</p><p>Naše asijské společnice pocházejí z různých zemí Dálného východu a každá přináší svůj vlastní unikátní šarm. Jejich exotický vzhled a příjemné vystupování vytvoří nezapomenutelný zážitek.</p>'
                      },
                      'latinky': {
                        title: 'Latinky Escort Praha',
                        h1: 'Latinskoamerické krásky',
                        h2: 'Temperamentní latinky',
                        desc: 'Latinské escort dívky v Praze. Vášnivé a temperamentní krásky z Jižní Ameriky.',
                        keywords: 'latinky escort, latina escort prague, latino dívky',
                        content: '<p>Latinky přinášejí do Prahy vášeň a temperament Jižní Ameriky. Tyto horké krásky jsou známé svou energií, smyslem pro tanec a schopností užívat si každý okamžik naplno.</p><p>Naše latinskoamerické escort společnice vnesou do vašeho setkání exotický nádech a nezapomenutelnou atmosféru. Jejich přirozená vášeň a životní radost jsou nakažlivé.</p>'
                      },
                      // Style
                      'tetovani': {
                        title: 'Tetované Dívky Escort Praha',
                        h1: 'Tetované krásky',
                        h2: 'Dívky s tetováním',
                        desc: 'Tetované escort dívky v Praze. Umělecké tetování jako výraz individuality. Alternativní krása pro odvážné pány.',
                        keywords: 'tetované escort, tattoo escort prague, dívky s tetováním',
                        content: '<p>Tetování je výrazem individuality a odvahy. Naše tetované escort dívky v Praze nosí na svých tělech umělecká díla, která vypráví jejich příběhy a přitahují pozornost.</p><p>Každé tetování je jedinečné, stejně jako každá z našich tetovaných společnic. Pro gentlemany, kteří oceňují alternativní krásu a nebojí se vybočit z řady, jsou tyto dívky ideální volbou.</p>'
                      },
                      'vip-holky': {
                        title: 'VIP Escort Dívky Praha',
                        h1: 'VIP společnice',
                        h2: 'Exkluzivní VIP dívky pro náročné',
                        desc: 'VIP escort dívky v Praze. Nejvyšší třída escort služeb pro náročné klienty. Luxus a diskrétnost zaručeny.',
                        keywords: 'vip escort praha, exclusive escort, luxury escort prague',
                        content: '<p>VIP escort služby představují vrchol luxusu a exkluzivity. Naše VIP společnice v Praze jsou pečlivě vybrané dívky, které splňují nejvyšší standardy krásy, inteligence a společenského vystupování.</p><p>Pro náročné gentlemany nabízíme absolutní diskrétnost, flexibilitu a služby na míru. VIP dívky jsou připraveny doprovázet vás na jakoukoliv událost nebo poskytnout intimní chvíle v luxusním prostředí.</p>'
                      },
                      'girlfriend-experience': {
                        title: 'Girlfriend Experience Praha',
                        h1: 'Girlfriend Experience',
                        h2: 'Autentický zážitek jako s přítelkyní',
                        desc: 'GFE escort v Praze. Girlfriend experience pro ty, kdo hledají intimní a přirozený zážitek. Romantika a blízkost.',
                        keywords: 'girlfriend experience, gfe escort praha, romantický escort',
                        content: '<p>Girlfriend Experience (GFE) nabízí autentický zážitek podobný vztahu s opravdovou přítelkyní. Naše GFE společnice v Praze se specializují na vytvoření intimní, romantické atmosféry plné vzájemné náklonnosti.</p><p>Na rozdíl od běžných escort služeb, GFE klade důraz na emocionální propojení, něžnost a přirozené chování. Zažijete polibky, objetí a blízkost, jako byste byli se skutečnou partnerkou.</p>'
                      },
                      'gfe-praha': {
                        title: 'GFE Escort Praha',
                        h1: 'GFE služby v Praze',
                        h2: 'Girlfriend Experience pro gentlemany',
                        desc: 'GFE escort služby v Praze. Zažijte intimitu a blízkost jako s opravdovou přítelkyní. Prémiové služby.',
                        keywords: 'gfe praha, girlfriend experience escort, intimní escort',
                        content: '<p>GFE (Girlfriend Experience) služby v Praze jsou určeny pro gentlemany, kteří hledají více než jen fyzický kontakt. Naše GFE společnice nabízejí kompletní partnerský zážitek včetně romantiky a emocionální intimity.</p><p>S našimi GFE dívkami zažijete setkání plné něhy, konverzace a vzájemného porozumění. Je to ideální volba pro ty, kdo postrádají partnerskou blízkost nebo chtějí uniknout ze stresu každodenního života.</p>'
                      },
                      // General
                      'sexy-holky': {
                        title: 'Sexy Escort Dívky Praha',
                        h1: 'Sexy dívky v Praze',
                        h2: 'Nejatraktivnější dívky města',
                        desc: 'Sexy escort dívky v Praze. Nejkrásnější a nejatraktivnější společnice pro váš večer. Ověřené profily.',
                        keywords: 'sexy escort praha, hot escort, atraktivní dívky',
                        content: '<p>Naše sexy escort dívky v Praze představují to nejlepší, co město nabízí. Každá z nich byla vybrána pro svou přitažlivost, šarm a schopnost okouzlit na první pohled.</p><p>Ať už hledáte společnici na večer nebo intimní setkání, naše sexy dívky vám zaručí nezapomenutelný zážitek. Jejich sebevědomí a smyslnost jsou nakažlivé a zaručí, že se budete cítit výjimečně.</p>'
                      },
                      'elegantni-holky': {
                        title: 'Elegantní Escort Dívky Praha',
                        h1: 'Elegantní společnice',
                        h2: 'Sofistikované dámy pro společenské události',
                        desc: 'Elegantní escort dívky v Praze. Perfektní společnice pro večeře, akce a reprezentaci. Styl a třída.',
                        keywords: 'elegantní escort, sophisticated escort prague, dámy pro společnost',
                        content: '<p>Elegantní escort společnice v Praze jsou perfektní volbou pro obchodní večeře, společenské události a reprezentativní příležitosti. Tyto sofistikované dámy vědí, jak se chovat v každé situaci.</p><p>Naše elegantní dívky disponují nejen krásou, ale také inteligencí a společenskými dovednostmi. Dokáží vést zajímavou konverzaci a vytvoří dojem, který na vás i vaše partnery zapůsobí.</p>'
                      },
                      'modelky-praha': {
                        title: 'Modelky Escort Praha',
                        h1: 'Modelky v Praze',
                        h2: 'Profesionální modelky jako společnice',
                        desc: 'Escort modelky v Praze. Profesionální modelky s dokonalými proporcemi nabízí exkluzivní společnost.',
                        keywords: 'modelky escort, model escort prague, krásné modelky',
                        content: '<p>Naše escort modelky v Praze jsou profesionální krásky s dokonalými proporcemi a zkušenostmi z modelingu. Jejich fotogenický vzhled a elegantní vystupování z nich dělá ideální společnice pro jakoukoliv příležitost.</p><p>Tyto modelky jsou zvyklé být středem pozornosti a vědí, jak se prezentovat. S nimi po boku budete vzbuzovat obdiv a závist okolí, ať už na veřejné akci nebo v soukromí.</p>'
                      },
                      'studentky-praha': {
                        title: 'Studentky Escort Praha',
                        h1: 'Studentky v Praze',
                        h2: 'Mladé a chytré studentky',
                        desc: 'Studentky jako escort společnice v Praze. Inteligentní mladé dívky financující studium. Svěží a zajímavé.',
                        keywords: 'studentky escort, student escort prague, mladé studentky',
                        content: '<p>Studentky nabízejí jedinečnou kombinaci mladistvé energie a inteligence. Tyto mladé ženy studují na pražských univerzitách a escort služby jim pomáhají financovat studium a životní styl.</p><p>S našimi studentkami zažijete svěží a zajímavé setkání. Jejich vzdělání a zájem o různá témata zaručují, že konverzace bude stejně příjemná jako fyzická stránka setkání.</p>'
                      },
                    };

                    // Get content for this hashtag or use generic
                    const content = hashtagContent[hashtagId];

                    let generated;
                    if (content) {
                      generated = {
                        meta_title: `${content.title} | LovelyGirls`,
                        meta_description: content.desc,
                        og_title: `${content.title} | LovelyGirls`,
                        og_description: content.desc,
                        h1_title: content.h1,
                        h2_subtitle: content.h2,
                        focus_keyword: hashtagId.replace(/-/g, ' '),
                        meta_keywords: content.keywords,
                        page_content: content.content || '',
                      };
                    } else {
                      // Fallback for unknown hashtags
                      const readableName = hashtagId
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                      generated = {
                        meta_title: `${readableName} Escort Praha | LovelyGirls`,
                        meta_description: `${readableName} escort dívky v Praze. Prémiové služby, diskrétní setkání. LovelyGirls.`,
                        og_title: `${readableName} | LovelyGirls`,
                        og_description: `${readableName} escort dívky v Praze.`,
                        h1_title: readableName,
                        h2_subtitle: `${readableName} v Praze`,
                        focus_keyword: hashtagId.replace(/-/g, ' '),
                        meta_keywords: `${hashtagId.replace(/-/g, ' ')}, escort praha`,
                        page_content: `<p>${readableName} escort dívky v Praze. Naše společnice vám nabídnou nezapomenutelný zážitek.</p>`,
                      };
                    }

                    // Only fill empty fields
                    setFormData(prev => ({
                      ...prev,
                      meta_title: prev.meta_title || generated.meta_title,
                      meta_description: prev.meta_description || generated.meta_description,
                      og_title: prev.og_title || generated.og_title,
                      og_description: prev.og_description || generated.og_description,
                      h1_title: prev.h1_title || generated.h1_title,
                      h2_subtitle: prev.h2_subtitle || generated.h2_subtitle,
                      focus_keyword: prev.focus_keyword || generated.focus_keyword,
                      meta_keywords: prev.meta_keywords || generated.meta_keywords,
                      page_content: prev.page_content || generated.page_content,
                    }));

                    setSuccess('✨ Prázdná pole byla automaticky vyplněna!');
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err) {
                    setError('Chyba při generování');
                  } finally {
                    setGenerating(false);
                  }
                }}
                style={{
                  padding: '12px 24px',
                  background: generating ? '#6b7280' : 'linear-gradient(135deg, #d4af37 0%, #b8963e 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#1f1f23',
                  fontWeight: '600',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                {generating ? 'Generuji...' : '✨ Automaticky vyplnit prázdná pole'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Link
              href={`/${locale}/admin/seo`}
              style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', textDecoration: 'none', fontWeight: '500' }}
            >
              Zrušit
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 20px', borderRadius: '8px', background: saving ? '#6b7280' : '#d4af37', color: '#1f1f23', border: 'none', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Ukládám...' : 'Uložit SEO'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function EditSEOPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
        Načítání...
      </div>
    }>
      <EditSEOForm />
    </Suspense>
  );
}
