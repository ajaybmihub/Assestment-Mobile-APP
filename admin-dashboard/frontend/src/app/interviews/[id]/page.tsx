import React from 'react';
import Link from 'next/link';

async function getInterviewWithUser(id: string) {
  try {
    const res = await fetch(`http://localhost:5000/interviews/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const iv = await res.json();
    const uRes = await fetch(`http://localhost:5000/users/${iv.user_id}`, { cache: 'no-store' });
    const user = uRes.ok ? await uRes.json() : null;
    return { ...iv, userName: user?.name || 'Anonymous' };
  } catch { return null; }
}

const INTERVIEWER_ROLES = new Set(['interviewer', 'ai', 'model', 'assistant', 'system']);

function buildPairs(chat: any[]) {
  const pairs: { q: string; a: string; skipped?: boolean }[] = [];
  let i = 0;
  while (i < chat.length) {
    const curr = chat[i];
    const isQ = INTERVIEWER_ROLES.has(curr.role);
    if (isQ) {
      const next = chat[i + 1];
      const isNextAnswer = next && !INTERVIEWER_ROLES.has(next.role);
      pairs.push({
        q: curr.content,
        a: isNextAnswer ? next.content : '',
        skipped: isNextAnswer && next.content?.toLowerCase().includes('skip'),
      });
      i += isNextAnswer ? 2 : 1;
    } else {
      if (pairs.length > 0 && !pairs[pairs.length - 1].a) {
        pairs[pairs.length - 1].a = curr.content;
      }
      i += 1;
    }
  }
  return pairs;
}

function scoreColor(n: number) {
  if (n >= 70) return '#22C55E';
  if (n >= 40) return '#F59E0B';
  return '#EF4444';
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const iv = await getInterviewWithUser(id);

  if (!iv) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-icon">🔍</div>
        <div className="empty-title">Session not found</div>
        <div className="empty-sub"><code style={{ fontSize: '0.75rem' }}>{id}</code></div>
        <Link href="/interviews" style={{ marginTop: '1rem', color: 'var(--accent-light)', fontSize: '0.875rem' }}>← Back to Assessments</Link>
      </div>
    );
  }

  const chat: any[] = iv.chat_history ?? [];
  const pairs = buildPairs(chat);
  const scores = iv.scores ?? {};
  const flags = iv.proctoring ?? iv.proctoring_flags ?? {};
  const overallNum = parseInt(scores.overall) || 0;

  const rawTs = iv.start_time || iv.created_at || iv.createdAt;
  const ts = typeof rawTs === 'object' && rawTs?.$date ? new Date(rawTs.$date) : new Date(rawTs);
  const dateStr = ts.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .pulse-dot { animation: pulse-red 2s infinite; }
        .transcript-collapse[open] .chevron { transform: rotate(180deg); }
        .transcript-summary::-webkit-details-marker { display: none; }
        @media (max-width: 768px) {
          .iv-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-4)', marginBottom: '1.25rem', fontWeight: 500, alignItems: 'center' }}>
        <Link href="/interviews" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>Assessments</Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--text-2)' }}>{iv.role || 'Session Detail'}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.625rem', fontWeight: 800, background: 'var(--accent-subtle)', color: 'var(--accent-light)', padding: '0.2rem 0.6rem', borderRadius: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Analysis Complete</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Ref: {iv._id?.slice(-12)}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{iv.role || 'Interview Session'}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-3)' }}>
              <span>Candidate: <strong style={{ color: 'var(--text-1)' }}>{iv.userName}</strong></span>
              <span>{dateStr}</span>
              <span>{pairs.length} questions</span>
            </div>
          </div>
          {/* Big score badge */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor(overallNum), letterSpacing: '-0.04em', lineHeight: 1 }}>{scores.overall || '—'}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.25rem' }}>Overall Score</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Video + Quick Metrics */}
        <div
          className="iv-detail-grid"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}
        >
          {/* Video */}
          {iv.video_url ? (
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0c', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video src={iv.video_url} controls style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', pointerEvents: 'none', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.75rem', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Proctor Recording</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/10', background: 'linear-gradient(135deg, #111118 0%, #09090b 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>🎞️</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: '0.25rem' }}>No Video Available</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Video not synced or unavailable</div>
              </div>
            </div>
          )}

          {/* Right: Quick tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <QuickTile label="Overall" value={scores.overall || 'N/A'} accent />
              <QuickTile label="Technical" value={scores.technical_accuracy ? `${scores.technical_accuracy}%` : 'N/A'} />
              <QuickTile label="Clarity" value={scores.structure_clarity ? `${scores.structure_clarity}%` : 'N/A'} />
              <QuickTile label="Relevance" value={scores.answer_relevance ? `${scores.answer_relevance}%` : 'N/A'} />
              <QuickTile label="Questions" value={pairs.length} />
              <QuickTile label="Skipped" value={pairs.filter(p => p.skipped).length} warning={pairs.filter(p => p.skipped).length > 0} />
            </div>

            {/* Proctoring flags */}
            <div style={{ padding: '1.125rem', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: '16px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.875rem' }}>Integrity Flags</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <ProctorMetric label="No Face" value={flags.no_face ?? 0} />
                <ProctorMetric label="Multi Face" value={flags.multiple_faces ?? flags.multi_face ?? 0} />
                <ProctorMetric label="Rotation" value={flags.head_rotation ?? 0} />
              </div>
            </div>

            {/* Depth + Focus (if available) */}
            {(scores.depth_completeness || scores.focus_score) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {scores.depth_completeness && <QuickTile label="Depth" value={`${scores.depth_completeness}%`} />}
                {scores.focus_score && <QuickTile label="Focus" value={`${scores.focus_score}%`} />}
              </div>
            )}
          </div>
        </div>

        {/* Skill bars — all scores visual */}
        {Object.keys(scores).length > 1 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Score Breakdown</div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'technical_accuracy', label: 'Technical Accuracy' },
                { key: 'structure_clarity', label: 'Structure & Clarity' },
                { key: 'answer_relevance', label: 'Answer Relevance' },
                { key: 'depth_completeness', label: 'Depth & Completeness' },
                { key: 'focus_score', label: 'Focus Score' },
              ].filter(s => scores[s.key]).map(({ key, label }) => {
                const val = parseInt(scores[key]) || 0;
                return (
                  <div key={key} className="skill-bar">
                    <div className="skill-bar-label">{label}</div>
                    <div className="skill-bar-track">
                      <div className="skill-bar-fill" style={{ width: `${val}%`, background: val >= 70 ? '#22C55E' : val >= 40 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                    <div className="skill-bar-val"style={{ color: val >= 70 ? '#22C55E' : val >= 40 ? '#F59E0B' : '#EF4444' }}>{val}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transcript */}
        <details className="card transcript-collapse" style={{ borderRadius: '20px' }}>
          <summary className="transcript-summary" style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)' }}>Interview Transcript</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{pairs.length} Q&A exchanges</div>
            </div>
            <div className="chevron" style={{ fontSize: '1.25rem', color: 'var(--text-3)' }}>⌄</div>
          </summary>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {pairs.length > 0 ? (
              <div style={{ padding: '0.5rem 0' }}>
                {pairs.map((p, idx) => (
                  <div key={idx} style={{ padding: '1.125rem 1.5rem', borderBottom: idx < pairs.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent-light)', flexShrink: 0 }}>Q</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.5, fontWeight: 600, marginTop: '4px' }}>{p.q}</div>
                    </div>
                    {p.a && (
                      <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.25rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-3)', flexShrink: 0, marginTop: '2px' }}>A</div>
                        <div style={{ fontSize: '0.82rem', color: p.skipped ? 'var(--amber)' : 'var(--text-2)', lineHeight: 1.6, fontStyle: p.skipped ? 'italic' : 'normal', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', flex: 1 }}>
                          {p.skipped ? '⚠️ Candidate skipped this question.' : p.a}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-title">No transcript recorded</div></div>
            )}
          </div>
        </details>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}>
          <Link href="/interviews" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-3)', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            ← Back to Assessments
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickTile({ label, value, accent, warning }: { label: string; value: any; accent?: boolean; warning?: boolean }) {
  return (
    <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: warning ? '#EF4444' : accent ? 'var(--accent-light)' : 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

function ProctorMetric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: value > 0 ? '#EF4444' : '#10B981' }}>{value}</div>
    </div>
  );
}
