import React from 'react';
import Link from 'next/link';

async function getUser(id: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  try {
    const [uRes, iRes] = await Promise.all([
      fetch(`${API_URL}/users/${id}`, { cache: 'no-store' }),
      fetch(`${API_URL}/interviews`, { cache: 'no-store' }),
    ]);
    const user = uRes.ok ? JSON.parse(await uRes.text()) : null;
    const ivData = iRes.ok ? await iRes.json() : { interviews: [] };
    const allInterviews: any[] = ivData.interviews ?? [];
    
    // Use the actual ID from the user object (if found) or decode the URL param
    const actualUserId = user?._id || decodeURIComponent(id);
    const userSessions = allInterviews.filter((iv: any) => iv.user_id === actualUserId);
    
    return { user, userSessions };
  } catch {
    return { user: null, userSessions: [] };
  }
}

function timeAgo(isoStr: string) {
  if (!isoStr) return 'Never';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, userSessions } = await getUser(id);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-4)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.75rem' }}>User not found</div>
        <Link href="/users" style={{ color: 'var(--accent-light)', fontSize: '0.875rem' }}>← Back to Talent Pool</Link>
      </div>
    );
  }

  const initial = (user.name?.[0] ?? 'U').toUpperCase();
  
  // Sort user sessions by time
  const sortedSessions = [...userSessions].sort((a: any, b: any) => {
    const timeA = new Date(a.start_time || a.created_at || 0).getTime();
    const timeB = new Date(b.start_time || b.created_at || 0).getTime();
    return timeB - timeA;
  });

  const lastSession = sortedSessions[0];
  const lastActiveTimestamp = lastSession ? (lastSession.start_time || lastSession.created_at) : null;
  const uniqueRoles = [...new Set(userSessions.map((s: any) => s.role).filter(Boolean))];

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', color: 'var(--text-4)', marginBottom: '1rem', fontWeight: 500 }}>
          <Link href="/users" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>Candidate Directory</Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-2)' }}>{user.name ?? 'Profile'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            width: '68px', height: '68px', borderRadius: '20px', 
            background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', 
            color: '#8B5CF6', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0 
          }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div className="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{user.name ?? 'Anonymous User'}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-3)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{user.email ?? 'No email associated'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-4)' }}>ID:</span>
                <code style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{user._id}</code>
              </span>
            </div>
          </div>
          <span className="badge badge-purple" style={{ padding: '0.6rem 1.25rem', fontSize: '0.75rem' }}>User Verified</span>
        </div>
      </div>

      {/* Activity KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <KPICard label="Total Sessions" value={userSessions.length} sub="Lifetime activity" />
        <KPICard label="Roles Explored" value={uniqueRoles.length} sub="Experience tracks" />
        <KPICard label="Last Active" value={timeAgo(lastActiveTimestamp)} sub="Recency status" />
        <KPICard label="App Version" value={`v${user.app_version ?? '1.0.0'}`} sub="Client build" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>

        {/* Session History */}
        <div className="card" style={{ borderRadius: '20px', padding: '0.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Assessment Activity Log</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>Chronological history of all candidate sessions</div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-light)' }}>{userSessions.length} Total</div>
            </div>
          </div>
          {userSessions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Track / Role</th>
                  <th>Date & Time</th>
                  <th>Score</th>
                  <th style={{ paddingRight: '1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map((iv: any, i: number) => {
                  const ts = iv.start_time || iv.created_at;
                  const date = ts
                    ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const overallScore = iv.scores?.overall || '0%';
                  return (
                    <tr key={iv._id} style={{ height: '64px' }}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '100px', fontWeight: 600, border: '1px solid',
                          background: iv.role?.startsWith('MCQ:') ? 'rgba(59, 130, 246, 0.15)' : 'var(--accent-subtle)', 
                          color: iv.role?.startsWith('MCQ:') ? '#60A5FA' : 'var(--accent-light)', 
                          borderColor: iv.role?.startsWith('MCQ:') ? 'rgba(59, 130, 246, 0.3)' : 'transparent' 
                        }}>
                          {iv.role ?? 'General'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-2)', whiteSpace: 'nowrap', fontWeight: 500 }}>{date}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.875rem' }}>{overallScore}</span>
                        </div>
                      </td>
                      <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                        <Link href={`/interviews/${iv._id}`}
                          style={{ fontSize: '0.75rem', padding: '0.45rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-strong)', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
                          Report →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-4)' }}>No assessment data found for this profile.</div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>
          <div className="card" style={{ padding: '0', borderRadius: '20px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-1)' }}>Profile Details</div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'Full Name', value: user.name },
                { label: 'Primary Email', value: user.email },
                { label: 'User Record ID', value: user._id, mono: true },
                { label: 'Linked Device', value: user.device_name || user.device_id, mono: true },
                { label: 'First Synced', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{r.label}</div>
                  <div style={{ fontSize: '0.81rem', color: 'var(--text-2)', fontFamily: r.mono ? 'monospace' : undefined, wordBreak: 'break-all', fontWeight: 500 }}>{r.value ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/users" 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontSize: '0.875rem', color: 'var(--text-3)', textDecoration: 'none', 
              padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)',
              transition: 'all 0.2s', fontWeight: 600
            }} className="btn-hover-bright">
            <span>←</span> Back to Directory
          </Link>
        </div>
      </div>
    </>
  );
}

function KPICard({ label, value, sub }: { label: string; value: any; sub: string }) {
  return (
    <div className="stat-card" style={{ padding: '1.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', opacity: 0.8, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}
