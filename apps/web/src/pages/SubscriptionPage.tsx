import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price_kobo: number;
  features: string[];
}

interface MySubscription {
  status: string;
  ends_at: string;
  subscription_plans?: Plan | null;
}

const formatDuration = (days: number) => {
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
  return `${Math.floor(days / 365)} year`;
};

const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mySub, setMySub] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.subscription.plans(),
      api.subscription.my().catch(() => ({ subscription: null })),
    ]).then(([plansRes, subRes]) => {
      setPlans(plansRes.plans);
      setMySub(subRes.subscription);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const res = await api.subscription.checkout(planId);
      window.location.href = res.authorizationUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>Loading...</p>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Subscription</h1>

      {mySub && (
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Status: <strong style={{ color: mySub.status === 'active' || mySub.status === 'trial' ? 'var(--accent)' : 'var(--danger)' }}>
              {mySub.status.charAt(0).toUpperCase() + mySub.status.slice(1)}
            </strong>
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {mySub.ends_at ? `Valid until: ${new Date(mySub.ends_at).toLocaleDateString()}` : 'No end date'}
          </p>
          {mySub.subscription_plans && (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Plan: {mySub.subscription_plans.name}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{plan.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDuration(plan.duration_days)}</p>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
                {formatPrice(plan.price_kobo)}
              </div>
            </div>
            <ul style={{ listStyle: 'none', marginBottom: '16px' }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{ padding: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  ✓ {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={checkoutLoading === plan.id}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius)',
                background: 'var(--accent)',
                color: '#000',
                fontSize: '15px',
                fontWeight: 600,
                opacity: checkoutLoading === plan.id ? 0.7 : 1,
              }}
            >
              {checkoutLoading === plan.id ? 'Redirecting...' : `Subscribe ${formatDuration(plan.duration_days)}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
