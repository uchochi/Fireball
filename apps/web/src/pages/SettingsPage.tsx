import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [brandName, setBrandName] = useState('');
  const [vibePref, setVibePref] = useState('english');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Sign in to manage settings.</p>
        <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Brand Name (used as watermark on your content)
          </label>
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Your brand name"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '15px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Default Vibe
          </label>
          <select
            value={vibePref}
            onChange={(e) => setVibePref(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '15px',
            }}
          >
            <option value="english">English</option>
            <option value="pidgin">Pidgin</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Account
          </label>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {user.email}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '14px',
            borderRadius: 'var(--radius)',
            background: 'var(--accent)',
            color: '#000',
            fontSize: '15px',
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        <button
          onClick={handleSignOut}
          style={{
            padding: '14px',
            borderRadius: 'var(--radius)',
            background: 'transparent',
            color: 'var(--danger)',
            fontSize: '15px',
            border: '1px solid var(--danger)',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
