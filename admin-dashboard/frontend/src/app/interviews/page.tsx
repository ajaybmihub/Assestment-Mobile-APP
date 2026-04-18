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

function timeAgo(isoStr: string) {
  if (!isoStr) return '—';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const COLORS = ['#7C3AED', '#2563EB', '#0D9488', '#B45309', '#BE185D'];

export default async function InterviewsPage() {
  const { interviews, total, userNameMap } = await getData();

  return (
    <>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Session Activity</div>
            <div className="page-subtitle">All recorded app sessions and user interactions</div>
          </div>
          <span className="badge badge-purple">{total} total sessions</span>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Activity / Role</th>
              <th>Messages</th>
              <th>Device</th>
              <th>Date</th>
              <th>Time ago</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {interviews.length > 0 ? interviews.map((iv: any, idx: number) => {
              const userName = userNameMap[iv.user_id] || 'Anonymous';
              const initial = (userName[0] || 'S').toUpperCase();
              const msgCount = iv.chat_history?.length ?? 0;
              const date = iv.start_time
                ? new Date(iv.start_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              return (
                <tr key={iv._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ background: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.85rem' }}>{userName}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', fontFamily: 'monospace' }}>Session: {iv._id?.slice(0, 18)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem', borderRadius: '100px', background: 'rgba(124,58,237,0.1)', color: '#A78BFA', fontWeight: 500 }}>
                      {iv.role || 'General Session'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, msgCount * 5)}%`, background: COLORS[idx % COLORS.length], borderRadius: '100px' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{msgCount}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>
                    {iv.device_id ?? '—'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{date}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-4)', whiteSpace: 'nowrap' }}>{timeAgo(iv.start_time)}</td>
                  <td>
                    <Link href={`/interviews/${iv._id}`}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500 }}>
                      View →
                    </Link>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-4)' }}>
                  No sessions recorded yet. Open the mobile app to start tracking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
