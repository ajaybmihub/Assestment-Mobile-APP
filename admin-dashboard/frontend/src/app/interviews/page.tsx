import React from 'react';
import Link from 'next/link';
import { ClipboardList, ArrowRight, FileText, User } from 'lucide-react';

async function getData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  try {
    const [uRes, iRes, jRes] = await Promise.all([
      fetch(`${API_URL}/users?limit=1000`, { cache: 'no-store' }).catch(e => { console.error('Users fetch failed', e); return null; }),
      fetch(`${API_URL}/interviews`, { cache: 'no-store' }).catch(e => { console.error('Interviews fetch failed', e); return null; }),
      fetch(`${API_URL}/jobs`, { cache: 'no-store' }).catch(e => { console.error('Jobs fetch failed', e); return null; }),
    ]);

    const users = uRes && uRes.ok ? await uRes.json() : { data: [] };
    const interviews = iRes && iRes.ok ? await iRes.json() : { interviews: [] };
    const jobs = jRes && jRes.ok ? await jRes.json() : [];

    const userNameMap: Record<string, string> = {};
    (users.data ?? []).forEach((u: any) => {
      const name = u.name || 'Anonymous Candidate';
      userNameMap[u._id] = name;
      userNameMap[u._id.replace(/^user_/, '')] = name;
    });

    const jobMap: Record<string, string> = {};
    (jobs ?? []).forEach((j: any) => {
      if (j.job_id) jobMap[j.job_id.toString()] = j.title;
    });

    return {
      interviews: interviews.interviews ?? [],
      total: interviews.total ?? 0,
      userNameMap,
      jobMap
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

function scoreColor(n: number) {
  if (n >= 70) return '#22C55E';
  if (n >= 40) return '#F59E0B';
  return '#EF4444';
}

function scoreBadgeClass(n: number) {
  if (n >= 70) return 'badge-live';
  if (n >= 40) return 'badge-amber';
  return 'badge-rose';
}

export default async function InterviewsPage() {
  const { interviews, total, userNameMap, jobMap } = await getData();

  return (
    <>
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Assessments</div>
            <div className="page-subtitle">All recorded interview sessions from the mobile app</div>
          </div>
          <span className="badge badge-purple">{total} sessions</span>
        </div>
      </div>

      {/* DESKTOP: Table view */}
      <div className="card" style={{ display: 'none' }} id="desktop-table">
        {/* Table is shown via CSS for desktop */}
      </div>

      {/* Both table (desktop) and cards (mobile) — CSS handles which is visible */}
      <style dangerouslySetInnerHTML={{ __html: `
        #table-view { display: block; }
        #cards-view { display: none; }
        @media (max-width: 768px) {
          #table-view { display: none; }
          #cards-view { display: flex; flex-direction: column; gap: 0.875rem; }
        }
      `}} />

      {/* DESKTOP TABLE */}
      <div id="table-view">
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-scroll-container">
            <table className="data-table" style={{ minWidth: '720px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem', width: '300px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Profile</div></th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Score</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {interviews.length > 0 ? interviews.map((iv: any, idx: number) => {
                  const uId = iv.user_id;
                  let userName = userNameMap[uId] || userNameMap[uId?.replace(/^user_/, '')] || userNameMap[`user_${uId}`] || 'Anonymous';
                  
                  // If we still have a generic placeholder, try to use the ID or email for better identification
                  if (userName === 'Anonymous Candidate' || userName === 'Anonymous' || userName === 'Registered User') {
                    const displayId = uId?.replace(/^user_/, '') || 'Guest';
                    userName = displayId;
                  }
                  const initial = (userName[0] || 'S').toUpperCase();
                  const rawTs = iv.start_time || iv.created_at || iv.createdAt;
                  const ts = typeof rawTs === 'object' && rawTs.$date ? rawTs.$date : rawTs;
                  const dateDisplay = ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  const overallScore = iv.scores?.overall || '0%';
                  const scoreNum = parseInt(overallScore) || 0;

                  return (
                    <tr key={iv._id} style={{ height: '72px', borderBottom: '1px solid var(--border)' }}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '12px', 
                            background: COLORS[idx % COLORS.length] + '20',
                            border: '1px solid ' + COLORS[idx % COLORS.length] + '40',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: COLORS[idx % COLORS.length],
                            flexShrink: 0
                          }}>
                            {initial}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                              ID: <span style={{ color: 'var(--text-3)' }}>{iv._id?.replace('sess_', '')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.72rem', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 600, border: '1px solid',
                          background: iv.role?.startsWith('MCQ:') ? 'rgba(59, 130, 246, 0.15)' : 'var(--accent-subtle)', 
                          color: iv.role?.startsWith('MCQ:') ? '#60A5FA' : 'var(--accent-light)', 
                          borderColor: iv.role?.startsWith('MCQ:') ? 'rgba(59, 130, 246, 0.3)' : 'var(--accent-border)' 
                        }}>
                          {iv.job_id && jobMap[iv.job_id.toString()] ? jobMap[iv.job_id.toString()] : (iv.role || 'Practice')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: scoreColor(scoreNum) }}>{overallScore}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{dateDisplay}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{timeAgo(ts)}</div>
                      </td>
                      <td style={{ paddingRight: '1.5rem', textAlign: 'right' }}>
                        <Link href={`/interviews/${iv._id}`} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                          Detail <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                        </Link>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon"><FileText size={40} /></div>
                        <div className="empty-title">No sessions recorded yet</div>
                        <div className="empty-sub">Complete an interview on the mobile app and tap Sync Now to see it here.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div id="cards-view">
        {interviews.length > 0 ? interviews.map((iv: any, idx: number) => {
          const userName = userNameMap[iv.user_id] || 'Anonymous';
          const initial = (userName[0] || 'S').toUpperCase();
          const rawTs = iv.start_time || iv.created_at || iv.createdAt;
          const ts = typeof rawTs === 'object' && rawTs.$date ? rawTs.$date : rawTs;
          const dateDisplay = ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          const overallScore = iv.scores?.overall || '—';
          const scoreNum = parseInt(overallScore) || 0;
          const hasScore = !!iv.scores?.overall;

          return (
            <Link key={iv._id} href={`/interviews/${iv._id}`} style={{ textDecoration: 'none' }}>
              <div className="report-card">
                <div className="report-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: COLORS[idx % COLORS.length] + '20',
                      border: '1px solid ' + COLORS[idx % COLORS.length] + '40',
                      color: COLORS[idx % COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem'
                    }}>{initial}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.15rem' }}>{userName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{dateDisplay} · {timeAgo(ts)}</div>
                    </div>
                  </div>
                  {hasScore && (
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: scoreColor(scoreNum) }}>{overallScore}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-4)', fontWeight: 600 }}>SCORE</div>
                    </div>
                  )}
                </div>
                  <div className="report-card-footer">
                    <span style={{ 
                      fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 600, border: '1px solid',
                      background: iv.role?.startsWith('MCQ:') ? 'rgba(59, 130, 246, 0.15)' : 'var(--accent-subtle)', 
                      color: iv.role?.startsWith('MCQ:') ? '#60A5FA' : 'var(--accent)', 
                      borderColor: iv.role?.startsWith('MCQ:') ? 'rgba(59, 130, 246, 0.3)' : 'var(--accent-border)' 
                    }}>
                      {iv.role || 'Practice Session'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      Report <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </span>
                  </div>
              </div>
            </Link>
          );
        }) : (
          <div className="empty-state">
            <div className="empty-icon"><ClipboardList size={40} /></div>
            <div className="empty-title">No assessments yet</div>
            <div className="empty-sub">Complete an interview on the mobile app and tap Sync Now to see it here.</div>
          </div>
        )}
      </div>
    </>
  );
}
