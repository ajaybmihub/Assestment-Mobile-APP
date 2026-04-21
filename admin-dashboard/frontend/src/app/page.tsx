import React from 'react';
import Link from 'next/link';
import { Users, PlayCircle, Activity, Repeat, ClipboardList, User, ArrowRight } from 'lucide-react';

async function getData() {
  try {
    const [uRes, iRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews`, { cache: 'no-store' }),
    ]);
    const users = await uRes.json();
    const interviews = await iRes.json();

    const allUsers: any[] = users.data ?? [];
    const allInterviews: any[] = interviews.interviews ?? [];

    const userNameMap: Record<string, string> = {};
    allUsers.forEach(u => { userNameMap[u._id] = u.name || 'Anonymous'; });

    const sessionsByUser: Record<string, number> = {};
    for (const iv of allInterviews) {
      sessionsByUser[iv.user_id] = (sessionsByUser[iv.user_id] ?? 0) + 1;
    }

    const activeCount = Object.keys(sessionsByUser).length;
    const uniqueDevices = new Set(allUsers.map((u: any) => u.device_id)).size;

    // Multi-assessment tracking: users with > 1 sessions
    const multiSessionUsers = Object.values(sessionsByUser).filter(c => c > 1).length;

    // Average score
    const scoredSessions = allInterviews.filter((iv: any) => iv.scores?.overall);
    const avgScore = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((s: number, iv: any) => s + parseInt(iv.scores.overall) || 0, 0) / scoredSessions.length)
      : 0;

    // Pass rate (score >= 60)
    const passCount = scoredSessions.filter((iv: any) => (parseInt(iv.scores?.overall) || 0) >= 60).length;
    const passRate = scoredSessions.length > 0 ? Math.round((passCount / scoredSessions.length) * 100) : 0;

    // Role breakdown
    const roleCount: Record<string, number> = {};
    for (const iv of allInterviews) {
      const r = iv.role || 'Unknown';
      roleCount[r] = (roleCount[r] ?? 0) + 1;
    }
    const topRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]).slice(0, 4);

    // Recent activity (last 5)
    const recentActivity = [...allInterviews]
      .sort((a, b) => (b.start_time ?? '').localeCompare(a.start_time ?? ''))
      .slice(0, 5);

    return {
      totalUsers: users.meta?.total ?? allUsers.length,
      totalSessions: interviews.total ?? allInterviews.length,
      activeUsers: activeCount,
      uniqueDevices,
      multiSessionUsers,
      avgScore,
      passRate,
      topRoles,
      recentActivity,
      userNameMap,
      sessionsByUser,
    };
  } catch {
    return {
      totalUsers: 0, totalSessions: 0, activeUsers: 0, uniqueDevices: 0,
      multiSessionUsers: 0, avgScore: 0, passRate: 0, topRoles: [],
      recentActivity: [], userNameMap: {}, sessionsByUser: {},
    };
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

const COLORS = ['#7C3AED', '#2563EB', '#0D9488', '#B45309', '#BE185D'];

function scoreColor(n: number) {
  if (n >= 70) return '#22C55E';
  if (n >= 40) return '#F59E0B';
  return '#EF4444';
}

export default async function Dashboard() {
  const {
    totalUsers, totalSessions, activeUsers, uniqueDevices,
    multiSessionUsers, avgScore, passRate, topRoles,
    recentActivity, userNameMap, sessionsByUser,
  } = await getData();

  const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Dashboard Overview</div>
            <div className="page-subtitle">Assessment activity, candidate performance & user engagement</div>
          </div>
          <span className="badge badge-live">
            <span className="badge-dot" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* TOP STATS — 4-col desktop, 2-col mobile */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple"><Users size={20} /></div>
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-meta">{uniqueDevices} unique devices</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue"><PlayCircle size={20} /></div>
          <div>
            <div className="stat-label">Total Assessments</div>
            <div className="stat-value">{totalSessions}</div>
            <div className="stat-meta">{activeUsers} active candidates</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-green"><Activity size={20} /></div>
          <div>
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{activeUsers}</div>
            <div className="stat-meta"><span style={{ color: 'var(--green)' }}>{engagementRate}%</span> engagement rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-amber"><Repeat size={20} /></div>
          <div>
            <div className="stat-label">Repeat Candidates</div>
            <div className="stat-value">{multiSessionUsers}</div>
            <div className="stat-meta"><span style={{ color: 'var(--green)' }}>{engagementRate}%</span> engagement rate</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: 2 columns desktop, stacked mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ROW 1 — Recent Assessments + Role Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }} className="content-grid">

          {/* Recent Assessments */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Assessments</div>
                <div className="card-subtitle">Latest candidate sessions synced from the app</div>
              </div>
              <Link href="/interviews" className="btn btn-ghost" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                View all <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
            <div>
              {recentActivity.length > 0 ? recentActivity.map((iv: any, i: number) => {
                const name = userNameMap[iv.user_id] || 'Anonymous';
                const score = parseInt(iv.scores?.overall) || 0;
                const scoreStr = iv.scores?.overall || '—';
                const col = scoreColor(score);
                return (
                  <Link
                    key={iv._id}
                    href={`/interviews/${iv._id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.875rem 1.5rem',
                      borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    className="table-row-hover"
                  >
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                      background: COLORS[i % COLORS.length] + '20', 
                      border: '1px solid ' + COLORS[i % COLORS.length] + '40',
                      color: COLORS[i % COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 800,
                    }}>
                      {(name[0] || 'S').toUpperCase()}
                    </div>
                     <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.15rem' }}>{name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{iv.role || 'Practice Session'}</div>
                    </div>
                    {/* Score — hidden on smallest mobile */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }} className="col-hide-mobile">
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: col }}>{scoreStr}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{timeAgo(iv.start_time)}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                      Detail <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                    </div>
                  </Link>
                );
              }) : (
                <div className="empty-state">
                  <div className="empty-icon"><ClipboardList size={40} /></div>
                  <div className="empty-title">No assessments yet</div>
                  <div className="empty-sub">When users complete interviews on the app, they will appear here.</div>
                </div>
              )}
            </div>
          </div>

          {/* Role Breakdown — hidden on smallest mobile view, kept for tablet+ */}
          <div className="card" style={{ overflow: 'visible' }}>
            <div className="card-header">
              <div className="card-title">Top Roles</div>
              <div className="card-subtitle">By volume</div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topRoles.length > 0 ? topRoles.map(([role, count], i) => {
                const pct = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
                return (
                  <div key={role}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{role}</div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: COLORS[i % COLORS.length] }}>{count} sessions</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '100px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem', padding: '1.5rem 0' }}>No data yet</div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2 — User Activity Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Candidate Activity</div>
              <div className="card-subtitle">Users, devices, and session counts</div>
            </div>
            <Link href="/users" className="btn btn-ghost" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
              View all <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th className="col-hide-mobile">Device</th>
                  <th>Assessments</th>
                  <th className="col-hide-mobile">Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Show top 5 most active users on dashboard */}
                {Object.entries(sessionsByUser)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([userId, sessions], idx) => {
                    const name = userNameMap[userId] || 'Anonymous';
                    const isEngaged = sessions > 0;
                    const isRepeat = sessions > 1;
                    return (
                      <tr key={userId}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: COLORS[idx % COLORS.length] + '20',
                                border: '1px solid ' + COLORS[idx % COLORS.length] + '40',
                                color: COLORS[idx % COLORS.length],
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.875rem', fontWeight: 800
                            }}>
                              {(name[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.875rem', marginBottom: '0.15rem' }}>{name}</div>
                              {isRepeat && (
                                <span style={{ fontSize: '0.6rem', background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>REPEAT</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="col-hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>—</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '52px', height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(100, sessions * 20)}%`, background: 'linear-gradient(90deg, var(--accent), #EC4899)', borderRadius: '100px' }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{sessions}</span>
                          </div>
                        </td>
                        <td className="col-hide-mobile" style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>—</td>
                        <td>
                          {isEngaged
                            ? <span className="badge badge-live"><span className="badge-dot" />Active</span>
                            : <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontWeight: 600 }}>Inactive</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                {Object.keys(sessionsByUser).length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: '2.5rem' }}>
                        <div className="empty-icon"><User size={40} /></div>
                        <div className="empty-title">No candidates yet</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
