import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useTelegram } from '../hooks/useTelegram';

export function LoginPage() {
  const navigate = useNavigate();
  const { initData, isMiniApp, webApp, requestPhone, loaded } = useTelegram();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    if (!isMiniApp || !initData) {
      setLoading(false);
      return;
    }

    api.auth.telegram(initData)
      .then(async (res) => {
        if (res.access_token && res.refresh_token) {
          await supabase.auth.setSession({
            access_token: res.access_token,
            refresh_token: res.refresh_token,
          });
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [initData, isMiniApp, navigate]);

  const handleRequestPhone = async () => {
    if (!webApp) return;
    const { success, initData: newInitData } = await requestPhone();
    if (success && newInitData) {
      setLoading(true);
      try {
        const res = await api.auth.telegram(newInitData);
        if (res.access_token && res.refresh_token) {
          await supabase.auth.setSession({
            access_token: res.access_token,
            refresh_token: res.refresh_token,
          });
          navigate('/', { replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isMiniApp) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Welcome to DEDE</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Open this app from your Telegram bot to log in.
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Search for the DEDE bot on Telegram and open the Mini App.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Welcome to DEDE</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Logging in via Telegram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Welcome to DEDE</h1>
        <p style={{ color: 'var(--danger)', marginBottom: '24px' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '14px 24px',
            borderRadius: 'var(--radius)',
            background: 'var(--accent)',
            color: '#000',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Welcome to DEDE</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Share your phone number to get started
      </p>
      <button
        onClick={handleRequestPhone}
        style={{
          padding: '14px 24px',
          borderRadius: 'var(--radius)',
          background: 'var(--accent)',
          color: '#000',
          fontSize: '16px',
          fontWeight: 600,
        }}
      >
        Share Phone Number
      </button>
    </div>
  );
}
