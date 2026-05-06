import React from 'react';
import Link from 'next/link';
import { User, Mail, Smartphone, Layers, History, Settings, CheckCircle, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getData(page: number = 1, filter: string = '') {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  // If we are filtering for active users, we need to fetch a larger set to find them all
  const limit = filter === 'active' ? 1000 : 10;
  
  try {
    const uRes = await fetch(`${API_URL}/users?page=${page}&limit=${limit}`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!uRes.ok) throw new Error('Failed to fetch users');
    const usersJson = await uRes.json();

    let allInterviews: any[] = [];
    try {
      const iRes = await fetch(`${API_URL}/interviews?limit=2000`, { 
        cache: 'no-store',
        next: { revalidate: 0 } 
      });
      if (iRes.ok) {
        const interviewsJson = await iRes.json();
        allInterviews = interviewsJson.interviews ?? [];
      }
    } catch (e) {
      console.error('Non-critical: Interviews fetch failed', e);
    }
    const allUsers: any[] = usersJson.data ?? [];
    const meta = usersJson.meta ?? { total: allUsers.length, page, last_page: 1 };

    const sessionsByUser: Record<string, number> = {};
    const lastActiveByUser: Record<string, string> = {};
    const rolesByUser: Record<string, Set<string>> = {};

    for (const iv of allInterviews) {
      const uId = iv.user_id;
      const cleanUId = uId?.replace(/^user_/, '') || uId;
      if (!cleanUId) continue;
      
      sessionsByUser[cleanUId] = (sessionsByUser[cleanUId] ?? 0) + 1;

      const t = iv.start_time || iv.created_at || iv.createdAt;
      if (t) {
        if (!lastActiveByUser[cleanUId] || t > lastActiveByUser[cleanUId]) {
          lastActiveByUser[cleanUId] = t;
        }
      }
      
      if (iv.role) {
        if (!rolesByUser[cleanUId]) rolesByUser[cleanUId] = new Set();
        rolesByUser[cleanUId].add(iv.role);
      }
    }

    return { allUsers, sessionsByUser, lastActiveByUser, rolesByUser, totalInterviews: allInterviews.length, meta };
  } catch {
    return { allUsers: [], sessionsByUser: {}, lastActiveByUser: {}, rolesByUser: {}, totalInterviews: 0, meta: { total: 0, page: 1, last_page: 1 } };
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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const pageStr = params.page;
  const filter = params.filter;
  const currentPage = parseInt(pageStr || '1', 10);
  
  let { allUsers, sessionsByUser, lastActiveByUser, rolesByUser, meta } = await getData(currentPage, filter || '');

  // Apply active filter if requested
  if (filter === 'active') {
    allUsers = allUsers.filter(user => {
      const cleanId = user._id?.replace(/^user_/, '') || user._id;
      return (sessionsByUser[cleanId] ?? 0) > 0;
    });
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Candidate Directory</div>
            <div className="page-subtitle">
              {filter === 'active' 
                ? 'Showing only active candidates with recorded assessment sessions' 
                : 'Unified view of all registered student profiles and their activity metrics'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {filter === 'active' && (
              <Link href="/users" className="badge badge-amber" style={{ padding: '0.625rem 1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>×</span> Clear Filter: Active
              </Link>
            )}
            <div className="badge badge-purple" style={{ padding: '0.625rem 1rem' }}>
              {filter === 'active' ? allUsers.length : meta.total} {filter === 'active' ? 'Active' : 'Total'} Profiles
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-scroll-container">
          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed', minWidth: '940px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ paddingLeft: '1.5rem', width: '300px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Profile</div></th>
                <th style={{ width: '300px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Contact</div></th>
                <th style={{ width: '150px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={14} /> Sessions</div></th>
                <th style={{ width: '120px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><History size={14} /> Last Seen</div></th>
                <th style={{ paddingRight: '1.5rem', textAlign: 'right', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length > 0 ? allUsers.map((user: any, idx: number) => {
                const cleanId = user._id?.replace(/^user_/, '') || user._id;
                const sessions = sessionsByUser[cleanId] ?? 0;
                const lastActive = lastActiveByUser[cleanId];
                
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
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Anonymous Candidate'}</div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '1rem' }}>{sessions}</span>
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
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-4)' }}>No student profiles synced yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!(filter === 'active' && allUsers.length <= 10) && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>
              Showing <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{allUsers.length}</span> candidates on page <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{currentPage}</span> of <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{meta.last_page}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link 
                href={`/users?page=${currentPage - 1}${filter ? `&filter=${filter}` : ''}`}
                className={`btn ${currentPage <= 1 ? 'btn-disabled' : 'btn-outline'}`}
                style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', textDecoration: 'none' }}
              >
                Previous
              </Link>
              <Link 
                href={`/users?page=${currentPage + 1}${filter ? `&filter=${filter}` : ''}`}
                className={`btn ${currentPage >= meta.last_page ? 'btn-disabled' : 'btn-outline'}`}
                style={{ pointerEvents: currentPage >= meta.last_page ? 'none' : 'auto', textDecoration: 'none' }}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
