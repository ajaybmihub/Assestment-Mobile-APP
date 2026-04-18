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

    // Create a name mapping
    const userNameMap: Record<string, string> = {};
    allUsers.forEach(u => {
      userNameMap[u._id] = u.name || 'Anonymous';
    });

    // Compute per-user session counts
    const sessionsByUser: Record<string, number> = {};
    for (const iv of allInterviews) {
      sessionsByUser[iv.user_id] = (sessionsByUser[iv.user_id] ?? 0) + 1;
    }

    // Active users: completed at least 1 session
    const activeCount = Object.keys(sessionsByUser).length;

    // Unique devices
    const uniqueDevices = new Set(allUsers.map((u: any) => u.device_id)).size;

    // Recent Activity Feed — last 6 sessions sorted by time
    const recentActivity = [...allInterviews]
      .sort((a, b) => (b.start_time ?? '').localeCompare(a.start_time ?? ''))
      .slice(0, 6);

    return {
      totalUsers: users.meta?.total ?? allUsers.length,
      totalSessions: interviews.total ?? allInterviews.length,
      activeUsers: activeCount,
      uniqueDevices,
      allUsers,
      recentActivity,
      sessionsByUser,
      userNameMap,
    };
  } catch {
    return { totalUsers: 0, totalSessions: 0, activeUsers: 0, uniqueDevices: 0, allUsers: [], recentActivity: [], sessionsByUser: {}, userNameMap: {} };
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
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function Dashboard() {
  const { totalUsers, totalSessions, activeUsers, uniqueDevices, allUsers, recentActivity, sessionsByUser, userNameMap } = await getData();

  const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">App Analytics</div>
            <div className="page-subtitle">Track user activity, engagement, and device usage across your app</div>
          </div>
          <span className="badge badge-live">
            <span className="badge-dot" />
            Live Sync Active
          </span>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">👤</div>
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-meta">Registered on the app</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-green">✦</div>
          <div>
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{activeUsers}</div>
            <div className="stat-meta">Used the app at least once</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">▶</div>
          <div>
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">{totalSessions}</div>
            <div className="stat-meta">App interactions recorded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-amber">⊡</div>
          <div>
            <div className="stat-label">Unique Devices</div>
            <div className="stat-value">{uniqueDevices}</div>
            <div className="stat-meta">
              <span className="positive" style={{ color: 'var(--green)' }}>{engagementRate}%</span> engagement rate
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">User Activity</div>
              <div className="card-subtitle">Detailed tracking of user sessions and device telemetry</div>
            </div>
            <Link href="/users" className="btn btn-ghost" style={{ textDecoration: 'none' }}>View all →</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Device Name</th>
                <th>Sessions</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length > 0 ? allUsers.map((user: any, idx: number) => {
                const sessions = sessionsByUser[user._id] ?? 0;
                const isEngaged = sessions > 0;
                return (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ background: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                          {(user.name?.[0] ?? 'U').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.875rem' }}>{user.name || 'Anonymous'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>{user._id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', fontWeight: 500 }}>{user.device_name || user.device_id || 'Unknown Device'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>{user.device_id?.slice(0, 12)}...</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, sessions * 20)}%`, background: 'linear-gradient(90deg, #7C3AED, #EC4899)', borderRadius: '100px' }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sessions}</span>
                      </div>
                    </td>
                    <td>
                       <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{timeAgo(user.last_active_at)}</div>
                       <div style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>
                         {user.last_active_at ? new Date(user.last_active_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                       </div>
                    </td>
                    <td>
                      {isEngaged
                        ? <span className="badge badge-live"><span className="badge-dot" />Active</span>
                        : <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontWeight: 600 }}>Inactive</span>
                      }
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-4)' }}>No users synced yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity Feed</div>
            <div className="card-subtitle">Real-time session updates and user interactions</div>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {recentActivity.length > 0 ? recentActivity.map((iv: any, i: number) => (
              <div key={iv._id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1.5rem',
                borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(124,58,237,0.12)', color: '#8B5CF6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>▶</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)' }}>
                    <strong style={{ color: 'var(--text-1)' }}>{userNameMap[iv.user_id] || iv.user_id}</strong>
                    {' '}completed{' '}
                    <strong style={{ color: 'var(--text-1)' }}>{iv.role || 'Session'}</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>
                    On {iv.device_name || iv.device_id || 'Unknown Device'}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {timeAgo(iv.start_time)}
                </div>
              </div>
            )) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
