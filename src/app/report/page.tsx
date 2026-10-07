'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { brand } from '@/lib/brand';
import { getClassInfo, getLevelName } from '@/lib/scoring';
import { calculateNextMove } from '@/lib/nextMove';
import type { VectorClass, DimKey } from '@/lib/types';

const DIM_NAMES: Record<DimKey, string> = {
  V: 'Vision Clarity',
  E: 'Edge Judgment',
  C: 'Context Fluency',
  T: 'Trust Architecture',
  O: 'Orchestration Intelligence',
  R: 'Range'
};

const DIM_ORDER: DimKey[] = ['V', 'E', 'C', 'T', 'O', 'R'];

export default function ReportPage() {
  const router = useRouter();
  const [vectorClass, setVectorClass] = useState<VectorClass | ''>('');
  const [signature, setSignature] = useState('');
  const [scores, setScores] = useState<Record<DimKey, any>>({} as any);
  const [floorCheckApplied, setFloorCheckApplied] = useState(false);
  const [nextMove, setNextMove] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cls = sessionStorage.getItem('result_class') as VectorClass | null;
    const sig = sessionStorage.getItem('result_signature');
    const scoresJson = sessionStorage.getItem('result_scores');
    const floorCheck = sessionStorage.getItem('result_floorCheckApplied') === 'true';

    if (!cls || !sig || !scoresJson) {
      router.push('/login');
      return;
    }

    setVectorClass(cls);
    setSignature(sig);
    setFloorCheckApplied(floorCheck);

    const parsedScores = JSON.parse(scoresJson);
    setScores(parsedScores);

    const move = calculateNextMove(parsedScores);
    setNextMove(move);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: brand.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: brand.softBlack }}>Loading results...</div>
      </div>
    );
  }

  const classInfo = getClassInfo(vectorClass as VectorClass);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', background: brand.offWhite, padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <button
            onClick={() => router.push('/role')}
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
            ← Retake Assessment
          </button>

          <h1 style={{ fontSize: '36px', fontWeight: '700', color: brand.darkTeal, margin: '0 0 12px 0' }}>
            {vectorClass}
          </h1>
          <p style={{ fontSize: '24px', fontWeight: '600', color: brand.lightTeal, margin: '0 0 8px 0' }}>
            {classInfo.name}
          </p>
          <p style={{ fontSize: '16px', color: brand.softBlack, margin: '0', fontStyle: 'italic' }}>
            "{classInfo.desc}"
          </p>
          <div style={{ marginTop: '20px', fontSize: '14px', color: brand.muted, fontWeight: '600', letterSpacing: '1px' }}>
            Signature: <strong>{signature}</strong>
          </div>
        </div>

        {/* Floor check warning */}
        {floorCheckApplied && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#FEF3C7', borderRadius: '8px', border: `1px solid #FBBF24`, color: '#92400E', fontSize: '13px', lineHeight: '1.5' }}>
            <strong>Note:</strong> Floor check applied — your class was adjusted down due to significant variation across dimensions.
          </div>
        )}

        {/* Dimension levels */}
        <div style={{ background: brand.white, padding: '32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0, 110, 116, 0.08)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: brand.darkTeal, marginBottom: '24px', margin: '0 0 24px 0' }}>
            Capability Scores
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {DIM_ORDER.map(dim => {
              const score = scores[dim];
              if (!score) return null;

              const level = score.level;
              const levelName = getLevelName(level);

              return (
                <div key={dim}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: brand.softBlack }}>
                      {dim} — {DIM_NAMES[dim]}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: brand.darkTeal }}>
                      {level}/5 ({levelName})
                    </span>
                  </div>

                  {/* Level bars */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '8px',
                          background: i <= level ? brand.darkTeal : brand.border,
                          borderRadius: '2px',
                          transition: 'background 0.2s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next move recommendation */}
        {nextMove && (
          <div style={{ background: 'linear-gradient(135deg, rgba(0, 110, 116, 0.05) 0%, rgba(0, 151, 172, 0.05) 100%)', padding: '28px', borderRadius: '12px', border: `1px solid ${brand.border}`, marginBottom: '32px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: brand.darkTeal, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Your Next Move
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: brand.softBlack, margin: '0' }}>
              {nextMove.instruction}
            </p>
            <div style={{ marginTop: '16px', fontSize: '13px', color: brand.muted }}>
              <strong>Technique:</strong> {nextMove.technique}
            </div>
          </div>
        )}

        {/* Print button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '14px 32px',
              background: brand.darkTeal,
              color: brand.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = brand.lightTeal;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = brand.darkTeal;
            }}
          >
            🖨️ Print Results
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: brand.muted, borderTop: `1px solid ${brand.border}`, paddingTop: '24px' }}>
          <p style={{ margin: '0' }}>
            VECTOR Framework © Krishnan Nilakantan (NK)<br/>
            Human-AI Collaboration Capability Assessment
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          button { display: none; }
        }
      `}</style>
    </div>
  );
}
