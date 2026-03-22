'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f3f4f6',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            CyclingUpgrades Inventory
          </h1>
          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            Secure access required
          </p>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #d1d5db',
                borderRadius: '16px',
                padding: '14px 16px',
                fontSize: '18px',
                color: '#111827',
                outline: 'none',
                background: '#ffffff',
              }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '16px',
              padding: '14px 16px',
              background: '#000000',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {error && (
            <div
              style={{
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: '16px',
                padding: '12px 14px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <p
          style={{
            marginTop: '24px',
            marginBottom: 0,
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          Internal tool — authorized access only
        </p>
      </div>
    </main>
  );
}