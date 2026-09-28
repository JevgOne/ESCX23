'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ClientResult {
  id: number;
  clientNumber: string;
  nickname: string;
  trustLevel: string;
  totalVisits: number;
  noShowCount: number;
  isBanned: boolean;
  lastVisitDate: string | null;
  channels: string[];
}

const TRUST_BADGES: Record<string, { label: string; cls: string }> = {
  vip: { label: 'VIP', cls: 'cl-badge-vip' },
  regular: { label: 'Staly', cls: 'cl-badge-regular' },
  verified: { label: 'Overeny', cls: 'cl-badge-verified' },
  new: { label: 'Novy', cls: 'cl-badge-new' },
};

export default function ClientSearchAutocomplete({
  defaultValue,
  filter,
  sort,
}: {
  defaultValue: string;
  filter: string;
  sort: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<ClientResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, filter });
      if (sort) params.set('sort', sort);
      const res = await fetch(`/api/booking/clients/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.clients ?? []);
        setTotal(data.total ?? 0);
        setIsOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  const handleInput = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchResults(value), 300);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const navigateToClient = (id: number) => {
    window.location.href = `/booking/clients/${id}`;
  };

  // Form submit = full-page search (fallback)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter && filter !== 'all') params.set('filter', filter);
    if (sort) params.set('sort', sort);
    window.location.href = `/booking/clients?${params}`;
  };

  return (
    <div ref={containerRef} className="cl-search-wrap">
      <form onSubmit={handleSubmit} className="cl-search-form">
        <input type="hidden" name="filter" value={filter} />
        {sort && <input type="hidden" name="sort" value={sort} />}
        <input
          className="cl-search-input"
          type="text"
          name="q"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Jmeno, kod, telefon nebo @telegram"
          autoComplete="off"
        />
        {loading && <span className="cl-search-spinner" />}
        <button type="submit" className="cl-search-btn">Hledat</button>
      </form>

      {isOpen && results.length > 0 && (
        <div className="cl-autocomplete-dropdown">
          {results.map((client) => {
            const badge = TRUST_BADGES[client.trustLevel] ?? TRUST_BADGES.new;
            return (
              <button
                key={client.id}
                type="button"
                className="cl-ac-row"
                onClick={() => navigateToClient(client.id)}
              >
                <div className={`cl-ac-avatar${client.isBanned ? ' banned' : ''}`}>
                  {client.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="cl-ac-info">
                  <span className="cl-ac-name">{client.nickname}</span>
                  <span className="cl-ac-code">{client.clientNumber}</span>
                </div>
                <span className="cl-ac-visits">{client.totalVisits}x</span>
                {client.isBanned ? (
                  <span className="cl-badge cl-badge-banned">Ban</span>
                ) : (
                  <span className={`cl-badge ${badge.cls}`}>{badge.label}</span>
                )}
              </button>
            );
          })}
          {total > 10 && (
            <button
              type="button"
              className="cl-ac-more"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
            >
              Zobrazit vsech {total} vysledku
            </button>
          )}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && !loading && (
        <div className="cl-autocomplete-dropdown">
          <div className="cl-ac-empty">Zadny klient nenalezen</div>
        </div>
      )}
    </div>
  );
}
