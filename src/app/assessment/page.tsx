'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { brand } from '@/lib/brand';
import { getQuestionsForRole, shuffleQuestionsForAssessment } from '@/lib/questions';
import { calculateDimensionLevels, deriveVectorClass, getDominantDimension, generateVectorSignature } from '@/lib/scoring';
import type { RoleKey, Question } from '@/lib/types';

export default function AssessmentPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleKey | ''>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    const storedRole = sessionStorage.getItem('role') as RoleKey | null;

    if (!storedEmail || !storedRole) {
      router.push('/login');
      return;
    }

    setEmail(storedEmail);
    setRole(storedRole);

    try {
      const allQuestions = getQuestionsForRole(storedRole);
      const shuffled = shuffleQuestionsForAssessment(allQuestions);
      setQuestions(shuffled);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load questions:', err);
      router.push('/role');
    }
  }, [router]);

  if (loading || questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: brand.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: brand.softBlack }}>
          <div style={{ fontSize: '18px', marginBottom: '12px' }}>Loading assessment...</div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isAnswered = answers[currentQuestion.id] !== undefined;

  const handleSelectAnswer = (score: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: score }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const scores = calculateDimensionLevels(questions, answers);
    const { class: vectorClass, floorCheckApplied } = deriveVectorClass(scores);
    const dominant = getDominantDimension(scores);
    const signature = generateVectorSignature(vectorClass, dominant);

    sessionStorage.setItem('result_class', vectorClass);
    sessionStorage.setItem('result_signature', signature);
    sessionStorage.setItem('result_scores', JSON.stringify(scores));
    sessionStorage.setItem('result_floorCheckApplied', String(floorCheckApplied));

    router.push('/report');
  };

  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  return (
    <div style={{ minHeight: '100vh', background: brand.offWhite, padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: brand.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Progress
            </span>
            <span style={{ fontSize: '12px', color: brand.muted, fontWeight: '600' }}>
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: brand.border, borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: brand.darkTeal,
                width: `${progress}%`,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div style={{ background: brand.white, padding: '40px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0, 110, 116, 0.08)', marginBottom: '32px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: brand.softBlack, lineHeight: '1.5', margin: '0' }}>
              {currentQuestion.text}
            </h2>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {currentQuestion.options.map((option, idx) => {
              const score = currentQuestion.type === 'sit' ? idx + 1 : idx + 1;
              const isSelected = answers[currentQuestion.id] === score;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(score)}
                  style={{
                    padding: '16px 20px',
                    border: `1.5px solid ${isSelected ? brand.darkTeal : brand.border}`,
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(0, 110, 116, 0.08)' : brand.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: brand.softBlack,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 12px rgba(0, 110, 116, 0.12)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = brand.lightTeal;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = brand.border;
                    }
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            style={{
              flex: 1,
              padding: '14px',
              border: `1.5px solid ${currentIndex === 0 ? '#CCCCCC' : brand.darkTeal}`,
              background: brand.white,
              color: currentIndex === 0 ? '#CCCCCC' : brand.darkTeal,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Back
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              style={{
                flex: 1,
                padding: '14px',
                background: allAnswered ? brand.darkTeal : '#CCCCCC',
                color: brand.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: allAnswered ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              View Results
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              style={{
                flex: 1,
                padding: '14px',
                background: isAnswered ? brand.darkTeal : '#CCCCCC',
                color: brand.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isAnswered ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
