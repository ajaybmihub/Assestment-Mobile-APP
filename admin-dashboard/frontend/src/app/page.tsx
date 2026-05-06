'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, PlayCircle, Activity, Mail, ClipboardList, User, ArrowRight, ShieldAlert, MessageCircle, Clock, RefreshCw, Ticket, AlertCircle } from 'lucide-react';

async function fetchDashboardData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  console.log(`[DASHBOARD] Fetching data from: ${API_URL}`);
  
  try {
    const [uRes, iRes, tRes] = await Promise.all([
      fetch(`${API_URL}/users?limit=1000`, { cache: 'no-store' }).catch(e => { console.error('Users fetch failed', e); return null; }),
      fetch(`${API_URL}/interviews`, { cache: 'no-store' }).catch(e => { console.error('Interviews fetch failed', e); return null; }),
      fetch(`${API_URL}/tickets`, { cache: 'no-store' }).catch(e => { console.error('Tickets fetch failed', e); return null; }),
    ]);

    const users = uRes && uRes.ok ? await uRes.json() : { data: [] };
    const interviews = iRes && iRes.ok ? await iRes.json() : { interviews: [] };
    const tickets = tRes && tRes.ok ? await tRes.json() : { tickets: [] };

    const allUsers: any[] = users.data ?? [];
    const allInterviews: any[] = interviews.interviews ?? [];
    const allTickets: any[] = tickets.tickets ?? [];

    const userNameMap: Record<string, string> = {};
    allUsers.forEach(u => { 
      const name = u.name || 'Anonymous Candidate';
      userNameMap[u._id] = name; 
      userNameMap[u._id.replace(/^user_/, '')] = name;
    });

    const sessionsByUser: Record<string, number> = {};
    for (const iv of allInterviews) {
      const uId = iv.user_id;
      const cleanId = uId?.replace(/^user_/, '');
      sessionsByUser[uId] = (sessionsByUser[uId] ?? 0) + 1;
      if (cleanId && cleanId !== uId) {
        sessionsByUser[cleanId] = (sessionsByUser[cleanId] ?? 0) + 1;
      }
    }

    const activeCount = Object.keys(sessionsByUser).length;
    const uniqueDevices = new Set(allUsers.map((u: any) => u.device_id)).size;

    const multiSessionUsers = Object.values(sessionsByUser).filter(c => c > 1).length;

    const scoredSessions = allInterviews.filter((iv: any) => iv.scores?.overall);
    const avgScore = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((s: number, iv: any) => s + parseInt(iv.scores.overall) || 0, 0) / scoredSessions.length)
      : 0;

    const passCount = scoredSessions.filter((iv: any) => (parseInt(iv.scores?.overall) || 0) >= 60).length;
    const passRate = scoredSessions.length > 0 ? Math.round((passCount / scoredSessions.length) * 100) : 0;

    const roleCount: Record<string, number> = {};
    for (const iv of allInterviews) {
      const r = iv.role || 'Unknown';
      roleCount[r] = (roleCount[r] ?? 0) + 1;
    }

    const recentActivity = [...allInterviews]
      .sort((a, b) => (b.start_time || '').localeCompare(a.start_time || ''))
      .slice(0, 5);

    const recentTickets = [...allTickets]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);

    const openTickets = allTickets.filter(t => t.status === 'open').length;

    const userMetaMap: Record<string, { device: string, lastActive: string, isOnline: boolean }> = {};
    allUsers.forEach(u => { 
      const userSessions = allInterviews.filter(iv => iv.user_id === u._id);
      const latest = userSessions.sort((a,b) => (b.start_time || '').localeCompare(a.start_time || ''))[0];
      const lastActive = latest?.start_time || u.createdAt || '';
      const diffMs = lastActive ? Date.now() - new Date(lastActive).getTime() : Infinity;
      
      userMetaMap[u._id] = {
        device: u.device_name || u.device_id?.slice(0, 8) || 'Unknown',
        lastActive: lastActive,
        isOnline: diffMs < (1000 * 60 * 10),
      };
    });

    return {
      totalUsers: users.meta?.total ?? allUsers.length,
      totalSessions: interviews.total ?? allInterviews.length,
      totalTickets: allTickets.length,
      openTickets,
      activeUsers: activeCount,
      uniqueDevices,
      multiSessionUsers,
      avgScore,
      passRate,
      recentActivity,
      recentTickets,
      userNameMap,
      userMetaMap,
      sessionsByUser,
    };
  } catch (error) {
    console.error("Dashboard pull failed:", error);
    return null;
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

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    const freshData = await fetchDashboardData();
    if (freshData) setData(freshData);
    
    setLoading(false);
    setIsRefreshing(false);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={32} color="var(--accent)" />
        <div style={{ color: 'var(--text-4)', fontSize: '0.9rem' }}>Booting Dashboard Engine...</div>
      </div>
    );
  }

  const {
    totalUsers, totalSessions, totalTickets, openTickets, activeUsers, uniqueDevices,
    avgScore, recentActivity, recentTickets, userNameMap, userMetaMap, sessionsByUser,
  } = data || {
    totalUsers: 0, totalSessions: 0, totalTickets: 0, openTickets: 0, activeUsers: 0, uniqueDevices: 0,
    avgScore: 0, recentActivity: [], recentTickets: [], userNameMap: {}, userMetaMap: {}, sessionsByUser: {},
  };

  const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 2s linear infinite; }
      `}} />

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Dashboard Overview</div>
            <div className="page-subtitle">Real-time assessment activity & candidate engagement</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isRefreshing && <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--text-4)' }} />}
          </div>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <Link href="/users" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '124px' }}>
            <div className="stat-card-icon icon-purple"><Users size={20} /></div>
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{totalUsers}</div>
            </div>
          </div>
        </Link>
        <Link href="/interviews" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '124px' }}>
            <div className="stat-card-icon icon-blue"><PlayCircle size={20} /></div>
            <div>
              <div className="stat-label">Total Assessments</div>
              <div className="stat-value">{totalSessions}</div>
            </div>
          </div>
        </Link>
        <Link href="/users?filter=active" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '124px' }}>
            <div className="stat-card-icon icon-green"><Activity size={20} /></div>
            <div>
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{activeUsers}</div>
              <div className="stat-meta"><span style={{ color: 'var(--green)' }}>{engagementRate}%</span> engagement rate</div>
            </div>
          </div>
        </Link>
        <Link href="/tickets" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '124px' }}>
            <div className="stat-card-icon icon-amber"><Mail size={20} /></div>
            <div>
              <div className="stat-label">Support Tickets</div>
              <div className="stat-value">{totalTickets}</div>
              <div className="stat-meta"><span style={{ color: openTickets > 0 ? '#EF4444' : 'var(--green)' }}>{openTickets} open</span> issues pending</div>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ROW 1 — Recent Assessments + Recent Tickets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }} className="content-grid-two-col">
          <style dangerouslySetInnerHTML={{ __html: `
            @media (max-width: 1024px) {
              .content-grid-two-col { grid-template-columns: 1fr !important; }
            }
          `}} />

          {/* Recent Assessments */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Assessments</div>
                <div className="card-subtitle">Latest sessions synced from the app</div>
              </div>
              <Link href="/interviews" className="btn btn-ghost" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                View all <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
            <div>
              {recentActivity.length > 0 ? recentActivity.map((iv: any, i: number) => {
                const uId = iv.user_id;
                let name = userNameMap[uId] || userNameMap[uId?.replace(/^user_/, '')] || userNameMap[`user_${uId}`] || 'Anonymous';
                
                if (name === 'Anonymous Candidate' || name === 'Anonymous' || name === 'Registered User') {
                  name = uId?.replace(/^user_/, '') || 'Guest';
                }
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
                    <div style={{ textAlign: 'right', flexShrink: 0 }} className="col-hide-mobile">
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: col }}>{scoreStr}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{timeAgo(iv.start_time)}</div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-icon"><ClipboardList size={32} /></div>
                  <div className="empty-title" style={{ fontSize: '0.9rem' }}>No assessments yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Support Tickets */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Tickets</div>
                <div className="card-subtitle">User-reported issues and feedback</div>
              </div>
              <Link href="/tickets" className="btn btn-ghost" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Manage <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
            <div>
              {recentTickets.length > 0 ? recentTickets.map((t: any, i: number) => {
                const name = userNameMap[t.user_id] || 'Registered User';
                const isUrgent = t.priority === 'high' || t.priority === 'critical';
                return (
                  <Link
                    key={t._id}
                    href={`/tickets/${t._id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.875rem 1.5rem',
                      borderBottom: i < recentTickets.length - 1 ? '1px solid var(--border)' : 'none',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    className="table-row-hover"
                  >
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                      background: isUrgent ? '#EF444415' : 'var(--bg-elevated)', 
                      border: '1px solid ' + (isUrgent ? '#EF444430' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isUrgent ? '#EF4444' : 'var(--accent)',
                    }}>
                      {isUrgent ? <ShieldAlert size={20} /> : <Ticket size={20} />}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.15rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {name} · {t.category}
                        <span style={{ 
                          fontSize: '0.6rem', fontWeight: 900, 
                          color: isUrgent ? '#EF4444' : (t.priority === 'medium' ? '#F59E0B' : 'var(--text-4)'),
                          textTransform: 'uppercase',
                          background: isUrgent ? '#EF444415' : 'transparent',
                          padding: isUrgent ? '1px 5px' : '0',
                          borderRadius: '4px'
                        }}>
                          [{t.priority}]
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }} className="col-hide-mobile">
                      <div style={{ 
                        fontSize: '0.65rem', fontWeight: 900, 
                        color: t.status === 'open' ? '#EF4444' : '#22C55E',
                        textTransform: 'uppercase', marginBottom: '0.2rem'
                      }}>{t.status}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <Clock size={10} /> {timeAgo(t.createdAt)}
                      </div>
                    </div>
                  </Link>
                );
              }) : (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-icon"><Mail size={32} /></div>
                  <div className="empty-title" style={{ fontSize: '0.9rem' }}>No pending tickets</div>
                </div>
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
            <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '250px' }}>Candidate</th>
                  <th className="col-hide-mobile" style={{ width: '150px' }}>Device</th>
                  <th style={{ width: '120px' }}>Assessments</th>
                  <th className="col-hide-mobile" style={{ width: '150px' }}>Last Active</th>
                  <th style={{ width: '120px' }}>Status</th>
                </tr>
              </thead>
            </table>
            
            <div style={{ 
              maxHeight: '340px', 
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border) transparent'
            }}>
              <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', borderTop: 'none' }}>
                <tbody>
                  {Object.entries(sessionsByUser)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([userId, sessions], idx) => {
                      let name = userNameMap[userId] || 'Anonymous';
                      if (name === 'Anonymous Candidate' || name === 'Anonymous' || name === 'Registered User') {
                        name = userId?.replace(/^user_/, '') || 'Guest';
                      }
                      const meta = userMetaMap[userId] || { device: 'Unknown', lastActive: '', isOnline: false };
                      const isRepeat = (sessions as number) > 1;
                      
                      return (
                        <tr key={userId}>
                          <td style={{ width: '250px' }}>
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
                          <td className="col-hide-mobile" style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-3)' }}>
                            {meta.device}
                          </td>
                          <td style={{ width: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '52px', height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (sessions as number) * 20)}%`, background: 'linear-gradient(90deg, var(--accent), #EC4899)', borderRadius: '100px' }} />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{sessions as number}</span>
                            </div>
                          </td>
                          <td className="col-hide-mobile" style={{ width: '150px', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                            {meta.lastActive ? timeAgo(meta.lastActive) : '—'}
                          </td>
                          <td style={{ width: '120px' }}>
                            {meta.isOnline
                              ? <span className="badge badge-live" style={{ padding: '4px 10px' }}><span className="badge-dot" />Live</span>
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
      </div>
    </>
  );
}
