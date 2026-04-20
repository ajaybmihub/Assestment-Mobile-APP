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
    
    const userNameMap: Record<string, string> = {};
    (users.data ?? []).forEach((u: any) => {
      userNameMap[u._id] = u.name || 'Anonymous';
    });

    return { 
      interviews: interviews.interviews ?? [], 
      total: interviews.total ?? 0,
      userNameMap 
    };
  } catch {
    return { interviews: [], total: 0, userNameMap: {} };
  }
}

function timeAgo(isoStr: any) {
  if (!isoStr) return '—';
  try {
    const date = typeof isoStr === 'object' && isoStr.$date ? new Date(isoStr.$date) : new Date(isoStr);
    const diff = Date.now() - date.getTime();
    if (isNaN(diff)) return '—';
    
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return '—'; }
}

const COLORS = ['#7C3AED', '#2563EB', '#0D9488', '#B45309', '#BE185D'];

export default async function InterviewsPage() {
  const { interviews, total, userNameMap } = await getData();

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Session Activity</div>
            <div className="page-subtitle">All recorded app sessions and user interactions</div>
          </div>
          <span className="badge badge-purple">{total} total sessions</span>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed', minWidth: '900px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ paddingLeft: '1.5rem', width: '220px' }}>User</th>
                <th style={{ width: '150px' }}>Role / Type</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Score</th>
                <th style={{ width: '150px' }}>Device ID</th>
                <th style={{ width: '120px' }}>Date</th>
                <th style={{ width: '100px' }}>Relative</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem', width: '100px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {interviews.length > 0 ? interviews.map((iv: any, idx: number) => {
                const userName = userNameMap[iv.user_id] || 'Anonymous';
                const initial = (userName[0] || 'S').toUpperCase();
                
                const rawTimestamp = iv.start_time || iv.created_at || iv.createdAt;
                const timestamp = typeof rawTimestamp === 'object' && rawTimestamp.$date ? rawTimestamp.$date : rawTimestamp;
                
                const dateDisplay = timestamp
                  ? new Date(timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                  
                const overallScore = iv.scores?.overall || '0%';
                const scoreNum = parseInt(overallScore) || 0;

                return (
                  <tr key={iv._id} style={{ height: '76px', borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                    <td style={{ paddingLeft: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div className="avatar" style={{ 
                          width: '36px', height: '36px', flexShrink: 0,
                          background: COLORS[idx % COLORS.length] + '20', 
                          color: COLORS[idx % COLORS.length],
                          fontSize: '0.9rem', fontWeight: 700
                        }}>
                          {initial}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.01em' }}>
                            ID: <span style={{ color: 'var(--text-3)' }}>{iv._id?.slice(-8)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '0.3rem 0.65rem', borderRadius: '6px', 
                        background: 'var(--accent-subtle)', color: 'var(--accent-light)', 
                        fontWeight: 600, border: '1px solid var(--accent-border)' 
                      }}>
                        {iv.role || 'Practice'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: scoreNum > 70 ? '#10B981' : scoreNum > 40 ? '#F59E0B' : '#EF4444' }}>{overallScore}</span>
                        <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', width: overallScore, 
                            background: scoreNum > 70 ? '#10B981' : scoreNum > 40 ? '#F59E0B' : '#EF4444'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
                      {iv.device_id ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.81rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{dateDisplay}</td>
                    <td style={{ fontSize: '0.81rem', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{timeAgo(timestamp)}</td>
                    <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                      <Link href={`/interviews/${iv._id}`}
                        style={{ 
                          fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '6px', 
                          background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', 
                          color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600,
                          transition: 'all 0.2s', display: 'inline-block'
                        }}>
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-4)' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Empty Activity Log</div>
                    <div style={{ fontSize: '0.875rem' }}>No sessions recorded yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
