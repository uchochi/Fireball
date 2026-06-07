export function AnalyticsPage() {
  // Placeholder — full implementation in Phase 7
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Insights</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Track how your status posts are performing across platforms.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Posted', value: '—' },
          { label: 'This Week', value: '—' },
          { label: 'WhatsApp', value: '—' },
          { label: 'Telegram', value: '—' },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>{card.value}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '40px',
          borderRadius: 'var(--radius)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}
      >
        Analytics will populate once you start posting content.
      </div>
    </div>
  );
}
