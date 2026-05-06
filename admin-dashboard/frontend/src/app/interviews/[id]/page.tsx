import React from 'react';
import Link from 'next/link';
import { Search, Video, VideoOff, ShieldCheck, MessageCircle, User, ArrowLeft, ChevronDown, Info } from 'lucide-react';

async function getInterviewWithUser(id: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  try {
    const res = await fetch(`${API_URL}/interviews/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const iv = await res.json();
    const uRes = await fetch(`${API_URL}/users/${iv.user_id}`, { cache: 'no-store' });
    const user = uRes.ok ? await uRes.json() : null;
    
    // Parse detailed feedback if it exists
    let parsedDetailedFeedback = [];
    if (iv.detailed_feedback) {
      try {
        parsedDetailedFeedback = typeof iv.detailed_feedback === 'string' 
          ? JSON.parse(iv.detailed_feedback) 
          : iv.detailed_feedback;
      } catch (e) {
        console.error('Failed to parse detailed_feedback', e);
      }
    }

    return { ...iv, userName: user?.name || 'Anonymous', parsedDetailedFeedback };
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
      <style dangerouslySetInnerHTML={{ __html: `
        .pulse-dot { animation: pulse-red 2s infinite; }
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .report-section-title {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .metric-label { font-size: 0.85rem; color: var(--text-2); font-weight: 500; }
        .metric-value { font-size: 0.9rem; font-weight: 700; color: var(--text-1); }
        .metric-bar-bg { height: 6px; background: rgba(255,255,255,0.05); borderRadius: 100px; overflow: hidden; margin-top: 4px; }
        .metric-bar-fill { height: 100%; border-radius: 100px; transition: width 1s ease-out; }
      `}} />

      {/* Header Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-4)', marginBottom: '1.5rem', fontWeight: 500, alignItems: 'center' }}>
        <Link href="/interviews" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>Assessments</Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: 'var(--text-2)' }}>Report</span>
      </div>

      {/* Top Banner: Score & Recommendation */}
      <div className="card" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '1.5rem', background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(139, 92, 246, 0.03) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Overall Score</div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: scoreColor(overallNum), lineHeight: 1, letterSpacing: '-0.05em' }}>{scores.overall || '0%'}</div>
            </div>
            <div style={{ height: '40px', width: '1px', background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Recommendation</div>
              <div style={{ 
                padding: '0.5rem 1.25rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, 
                background: iv.recommendation?.toLowerCase().includes('not') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                color: iv.recommendation?.toLowerCase().includes('not') ? '#EF4444' : '#22C55E',
                border: `1px solid ${iv.recommendation?.toLowerCase().includes('not') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                display: 'inline-block'
              }}>
                {iv.recommendation || 'Not Evaluated'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '0.5rem', fontWeight: 500 }}>Generated: {dateStr}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Questions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>{pairs.length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }} className="iv-detail-grid">
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Executive Summary */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
            <div className="report-section-title"><Info size={14} /> Executive Summary</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 400 }}>
              {isMcq && mcqData ? (
                <div>
                  <p>The candidate completed an automated MCQ assessment for <strong>{mcqData.domain}</strong> regarding <strong>{mcqData.topic}</strong>.</p>
                  <p style={{ marginTop: '0.5rem' }}>Final Accuracy: <strong>{scores.overall}</strong> with {mcqData.timeTakenSeconds ? `a completion time of ${Math.floor(mcqData.timeTakenSeconds / 60)}m ${mcqData.timeTakenSeconds % 60}s` : 'standard completion time'}.</p>
                </div>
              ) : (
                iv.feedback || iv.summary || "This session represents a standard AI video assessment. The candidate's responses have been analyzed for technical depth and communication clarity. Refer to the Performance Breakdown for specific metric insights."
              )}
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
            <div className="report-section-title"><ShieldCheck size={14} /> Performance Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <MetricProgress label="Technical Accuracy" value={scores.technical_accuracy} />
                <MetricProgress label="Answer Relevance" value={scores.answer_relevance} />
                <MetricProgress label="Keyword Coverage" value={scores.keyword_coverage} />
              </div>
              <div>
                <MetricProgress label="Structure & Clarity" value={scores.structure_clarity} />
                <MetricProgress label="Depth & Completeness" value={scores.depth_completeness} />
              </div>
            </div>
          </div>

          {/* Transcript / Transcript Section */}
          <div className="card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
            <div className="report-section-title"><MessageCircle size={14} /> Interview Transcript</div>
            {pairs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {pairs.map((p, idx) => (
                  <div key={idx} style={{ paddingBottom: '2rem', borderBottom: idx < pairs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                        Q{idx + 1}
                      </div>
                      <div style={{ fontSize: '1rem', color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.5 }}>{p.q}</div>
                    </div>
                    <div style={{ paddingLeft: '3rem' }}>
                      <div style={{ padding: '1.25rem', borderRadius: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                         <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <User size={12} /> Candidate Response
                         </div>
                         <div style={{ fontSize: '0.9rem', color: p.skipped ? '#F59E0B' : 'var(--text-2)', lineHeight: 1.6, fontStyle: p.skipped ? 'italic' : 'normal' }}>
                           {p.skipped ? '⚠️ Question was skipped by the candidate.' : p.a || 'No response recorded.'}
                         </div>
                      </div>
                      
                      {/* Per-Question Feedback */}
                      {iv.parsedDetailedFeedback && iv.parsedDetailedFeedback[idx] && (
                        <div style={{ padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Question Feedback</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {(() => {
                              const feedback = iv.parsedDetailedFeedback[idx];
                              // Split by common separators but keep the text even if no labels exist
                              const parts = feedback.split(/(\bStrength:|\bGap:|\bAction:)/g).filter(Boolean);
                              
                              if (parts.length <= 1) {
                                // No labels found, show as general feedback
                                return (
                                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    <span style={{ fontWeight: 800, color: 'var(--text-3)', marginRight: '6px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Analysis:</span>
                                    <span style={{ color: 'var(--text-2)' }}>{feedback}</span>
                                  </div>
                                );
                              }

                              const rendered = [];
                              for (let i = 0; i < parts.length; i += 2) {
                                const labelRaw = parts[i];
                                const content = parts[i + 1] || '';
                                if (!content.trim()) continue;

                                let label = 'Info';
                                let color = 'var(--text-3)';
                                
                                if (labelRaw.includes('Strength')) { label = 'Strength'; color = '#22C55E'; }
                                else if (labelRaw.includes('Gap')) { label = 'Gap'; color = '#F59E0B'; }
                                else if (labelRaw.includes('Action')) { label = 'Action'; color = 'var(--accent)'; }

                                rendered.push(
                                  <div key={i} style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    <span style={{ fontWeight: 800, color, marginRight: '6px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}:</span>
                                    <span style={{ color: 'var(--text-2)' }}>{content.trim().replace(/^\s*[:.-]\s*/, '')}</span>
                                  </div>
                                );
                              }
                              return rendered;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>No transcript data available.</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>
          
          {/* Video Section */}
          <div className="card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
             <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
               <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Video size={16} /> Assessment Video
               </div>
             </div>
             {iv.video_url ? (
               <div style={{ background: '#000', aspectRatio: '16/10' }}>
                 <video src={iv.video_url} controls style={{ width: '100%', height: '100%' }} />
               </div>
             ) : (
               <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-elevated)' }}>
                 <VideoOff size={32} style={{ color: 'var(--text-4)', marginBottom: '0.75rem' }} />
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Video not available or still syncing</div>
               </div>
             )}
          </div>

          {/* Identity & Integrity Check */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
            <div className="report-section-title"><ShieldCheck size={14} /> Identity & Integrity Check</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <IntegrityRow label="Presence Check" count={flags.no_face} />
              <IntegrityRow label="Multi-Face Detection" count={flags.multiple_faces || flags.multi_face} />
              <IntegrityRow label="Focus Rotation Check" count={flags.head_rotation} />
            </div>
          </div>

          {/* Candidate Info Quick Card */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                {iv.userName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)' }}>{iv.userName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Candidate Profile</div>
              </div>
            </div>
            <Link href={`/users/${iv.user_id}`} style={{ display: 'block', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 600 }}>
              View Full Talent Profile
            </Link>
          </div>

          <Link href="/interviews" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text-3)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Directory
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricProgress({ label, value }: { label: string; value: any }) {
  const num = typeof value === 'number' ? value : parseInt(value?.toString() || '0') || 0;
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-1)', fontWeight: 700 }}>{num}%</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '100px', overflow: 'hidden' }}>
        <div style={{ width: `${num}%`, height: '100%', background: scoreColor(num), borderRadius: '100px' }} />
      </div>
    </div>
  );
}

function IntegrityRow({ label, count }: { label: string; count: any }) {
  const hasIssue = (parseInt(count?.toString() || '0') || 0) > 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: hasIssue ? '#EF4444' : '#22C55E' }}>
          {hasIssue ? `Flagged (${count})` : 'Verified'}
        </span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasIssue ? '#EF4444' : '#22C55E' }} className={hasIssue ? 'pulse-dot' : ''} />
      </div>
    </div>
  );
}
