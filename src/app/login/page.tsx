'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { brand } from '@/lib/brand';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.ok) {
        sessionStorage.setItem('email', email);
        router.push('/otp');
      } else {
        setError(data.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Error requesting OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: brand.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', color: brand.darkTeal, marginBottom: '10px', fontSize: '32px', fontWeight: '600' }}>
          VECTOR Assessment
        </h1>
        <p style={{ textAlign: 'center', color: brand.softBlack, marginBottom: '40px', fontSize: '14px' }}>
          Discover your Human-AI collaboration capability profile
        </p>

        <form onSubmit={handleSubmit} style={{ background: brand.white, padding: '32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0, 110, 116, 0.08)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: brand.muted2, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1.5px solid ${brand.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = brand.darkTeal)}
              onBlur={(e) => (e.currentTarget.style.borderColor = brand.border)}
            />
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            style={{
              width: '100%',
              padding: '15px',
              background: email && !loading ? brand.darkTeal : '#CCCCCC',
              color: brand.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: email && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (email && !loading) {
                (e.currentTarget as HTMLButtonElement).style.background = brand.lightTeal;
              }
            }}
            onMouseLeave={(e) => {
              if (email && !loading) {
                (e.currentTarget as HTMLButtonElement).style.background = brand.darkTeal;
              }
            }}
          >
            {loading ? 'Requesting OTP...' : 'Send OTP'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: brand.muted2 }}>
          VECTOR Framework © Krishnan Nilakantan (NK)<br/>
          Free to use with credit
        </p>
      </div>
    </div>
  );
}
