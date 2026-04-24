import React from 'react';
import Link from 'next/link';
import { User, Mail, Smartphone, Layers, History, Settings, CheckCircle, ArrowRight } from 'lucide-react';

async function getData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  try {
    const [uRes, iRes] = await Promise.all([
      fetch(`${API_URL}/users`, { cache: 'no-store' }),
      fetch(`${API_URL}/interviews`, { cache: 'no-store' }),
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
      const t = iv.start_time || iv.created_at || iv.createdAt;
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

function timeAgo(isoStr: any) {
  if (!isoStr) return 'Never';
  try {
    const date = typeof isoStr === 'object' && isoStr.$date ? new Date(isoStr.$date) : new Date(isoStr);
    const diff = Date.now() - date.getTime();
    if (isNaN(diff)) return 'Never';
    
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return 'Never'; }
}

export default async function UsersPage() {
  const { allUsers, sessionsByUser, lastActiveByUser, rolesByUser, totalInterviews } = await getData();

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Candidate Directory</div>
            <div className="page-subtitle">Unified view of all registered student profiles and their activity metrics</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="badge badge-purple" style={{ padding: '0.625rem 1rem' }}>{allUsers.length} Active Profiles</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed', minWidth: '940px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ paddingLeft: '1.5rem', width: '250px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Profile</div></th>
                <th style={{ width: '250px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Contact</div></th>
                <th style={{ width: '200px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Smartphone size={14} /> Device</div></th>
                <th style={{ width: '150px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={14} /> Sessions</div></th>
                <th style={{ width: '120px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><History size={14} /> Last Seen</div></th>
                <th style={{ paddingRight: '1.5rem', textAlign: 'right', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length > 0 ? allUsers.map((user: any, idx: number) => {
                const sessions = sessionsByUser[user._id] ?? 0;
                const lastActive = lastActiveByUser[user._id];
                const roles = Array.from(rolesByUser[user._id] ?? []);
                
                return (
                  <tr key={user._id} style={{ height: '84px', borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                    <td style={{ paddingLeft: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="avatar" style={{ 
                          width: '40px', height: '40px', flexShrink: 0,
                          background: COLORS[idx % COLORS.length] + '20', 
                          color: COLORS[idx % COLORS.length],
                          fontSize: '1rem', fontWeight: 700
                        }}>
                          {(user.name?.[0] ?? 'U').toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name ?? 'Anonymous User'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                            ID: <span style={{ color: 'var(--text-3)' }}>{user._id?.replace('user_', '')}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.81rem', color: 'var(--text-2)', fontWeight: 500, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email ?? 'no-email@synced.com'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={10} color="#10B981" />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-4)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Verified</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-2)', fontWeight: 600, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.device_id || 'GEN-DEV-X'}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-4)' }}>v{user.app_version || '1.0.0'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '1rem' }}>{sessions}</span>
                        <div style={{ width: '30px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, sessions * 20)}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>
                      {timeAgo(lastActive)}
                    </td>
                    <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                        <Link href={`/users/${user._id}`}
                          className="btn btn-ghost"
                          style={{ 
                            fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px', 
                            textDecoration: 'none', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                          Manage <ArrowRight size={14} />
                        </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-4)' }}>No student profiles synced yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
