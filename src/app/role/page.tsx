'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { brand } from '@/lib/brand';
import type { RoleKey } from '@/lib/types';

const ROLES: { id: RoleKey; name: string; desc: string }[] = [
  { id: 'eng', name: 'Software Engineer / Technology', desc: 'Full-stack, platform, or technical leadership' },
  { id: 'con', name: 'Consultant / Strategy', desc: 'Strategic advisor, change lead, or client-facing delivery' },
  { id: 'fin', name: 'Finance / Risk', desc: 'Finance professional, analyst, or risk management' },
  { id: 'hr', name: 'HR / L&D / People', desc: 'People ops, learning, or organizational development' },
  { id: 'del', name: 'Delivery / Project Management', desc: 'Project manager, delivery lead, or program management' }
];

export default function RolePage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey | ''>('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('email');
    if (!stored) router.push('/login');
    else setEmail(stored);
  }, [router]);

  const handleSelect = (selectedRole: RoleKey) => {
    sessionStorage.setItem('role', selectedRole);
    router.push('/assessment');
  };

  return (
    <div style={{ minHeight: '100vh', background: brand.offWhite, padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button
          onClick={() => router.push('/otp')}
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

        <h1 style={{ color: brand.darkTeal, marginBottom: '8px', fontSize: '28px', fontWeight: '600' }}>
          Select Your Role
        </h1>
        <p style={{ color: brand.softBlack, marginBottom: '32px', fontSize: '14px' }}>
          Choose the role that best describes your primary function. Questions will be tailored to your context.
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          {ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              style={{
                padding: '20px',
                border: `1.5px solid ${brand.border}`,
                borderRadius: '8px',
                background: brand.white,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                boxShadow: '0 2px 12px rgba(0, 110, 116, 0.08)'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = brand.darkTeal;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0, 110, 116, 0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = brand.border;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0, 110, 116, 0.08)';
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: '600', color: brand.darkTeal, marginBottom: '4px' }}>
                {r.name}
              </div>
              <div style={{ fontSize: '13px', color: brand.muted }}>
                {r.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
