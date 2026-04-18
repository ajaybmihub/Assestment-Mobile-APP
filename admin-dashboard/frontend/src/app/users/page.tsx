import React from 'react';
import Link from 'next/link';

async function getData() {
  try {
    const [uRes, iRes] = await Promise.all([
      fetch('http://localhost:5000/users', { cache: 'no-store' }),
      fetch('http://localhost:5000/interviews', { cache: 'no-store' }),
    ]);
    const users = await uRes.json();
    const interviews = await iRes.json();

    const allUsers: any[] = users.data ?? [];
    const allInterviews: any[] = interviews.interviews ?? [];

    const sessionsByUser: Record<string, number> = {};
    const lastActiveByUser: Record<string, string> = {};
    const rolesByUser: Record<string, Set<string>> = {};

    for (const iv of allInterviews) {
      sessionsByUser[iv.user_id] = (sessionsByUser[iv.user_id] ?? 0) + 1;
      if (iv.role) {
        if (!rolesByUser[iv.user_id]) rolesByUser[iv.user_id] = new Set();
        rolesByUser[iv.user_id].add(iv.role);
      }
      const t = iv.start_time;
      if (t && (!lastActiveByUser[iv.user_id] || t > lastActiveByUser[iv.user_id])) {
        lastActiveByUser[iv.user_id] = t;
      }
    }

    return { allUsers, sessionsByUser, lastActiveByUser, rolesByUser, totalInterviews: interviews.total ?? allInterviews.length };
  } catch {
    return { allUsers: [], sessionsByUser: {}, lastActiveByUser: {}, rolesByUser: {}, totalInterviews: 0 };
  }
}

const COLORS = ['#7C3AED', '#2563EB', '#0D9488', '#B45309', '#BE185D'];

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

export default async function UsersPage() {
  const { allUsers, sessionsByUser, lastActiveByUser, rolesByUser, totalInterviews } = await getData();

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Talent Pool</div>
            <div className="page-subtitle">All registered users, their activity, and app usage history</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }}>⌕</span>
              <input type="text" placeholder="Search users..." className="search-input" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{allUsers.length}</div>
        </div>
        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-label">Total App Sessions</div>
          <div className="stat-value">{totalInterviews}</div>
        </div>
        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-label">Avg Sessions / User</div>
          <div className="stat-value">
            {allUsers.length > 0 ? (totalInterviews / allUsers.length).toFixed(1) : '0'}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Device</th>
              <th>Sessions</th>
              <th>Roles Practiced</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.length > 0 ? allUsers.map((user: any, idx: number) => {
              const sessions = sessionsByUser[user._id] ?? 0;
              const lastActive = lastActiveByUser[user._id];
              const roles = Array.from(rolesByUser[user._id] ?? []);
              return (
                <tr key={user._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ background: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                        {(user.name?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.875rem' }}>{user.name ?? 'Anonymous'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>{user._id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-3)' }}>{user.email ?? '—'}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-3)' }}>{user.device_id}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>v{user.app_version}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, sessions * 25)}%`, background: COLORS[idx % COLORS.length], borderRadius: '100px' }} />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.875rem' }}>{sessions}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {roles.length > 0
                        ? roles.map(r => (
                          <span key={r} style={{ fontSize: '0.68rem', padding: '0.15rem 0.6rem', borderRadius: '100px', background: 'rgba(124,58,237,0.12)', color: '#A78BFA', fontWeight: 500 }}>{r}</span>
                        ))
                        : <span style={{ color: 'var(--text-4)', fontSize: '0.78rem' }}>No sessions</span>
                      }
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', color: 'var(--text-3)' }}>
                    {timeAgo(lastActive)}
                  </td>
                  <td>
                    <Link href={`/users/${user._id}`}
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.875rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500, display: 'inline-block' }}>
                      View →
                    </Link>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-4)' }}>No users synced yet. Open the mobile app to start tracking.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
