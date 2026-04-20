import React from 'react';
import Link from 'next/link';

async function getInterviewWithUser(id: string) {
  try {
    const res = await fetch(`http://localhost:5000/interviews/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const iv = await res.json();
    
    // Fetch user details for the name
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

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const iv = await getInterviewWithUser(id);

  if (!iv) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-4)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.5rem' }}>Session not found</div>
        <code style={{ fontSize: '0.75rem' }}>{id}</code>
        <div style={{ marginTop: '1.5rem' }}>
          <Link href="/interviews" style={{ color: 'var(--accent-light)', fontSize: '0.875rem' }}>← Back</Link>
        </div>
      </div>
    );
  }

  const chat: any[] = iv.chat_history ?? [];
  const pairs = buildPairs(chat);
  const scores = iv.scores ?? {};
  const flags = iv.proctoring ?? iv.proctoring_flags ?? {};

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '0.625rem', fontSize: '0.81rem', color: 'var(--text-4)', marginBottom: '1.5rem', fontWeight: 500 }}>
        <Link href="/interviews" style={{ color: 'var(--text-4)', textDecoration: 'none', transition: 'color 0.2s' }}>Session Activity</Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--text-2)' }}>{iv.role || 'Session Details'}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ 
                fontSize: '0.625rem', fontWeight: 800, background: 'var(--accent-subtle)', 
                color: 'var(--accent-light)', padding: '0.25rem 0.6rem', borderRadius: '4px',
                letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>Analysis Complete</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Ref: {iv._id?.slice(-12)}</span>
            </div>
            <h1 className="page-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>{iv.role || 'Interview Session'}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Candidate: <strong style={{ color: 'var(--text-1)' }}>{iv.userName}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Total Questions: <strong style={{ color: 'var(--text-1)' }}>{pairs.length}</strong>
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: '2rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Session Date</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 600 }}>
                {(() => {
                  const raw = iv.start_time || iv.created_at || iv.createdAt;
                  const d = typeof raw === 'object' && raw.$date ? new Date(raw.$date) : new Date(raw);
                  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                })()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Overall Accuracy</div>
              <div style={{ fontSize: '1.75rem', color: 'var(--accent-light)', fontWeight: 800, letterSpacing: '-0.02em' }}>{iv.scores?.overall || '0%'}</div>
            </div>
          </div>
        </div>
      </div>      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Pulse Animation Style */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulse-red {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .pulse-dot { animation: pulse-red 2s infinite; }
        `}} />

        {/* Top Section: Video & Primary Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', 
          gap: '1.5rem',
          alignItems: 'start' 
        }}>
          {/* Video Player */}
          {iv.video_url ? (
            <div style={{ 
              position: 'relative', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.08)', 
              background: '#0a0a0c',
              boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
              aspectRatio: '16/10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video 
                src={iv.video_url} 
                controls 
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />
              <div style={{ 
                position: 'absolute', top: '1.25rem', left: '1.25rem', right: '1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                pointerEvents: 'none', zIndex: 10
              }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  background: 'rgba(0,0,0,0.6)', padding: '0.5rem 0.85rem', 
                  borderRadius: '10px', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Proctoring Live</span>
                </div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.6)', padding: '0.5rem 0.85rem', 
                  borderRadius: '10px', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700
                }}>HD SOURCE</div>
              </div>
            </div>
          ) : (
            <div style={{
              width: '100%', aspectRatio: '16/10',
              background: 'linear-gradient(135deg, #111118 0%, #09090b 100%)', 
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem',
            }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>🎞️</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.35rem' }}>No Video Feed</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', maxWidth: '200px' }}>Video report unavailable or syncing.</div>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <QuickTile label="Overall Score" value={scores.overall || 'N/A'} accent />
              <QuickTile label="Trust Score" value={(flags.no_face ?? 0) + (flags.multiple_faces ?? 0) === 0 ? '100%' : 'Manual Review'} warning={(flags.no_face ?? 0) + (flags.multiple_faces ?? 0) > 0} />
              <QuickTile label="Technical" value={scores.technical_accuracy ? `${scores.technical_accuracy}%` : 'N/A'} />
              <QuickTile label="Clarity" value={scores.structure_clarity ? `${scores.structure_clarity}%` : 'N/A'} />
              <QuickTile label="Questions" value={pairs.length} />
              <QuickTile label="Skipped" value={pairs.filter(p => p.skipped).length} />
            </div>
            
            {/* Proctoring Indicators Row */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Security & Integrity Flags</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <ProctorMetric label="No Face" value={flags.no_face ?? 0} />
                <ProctorMetric label="Multi Face" value={flags.multiple_faces ?? 0} />
                <ProctorMetric label="Rotation" value={flags.head_rotation ?? 0} />
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <details className="card transcript-collapse" style={{ borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <summary style={{ padding: '1.25rem 2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none' }} className="transcript-summary">
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-1)' }}>Interview Transcript</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Full conversation log analysis ({pairs.length} exchanges)</div>
            </div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-3)' }} className="chevron">⌄</div>
          </summary>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {pairs.length > 0 ? (
              <div style={{ padding: '0.5rem 0' }}>
                {pairs.map((p, idx) => (
                  <div key={idx} style={{ padding: '1.25rem 1.75rem', borderBottom: idx < pairs.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }} className="transcript-row">
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-light)', flexShrink: 0, marginTop: '2px' }}>Q</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', lineHeight: 1.5, fontWeight: 600, marginTop: '5px' }}>{p.q}</div>
                    </div>
                    {p.a && (
                      <div style={{ display: 'flex', gap: '0.85rem', paddingLeft: '0.25rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-3)', flexShrink: 0, marginTop: '2px' }}>A</div>
                        <div style={{ fontSize: '0.85rem', color: p.skipped ? 'var(--amber)' : 'var(--text-2)', lineHeight: 1.6, fontStyle: p.skipped ? 'italic' : 'normal', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', width: '100%' }}>{p.skipped ? 'Candidate skipped this question.' : p.a}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-4)' }}>No transcript recorded.</div>
            )}
          </div>
        </details>

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
          <Link href="/interviews" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-3)', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '12px', border: '1px solid var(--border)' }} className="btn-hover-bright">
            <span>←</span> Back to Activity Feed
          </Link>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .transcript-collapse[open] .chevron { transform: rotate(180deg); transition: transform 0.2s; }
          .transcript-summary::-webkit-details-marker { display: none; }
        `}} />
      </div>
    </div>
  );
}

function QuickTile({ label, value, accent, warning, subtitle }: { label: string; value: any; accent?: boolean, warning?: boolean, subtitle?: string }) {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: warning ? '#EF4444' : accent ? 'var(--accent-light)' : 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', lineHeight: 1.4, marginTop: '0.1rem' }}>{subtitle}</div>}
    </div>
  );
}

function ProctorMetric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: value > 0 ? '#EF4444' : '#10B981' }}>{value}</div>
    </div>
  );
}
