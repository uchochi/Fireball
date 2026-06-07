import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Content } from '@dede/shared';

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<'whatsapp' | 'telegram' | null>(null);

  useEffect(() => {
    if (!id) return;
    api.content.get(id)
      .then(setContent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePost = async (platform: 'whatsapp' | 'telegram') => {
    setPosting(platform);
    // TODO: Call screenshot service then post to platform
    await new Promise((r) => setTimeout(r, 1500));
    setPosting(null);
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>Loading...</p>;
  }

  if (!content) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>Content not found</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          color: 'var(--accent)',
          fontSize: '14px',
          padding: '8px 0',
          marginBottom: '16px',
        }}
      >
        ← Back
      </button>

      <div
        style={{
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          aspectRatio: '4/5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {content.screenshot_url ? (
          <img src={content.screenshot_url} alt={content.title || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ padding: '24px' }} dangerouslySetInnerHTML={{ __html: content.html_template }} />
        )}
      </div>

      {content.title && (
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{content.title}</h2>
      )}
      {content.caption && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{content.caption}</p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <span style={{ padding: '4px 12px', borderRadius: '16px', background: 'var(--bg-card)', fontSize: '12px', border: '1px solid var(--border)' }}>
          {content.nigerian_category}
        </span>
        <span style={{ padding: '4px 12px', borderRadius: '16px', background: 'var(--bg-card)', fontSize: '12px', border: '1px solid var(--border)' }}>
          {content.vibe}
        </span>
        <span style={{ padding: '4px 12px', borderRadius: '16px', background: 'var(--bg-card)', fontSize: '12px', border: '1px solid var(--border)' }}>
          {content.aspect_ratio}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => handlePost('whatsapp')}
          disabled={posting !== null}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 'var(--radius)',
            background: '#25D366',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            opacity: posting !== null ? 0.7 : 1,
          }}
        >
          {posting === 'whatsapp' ? 'Posting...' : 'Post to WhatsApp'}
        </button>
        <button
          onClick={() => handlePost('telegram')}
          disabled={posting !== null}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 'var(--radius)',
            background: '#0088cc',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            opacity: posting !== null ? 0.7 : 1,
          }}
        >
          {posting === 'telegram' ? 'Posting...' : 'Post to Telegram'}
        </button>
      </div>

      <button
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '15px',
          border: '1px solid var(--border)',
          marginTop: '8px',
        }}
      >
        Download as JPEG
      </button>
    </div>
  );
}
