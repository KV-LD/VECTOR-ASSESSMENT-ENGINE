'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { brand } from '@/lib/brand';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('email');
    if (!stored) {
      router.push('/login');
    } else {
      setEmail(stored);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (data.ok) {
        router.push('/role');
      } else {
        setError(data.message || 'Invalid OTP');
        setOtp('');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: brand.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <button
          onClick={() => router.push('/login')}
          style={{
            background: 'none',
            border: 'none',
            color: brand.darkTeal,
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px',
            padding: '0'
          }}
        >
          ← Back
        </button>

        <h1 style={{ color: brand.darkTeal, marginBottom: '10px', fontSize: '28px', fontWeight: '600' }}>
          Verify OTP
        </h1>
        <p style={{ color: brand.softBlack, marginBottom: '32px', fontSize: '14px' }}>
          Enter the 6-digit code sent to {email}
        </p>

        <form onSubmit={handleSubmit} style={{ background: brand.white, padding: '32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0, 110, 116, 0.08)' }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '24px',
                letterSpacing: '8px',
                textAlign: 'center',
                border: `1.5px solid ${brand.border}`,
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
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
            disabled={loading || otp.length !== 6}
            style={{
              width: '100%',
              padding: '15px',
              background: otp.length === 6 && !loading ? brand.darkTeal : '#CCCCCC',
              color: brand.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
