import { useState } from 'react';
import { api } from '../lib/api';

export function CreatePage() {
  const [prompt, setPrompt] = useState('');
  const [vibe, setVibe] = useState<'pidgin' | 'english'>('english');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ jobId: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.content.generate({
        prompt: prompt.trim(),
        aspectRatio,
        vibe,
      });
      setResult(res);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Do you have an active subscription?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Create Content</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Describe what you want to post. The AI will generate custom content for you.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          placeholder="E.g., A funny pidgin joke about Lagos traffic, or a motivational quote about surviving in Nigeria..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '15px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Vibe</label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value as 'pidgin' | 'english')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            >
              <option value="english">English</option>
              <option value="pidgin">Pidgin</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="4:5">4:5 (Portrait)</option>
              <option value="9:16">9:16 (Story)</option>
              <option value="16:9">16:9 (Landscape)</option>
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</p>
        )}

        {result && (
          <p style={{ color: 'var(--accent)', fontSize: '14px', textAlign: 'center' }}>
            Generation started! Job ID: {result.jobId}. Check back shortly.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            padding: '14px',
            borderRadius: 'var(--radius)',
            background: 'var(--accent)',
            color: '#000',
            fontSize: '16px',
            fontWeight: 600,
            opacity: loading || !prompt.trim() ? 0.7 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Generate Content'}
        </button>
      </form>
    </div>
  );
}
