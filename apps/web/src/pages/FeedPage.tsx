import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Content } from '@dede/shared';

const categoryLabels: Record<string, string> = {
  all: 'All',
  humour: 'Humour',
  jokes: 'Jokes',
  politics: 'Politics',
  hustle_motivation: 'Hustle',
  relationship: 'Relationship',
  quotes: 'Quotes',
  national_commentary: 'Commentary',
};

export function FeedPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [vibe, setVibe] = useState('all');
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '20' };
      if (category !== 'all') params.category = category;
      if (vibe !== 'all') params.vibe = vibe;
      if (!reset && cursor) params.cursor = cursor;

      const res = await api.content.feed(params as Parameters<typeof api.content.feed>[0]);
      setContents((prev) => (reset ? res.data : [...prev, ...res.data]));
      setCursor(res.nextCursor);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  }, [category, vibe, cursor]);

  useEffect(() => {
    fetchFeed(true);
  }, [category, vibe]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && cursor) {
          fetchFeed();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, cursor, fetchFeed]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setCursor(null);
  };

  const handleVibeChange = (newVibe: string) => {
    setVibe(newVibe);
    setCursor(null);
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>DEDE</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            fontSize: '14px',
          }}
        >
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'pidgin', 'english'].map((v) => (
            <button
              key={v}
              onClick={() => handleVibeChange(v)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                border: `1px solid ${vibe === v ? 'var(--accent)' : 'var(--border)'}`,
                background: vibe === v ? 'var(--accent)' : 'var(--bg-card)',
                color: vibe === v ? '#000' : 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {contents.map((content) => (
          <Link
            key={content.id}
            to={`/content/${content.id}`}
            style={{
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
              color: 'inherit',
              aspectRatio: '4/5',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {content.screenshot_url ? (
              <img
                src={content.screenshot_url}
                alt={content.title || 'Content'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
                dangerouslySetInnerHTML={{ __html: content.html_template.slice(0, 200) }}
              />
            )}
            <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>{categoryLabels[content.nigerian_category] || content.nigerian_category}</span>
              <span style={{ float: 'right' }}>{content.vibe}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Loader sentinel */}
      <div ref={loaderRef} style={{ height: '20px', margin: '16px 0' }}>
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</p>}
      </div>

      {!loading && contents.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
          No content yet. New posts are generated daily.
        </p>
      )}
    </div>
  );
}
