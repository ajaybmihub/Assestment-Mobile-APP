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
  const flags = iv.proctoring_flags ?? {};

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-4)', marginBottom: '1rem' }}>
        <Link href="/interviews" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>Session Activity</Link>
        <span>›</span>
        <span style={{ color: 'var(--text-2)' }}>{iv.role ?? 'Session'}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="page-title" style={{ marginBottom: '0.35rem', color: 'var(--text-1)' }}>{iv.role || 'Interview Session'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-4)' }}>
          <span>User: <strong style={{ color: 'var(--text-2)' }}>{iv.userName}</strong></span>
          <span>Session: <code style={{ color: 'var(--text-2)', fontSize: '0.76rem' }}>{iv._id}</code></span>
          {iv.device_id && <span>Device: <code style={{ color: 'var(--text-2)', fontSize: '0.76rem' }}>{iv.device_id}</code></span>}
          {iv.app_version && <span>v{iv.app_version}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 232px', gap: '1.25rem', alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              width: '200px', height: '112px', flexShrink: 0,
              background: '#0E0E12', border: '1px solid var(--border)', borderRadius: '12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', color: 'var(--text-4)',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>▶</div>
              <div style={{ fontSize: '0.65rem', textAlign: 'center', lineHeight: 1.4 }}>Recording<br />unavailable</div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <QuickTile label="Questions" value={pairs.length} />
              <QuickTile label="Messages" value={chat.length} />
              <QuickTile label="Skipped" value={pairs.filter(p => p.skipped).length} />
              {scores.overall && <QuickTile label="Overall" value={scores.overall} accent />}
              {scores.technical_accuracy && <QuickTile label="Technical" value={scores.technical_accuracy} />}
              {(flags.no_face !== undefined || flags.multi_face !== undefined) && (
                <QuickTile
                  label="Flags"
                  value={(flags.no_face ?? 0) + (flags.multi_face ?? 0) === 0 ? '✓ Clear' : `⚠ ${(flags.no_face ?? 0) + (flags.multi_face ?? 0)}`}
                />
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Session Transcript</div>
              <div className="card-subtitle">{pairs.length} questions · {chat.length} messages</div>
            </div>

            {pairs.length > 0 ? (
              <div>
                {pairs.map((p, idx) => (
                  <div key={idx} style={{
                    padding: '1.125rem 1.5rem',
                    borderBottom: idx < pairs.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--accent-light)', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: '5px', padding: '0.15rem 0.45rem', flexShrink: 0, alignSelf: 'flex-start', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Q{idx + 1}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: 1.6, fontWeight: 500 }}>{p.q}</span>
                    </div>

                    {p.a && (
                      <div style={{ display: 'flex', gap: '0.625rem', paddingLeft: '0.125rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.15rem 0.45rem', flexShrink: 0, alignSelf: 'flex-start', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>A</span>
                        <span style={{ fontSize: '0.875rem', color: p.skipped ? 'var(--amber)' : 'var(--text-2)', lineHeight: 1.65, fontStyle: p.skipped ? 'italic' : undefined }}>{p.skipped ? 'Skipped' : p.a}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-4)' }}>No transcript recorded.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="panel-card">
            <div className="card-header" style={{ padding: '0.75rem 1.125rem' }}>
              <div className="card-title" style={{ fontSize: '0.8rem' }}>Session Info</div>
            </div>
            <div style={{ padding: '0.875rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Name', value: iv.userName },
                { label: 'User ID', value: iv.user_id, mono: true },
                { label: 'Session ID', value: iv._id, mono: true },
                { label: 'Device ID', value: iv.device_id, mono: true },
                { label: 'App Build', value: iv.app_version ? `v${iv.app_version}` : null },
              ].filter(r => r.value).map(r => (
                <div key={r.label}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>{r.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-2)', fontFamily: r.mono ? 'monospace' : undefined, wordBreak: 'break-all', lineHeight: 1.4 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/interviews" style={{ fontSize: '0.78rem', color: 'var(--text-4)', textDecoration: 'none', padding: '0.25rem 0.125rem' }}>← Back</Link>
        </div>
      </div>
    </>
  );
}

function QuickTile({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: accent ? 'var(--accent-light)' : 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
