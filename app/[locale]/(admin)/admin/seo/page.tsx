"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import type { SEOMetadata } from '@/lib/seo-types';
import { calculateSEOScore } from '@/lib/seo-utils';

interface PageWithSEO {
  path: string;
  type: string;
  name: string;
  locale: string;
  seo?: SEOMetadata;
  seoScore: number;
}

export default function AdminSEOPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'cs';
  const [pages, setPages] = useState<PageWithSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [localeFilter, setLocaleFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSEOData();
  }, []);

  const fetchSEOData = async () => {
    try {
      setLoading(true);

      // Fetch all pages (including dynamic ones from database)
      const pagesResponse = await fetch('/api/pages');
      const pagesData = await pagesResponse.json();

      // Fetch SEO metadata
      const seoResponse = await fetch('/api/seo');
      const seoData = await seoResponse.json();

      if (pagesData.success && seoData.success) {
        const allPages = pagesData.pages;
        const seoMap = new Map<string, SEOMetadata>(
          seoData.metadata.map((seo: SEOMetadata) => [seo.page_path, seo])
        );

        const pagesWithSEO: PageWithSEO[] = allPages.map((page: any) => {
          const seo = seoMap.get(page.path) as SEOMetadata | undefined;
          const seoScore = seo ? calculateSEOScore(seo) : 0;

          // Extract locale from path (e.g., /cs/divky -> cs)
          const locale = page.path.split('/')[1] || 'cs';

          return {
            path: page.path,
            type: page.type,
            name: page.name,
            locale,
            seo,
            seoScore
          };
        });

        setPages(pagesWithSEO);
      }
    } catch (err) {
      console.error('Error fetching SEO data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanWebsite = async () => {
    try {
      setScanning(true);

      // Fetch all pages (including dynamic ones from database)
      const pagesResponse = await fetch('/api/pages');
      const pagesData = await pagesResponse.json();

      if (!pagesData.success) {
        throw new Error('Failed to fetch pages');
      }

      const allPages = pagesData.pages;

      // Get current SEO data
      const seoResponse = await fetch('/api/seo');
      const seoData = await seoResponse.json();

      if (seoData.success) {
        const existingPaths = new Set(
          seoData.metadata.map((seo: SEOMetadata) => seo.page_path)
        );

        // Create records for pages without SEO metadata
        const createPromises = allPages
          .filter((page: any) => !existingPaths.has(page.path))
          .map((page: any) => {
            const locale = page.path.split('/')[1] || 'cs';
            return fetch('/api/seo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                page_path: page.path,
                page_type: page.type,
                locale,
                meta_title: '',
                meta_description: '',
                focus_keyword: '',
                seo_score: 0
              })
            });
          });

        await Promise.all(createPromises);
        await fetchSEOData();
        alert(`Scan dokončen! Nalezeno ${createPromises.length} nových stránek.\nCelkem stránek: ${allPages.length}`);
      }
    } catch (err) {
      console.error('Error scanning website:', err);
      alert('Chyba při skenování webu');
    } finally {
      setScanning(false);
    }
  };

  const getSEOScoreBadge = (score: number) => {
    let color = '#ef4444'; // red
    let bg = 'rgba(239, 68, 68, 0.2)';
    let label = 'Špatné';

    if (score >= 80) {
      color = '#22c55e'; // green
      bg = 'rgba(34, 197, 94, 0.2)';
      label = 'Výborné';
    } else if (score >= 50) {
      color = '#f59e0b'; // orange
      bg = 'rgba(245, 158, 11, 0.2)';
      label = 'Střední';
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: bg,
            border: `3px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '1.1rem',
            color
          }}
        >
          {score}
        </div>
        <span style={{ fontSize: '0.85rem', color }}>{label}</span>
      </div>
    );
  };

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      cs: '🇨🇿',
      en: '🇬🇧',
      de: '🇩🇪',
      uk: '🇺🇦'
    };
    return flags[locale] || '🌐';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      static: 'Statická stránka',
      hashtag: 'Hashtag stránka',
      blog: 'Blog'
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      static: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
      hashtag: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' },
      blog: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }
    };

    const style = colors[type] || { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: '500',
          background: style.bg,
          color: style.color
        }}
      >
        {getTypeLabel(type)}
      </span>
    );
  };

  const filteredPages = pages.filter(page => {
    // Locale filter
    if (localeFilter !== 'all' && page.locale !== localeFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all' && page.type !== typeFilter) {
      return false;
    }

    // Score filter
    if (scoreFilter === 'poor' && page.seoScore >= 50) {
      return false;
    }
    if (scoreFilter === 'needs-work' && (page.seoScore < 50 || page.seoScore >= 80)) {
      return false;
    }
    if (scoreFilter === 'good' && page.seoScore < 80) {
      return false;
    }

    // Search filter
    if (searchTerm && !page.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !page.path.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const totalPages = pages.length;
  const avgScore = pages.length > 0
    ? Math.round(pages.reduce((sum, p) => sum + p.seoScore, 0) / pages.length)
    : 0;
  const poorPages = pages.filter(p => p.seoScore < 50).length;
  const goodPages = pages.filter(p => p.seoScore >= 80).length;

  return (
    <>
      
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <p className="admin-subtitle">
              Spravujte SEO metadata pro všechny stránky webu (inspirováno Yoast SEO)
            </p>
          </div>
          <button
            onClick={handleScanWebsite}
            disabled={scanning}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: scanning ? 'not-allowed' : 'pointer',
              border: 'none',
              background: scanning
                ? 'rgba(212, 175, 55, 0.5)'
                : 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
              color: '#1f1f23',
              fontSize: '0.9rem',
              boxShadow: scanning ? 'none' : '0 4px 12px rgba(212, 175, 55, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: scanning ? 0.6 : 1
            }}
            onMouseOver={(e) => {
              if (!scanning) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!scanning) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
              }
            }}
          >
            {scanning ? '⏳ Skenuji...' : '🔍 Skenovat web'}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalPages}</div>
            <div className="stat-label">Celkem stránek</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#22c55e' }}>{avgScore}</div>
            <div className="stat-label">Průměrné SEO skóre</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ef4444' }}>{poorPages}</div>
            <div className="stat-label">Potřebují úpravu</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#22c55e' }}>{goodPages}</div>
            <div className="stat-label">Optimalizované</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Hledat podle názvu nebo cesty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Jazyk:</label>
            <select value={localeFilter} onChange={(e) => setLocaleFilter(e.target.value)}>
              <option value="all">Všechny</option>
              <option value="cs">🇨🇿 Čeština</option>
              <option value="en">🇬🇧 English</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="uk">🇺🇦 Українська</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Typ stránky:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Všechny</option>
              <option value="static">Statická</option>
              <option value="hashtag">Hashtag</option>
              <option value="blog">Blog</option>
            </select>
          </div>

          <div className="filter-group">
            <label>SEO skóre:</label>
            <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)}>
              <option value="all">Všechny</option>
              <option value="poor">🔴 Špatné (&lt;50)</option>
              <option value="needs-work">🟠 Střední (50-79)</option>
              <option value="good">🟢 Výborné (≥80)</option>
            </select>
          </div>
        </div>

        {/* SEO Table */}
        {loading ? (
          <div className="loading">Načítání SEO dat...</div>
        ) : (
          <div className="seo-table">
            <table>
              <thead>
                <tr>
                  <th>SEO Skóre</th>
                  <th>Název stránky</th>
                  <th>Cesta</th>
                  <th>Jazyk</th>
                  <th>Typ</th>
                  <th>Meta Title</th>
                  <th>Focus Keyword</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.path}>
                    <td>{getSEOScoreBadge(page.seoScore)}</td>
                    <td>
                      <strong>{page.name}</strong>
                    </td>
                    <td>
                      <code className="path-code">{page.path}</code>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.5rem' }}>
                        {getLocaleFlag(page.locale)}
                      </span>
                    </td>
                    <td>{getTypeBadge(page.type)}</td>
                    <td>
                      {page.seo?.meta_title ? (
                        <div className="meta-preview">
                          {page.seo.meta_title.substring(0, 50)}
                          {page.seo.meta_title.length > 50 && '...'}
                          <div className="meta-length">
                            {page.seo.meta_title.length} znaků
                          </div>
                        </div>
                      ) : (
                        <span className="not-set">[Nenastaveno]</span>
                      )}
                    </td>
                    <td>
                      {page.seo?.focus_keyword ? (
                        <span className="keyword-badge">{page.seo.focus_keyword}</span>
                      ) : (
                        <span className="not-set">[Žádné]</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/${locale}/admin/seo/edit?path=${encodeURIComponent(page.path)}`}
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#ffffff',
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                        }}
                      >
                        ✏️ Upravit SEO
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPages.length === 0 && (
              <div className="empty-state">
                <p>
                  {searchTerm || localeFilter !== 'all' || typeFilter !== 'all' || scoreFilter !== 'all'
                    ? 'Žádné stránky nenalezeny s těmito filtry'
                    : 'Zatím nejsou žádné stránky. Klikněte na "Skenovat web" pro načtení stránek.'}
                </p>
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          .admin-container {
            padding: 24px;
            max-width: 1600px;
            margin: 0 auto;
            background: #1f1f23;
            min-height: 100vh;
          }

          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }

          .admin-subtitle {
            color: #9ca3af;
            font-size: 0.875rem;
            margin-top: 4px;
          }

          .btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
          }

          .btn-primary {
            background: #d4af37;
            color: #1f1f23;
          }

          .btn-primary:hover:not(:disabled) {
            background: #c9a532;
          }

          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }

          .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .stat-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(212, 175, 55, 0.3);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            transform: translateY(-4px);
          }

          .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #d4af37;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 0.9rem;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .search-bar {
            margin-bottom: 16px;
          }

          .search-input {
            width: 100%;
            max-width: 600px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 0.95rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .search-input:focus {
            outline: none;
            border-color: #d4af37;
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
          }

          .search-input::placeholder {
            color: #9ca3af;
          }

          .filters {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .filter-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .filter-group label {
            font-size: 0.9rem;
            color: #9ca3af;
            white-space: nowrap;
          }

          .filter-group select {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
          }

          .filter-group select:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(212, 175, 55, 0.3);
          }

          .filter-group select:focus {
            outline: none;
            border-color: #d4af37;
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
          }

          .loading {
            text-align: center;
            padding: 48px;
            color: #9ca3af;
          }

          .seo-table {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          thead {
            background: rgba(255, 255, 255, 0.05);
          }

          th {
            padding: 16px;
            text-align: left;
            font-size: 0.85rem;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          tbody tr {
            transition: all 0.2s ease;
          }

          tbody tr:hover {
            background: rgba(212, 175, 55, 0.08);
          }

          td {
            padding: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: #fff;
            vertical-align: middle;
          }

          .path-code {
            background: rgba(0, 0, 0, 0.3);
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.85rem;
            color: #d4af37;
          }

          .meta-preview {
            max-width: 300px;
          }

          .meta-length {
            font-size: 0.75rem;
            color: #9ca3af;
            margin-top: 4px;
          }

          .not-set {
            color: #9ca3af;
            font-style: italic;
            font-size: 0.9rem;
          }

          .keyword-badge {
            background: rgba(212, 175, 55, 0.2);
            color: #d4af37;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
          }

          .action-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            border: none;
            text-decoration: none;
            transition: all 0.2s ease;
            display: inline-block;
          }

          .action-btn.edit {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
          }

          .action-btn.edit:hover {
            background: rgba(59, 130, 246, 0.3);
          }

          .empty-state {
            text-align: center;
            padding: 48px;
            color: #9ca3af;
          }

          @media (max-width: 1400px) {
            .seo-table {
              overflow-x: auto;
            }

            table {
              min-width: 1200px;
            }
          }

          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .filters {
              flex-direction: column;
              align-items: stretch;
            }

            .filter-group {
              flex-direction: column;
              align-items: stretch;
            }

            .filter-group select {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  );
}
