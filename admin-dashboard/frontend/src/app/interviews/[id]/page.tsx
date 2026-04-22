import React from 'react';
import Link from 'next/link';
import { Search, Video, VideoOff, ShieldCheck, MessageCircle, User, ArrowLeft, ChevronDown, Info } from 'lucide-react';

async function getInterviewWithUser(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const iv = await res.json();
    const uRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${iv.user_id}`, { cache: 'no-store' });
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
        <div className="empty-icon"><Search size={48} /></div>
        <div className="empty-title">Session not found</div>
        <div className="empty-sub"><code style={{ fontSize: '0.75rem' }}>{id}</code></div>
        <Link href="/interviews" style={{ marginTop: '1rem', color: 'var(--accent)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={16} /> Back to Assessments
        </Link>
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

  const isMcq = iv.role?.startsWith('MCQ:');
  let mcqData: any = null;
  if (isMcq && iv.feedback) {
    try {
      mcqData = typeof iv.feedback === 'string' ? JSON.parse(iv.feedback) : iv.feedback;
    } catch (e) {}
  }

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
              <span style={{ fontSize: '0.625rem', fontWeight: 800, background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '0.2rem 0.6rem', borderRadius: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Analysis Complete</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Ref: {iv._id?.replace('sess_', '')}</span>
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

        {isMcq ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1.25rem' }}>Test Performance</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <QuickTile label="Score" value={scores.overall || '—'} accent />
                <QuickTile label="Time Taken" value={mcqData?.timeTakenSeconds ? `${Math.floor(mcqData.timeTakenSeconds / 60)}m ${mcqData.timeTakenSeconds % 60}s` : 'N/A'} />
                <QuickTile label="Questions" value={mcqData?.questions?.length || '—'} />
                <QuickTile label="Result" value={iv.recommendation || 'Completed'} />
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1.5rem' }}>Detailed Review</div>
              {mcqData?.questions ? mcqData.questions.map((q: string, idx: number) => {
                const options = mcqData.options[idx] || [];
                const correctOpt = mcqData.correctAnswers[idx];
                const userOpt = mcqData.rawAnswers[idx];
                const isCorrect = correctOpt === userOpt;

                return (
                  <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: idx < mcqData.questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isCorrect ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.5, marginTop: '2px' }}>{q}</div>
                    </div>
                    <div style={{ display: 'grid', gap: '0.6rem', paddingLeft: '2.5rem' }}>
                      {options.map((opt: string, oIdx: number) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isUserAns = userOpt === optLetter;
                        const isActualCorrect = correctOpt === optLetter;
                        
                        let bg = 'var(--bg-elevated)';
                        let border = 'var(--border)';
                        let color = 'var(--text-2)';
                        
                        if (isActualCorrect) {
                          bg = 'rgba(16, 185, 129, 0.1)'; border = '#10B981'; color = '#10B981';
                        } else if (isUserAns && !isCorrect) {
                          bg = 'rgba(239, 68, 68, 0.1)'; border = '#EF4444'; color = '#EF4444';
                        }

                        return (
                          <div key={oIdx} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{optLetter}</div>
                            <div style={{ fontSize: '0.875rem', color }}>{opt}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }) : <div className="empty-state">No detailed data available.</div>}
            </div>
          </div>
        ) : (
          <>
            {/* Video + Quick Metrics */}
            <div
              className="iv-detail-grid"
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}
            >
          {/* Video */}
          {iv.video_url ? (
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: '#0a0a0c', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video src={iv.video_url} controls style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', pointerEvents: 'none', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.75rem', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="pulse-dot" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Proctor Recording</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/10', background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg) 100%)', border: '1px solid var(--border)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ opacity: 0.2 }}><VideoOff size={64} /></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: '0.25rem' }}>No Video Available</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>Video not synced or unavailable</div>
              </div>
            </div>
          )}

          {/* Redesigned Metrics Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <QuickTile label="Technical" value={scores.technical_accuracy ? `${scores.technical_accuracy}%` : 'N/A'} />
              <QuickTile label="Clarity" value={scores.structure_clarity ? `${scores.structure_clarity}%` : 'N/A'} />
              <QuickTile label="Relevance" value={scores.answer_relevance ? `${scores.answer_relevance}%` : 'N/A'} />
              <QuickTile label="Engagement" value={scores.focus_score ? `${scores.focus_score}%` : 'N/A'} />
            </div>

            {/* Integrity & Session Report */}
            <div className="card" style={{ padding: '1.25rem', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Integrity Report
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 600 }}>{pairs.length} Qs · {pairs.filter(p => p.skipped).length} Skips</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <ProctorMetric label="No Face" value={flags.no_face ?? 0} />
                <ProctorMetric label="Multi Face" value={flags.multiple_faces ?? flags.multi_face ?? 0} />
                <ProctorMetric label="Off-Track" value={flags.head_rotation ?? 0} />
              </div>
            </div>

            {scores.depth_completeness && (
              <QuickTile label="Depth of Answer" value={`${scores.depth_completeness}%`} subtitle="Analysis of response comprehensiveness" />
            )}
          </div>
        </div>

        {/* Skill bars — all scores visual */}

        {/* Transcript */}
        <details className="card transcript-collapse" style={{ borderRadius: '20px' }}>
          <summary className="transcript-summary" style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)' }}>Interview Transcript</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{pairs.length} Q&A exchanges</div>
            </div>
            <div className="chevron" style={{ fontSize: '1.25rem', color: 'var(--text-3)' }}><ChevronDown size={20} /></div>
          </summary>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {pairs.length > 0 ? (
              <div style={{ padding: '0.5rem 0' }}>
                {pairs.map((p, idx) => (
                  <div key={idx} style={{ padding: '1.125rem 1.5rem', borderBottom: idx < pairs.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                        <MessageCircle size={14} />
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.5, fontWeight: 600, marginTop: '4px' }}>{p.q}</div>
                    </div>
                    {p.a && (
                      <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.25rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }}>
                          <User size={12} />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: p.skipped ? 'var(--amber)' : 'var(--text-2)', lineHeight: 1.6, fontStyle: p.skipped ? 'italic' : 'normal', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', flex: 1 }}>
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
          </>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}>
          <Link href="/interviews" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-3)', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 0.2s' }} className="btn-hover-neu">
            <ArrowLeft size={16} /> Back to Assessments
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickTile({ label, value, accent, warning, subtitle }: { label: string; value: any; accent?: boolean; warning?: boolean; subtitle?: string }) {
  return (
    <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Info size={10} /> {label}
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: warning ? '#EF4444' : accent ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', marginTop: '0.1rem' }}>{subtitle}</div>}
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
