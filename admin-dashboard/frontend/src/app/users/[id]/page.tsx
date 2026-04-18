import React from 'react';
import Link from 'next/link';

async function getUser(id: string) {
  try {
    const [uRes, iRes] = await Promise.all([
      fetch(`http://localhost:5000/users/${id}`, { cache: 'no-store' }),
      fetch(`http://localhost:5000/interviews`, { cache: 'no-store' }),
    ]);
    const user = uRes.ok ? JSON.parse(await uRes.text()) : null;
    const ivData = iRes.ok ? await iRes.json() : { interviews: [] };
    const allInterviews: any[] = ivData.interviews ?? [];
    const userSessions = allInterviews.filter((iv: any) => iv.user_id === id);
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
  const lastSession = userSessions.sort((a: any, b: any) => (b.start_time ?? '').localeCompare(a.start_time ?? ''))[0];
  const uniqueRoles = [...new Set(userSessions.map((s: any) => s.role).filter(Boolean))];

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-4)', marginBottom: '0.75rem' }}>
          <Link href="/users" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>Talent Pool</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-2)' }}>{user.name ?? id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(124,58,237,0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div className="page-title">{user.name ?? 'Anonymous User'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.3rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span>{user.email ?? 'No email'}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{user._id}</span>
            </div>
          </div>
          <span className="badge badge-live" style={{ flexShrink: 0 }}><span className="badge-dot" />Synced</span>
        </div>
      </div>

      {/* Activity KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{userSessions.length}</div>
          <div className="stat-meta">App interactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Roles Explored</div>
          <div className="stat-value">{uniqueRoles.length}</div>
          <div className="stat-meta">Interview categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Active</div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>{timeAgo(lastSession?.start_time)}</div>
          <div className="stat-meta">Most recent session</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">App Version</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>v{user.app_version ?? '—'}</div>
          <div className="stat-meta">Installed build</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>

        {/* Session History */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Session History</div>
              <div className="card-subtitle">{userSessions.length} sessions recorded</div>
            </div>
            {userSessions.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Role / Activity</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {userSessions
                    .sort((a: any, b: any) => (b.start_time ?? '').localeCompare(a.start_time ?? ''))
                    .map((iv: any, i: number) => {
                    const date = iv.start_time
                      ? new Date(iv.start_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—';
                    const msgCount = iv.chat_history?.length ?? 0;
                    return (
                      <tr key={iv._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-4)' }}>{iv._id?.slice(0, 22)}...</td>
                        <td>
                          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.625rem', borderRadius: '100px', background: 'rgba(124,58,237,0.1)', color: '#A78BFA', fontWeight: 500 }}>
                            {iv.role ?? 'General'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{date}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                          {msgCount > 0 ? `${msgCount} messages` : '—'}
                        </td>
                        <td>
                          <Link href={`/interviews/${iv._id}`}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500 }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>This user hasn't started any sessions yet.</div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="panel-card">
            <div className="card-header"><div className="card-title">User Profile</div></div>
            <div className="panel-body">
              {[
                { label: 'Full Name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'User ID', value: user._id, mono: true },
                { label: 'Device ID', value: user.device_id, mono: true },
                { label: 'App Version', value: user.app_version ? `v${user.app_version}` : '—' },
                { label: 'First Seen', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—' },
                { label: 'Last Synced', value: user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-IN') : '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.875rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontFamily: r.mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>{r.value ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {uniqueRoles.length > 0 && (
            <div className="panel-card">
              <div className="card-header"><div className="card-title">Roles Explored</div></div>
              <div className="panel-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {uniqueRoles.map((r: any) => (
                  <span key={r} style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '100px', background: 'rgba(124,58,237,0.12)', color: '#A78BFA', fontWeight: 500 }}>{r}</span>
                ))}
              </div>
            </div>
          )}

          <Link href="/users" style={{ fontSize: '0.82rem', color: 'var(--text-4)', textDecoration: 'none', padding: '0.5rem 0.75rem' }}>← Back to Talent Pool</Link>
        </div>
      </div>
    </>
  );
}
