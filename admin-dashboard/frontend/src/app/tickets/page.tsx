'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TicketsPage() {
  const [data, setData] = useState<{ tickets: any[], total: number, userNameMap: Record<string, string> }>({
    tickets: [],
    total: 0,
    userNameMap: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tRes, uRes] = await Promise.all([
          fetch('http://localhost:5000/tickets', { cache: 'no-store' }),
          fetch('http://localhost:5000/users', { cache: 'no-store' }),
        ]);
        const ticketsData = await tRes.json();
        const usersData = await uRes.json();

        const userNameMap: Record<string, string> = {};
        (usersData.data ?? []).forEach((u: any) => {
          userNameMap[u._id] = u.name || 'Registered User';
        });

        setData({
          tickets: ticketsData.tickets ?? [],
          total: ticketsData.total ?? 0,
          userNameMap
        });
      } catch (e) {
        console.error("Failed to load tickets:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { tickets, total, userNameMap } = data;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-subtle)', borderTopColor: 'var(--accent-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.05em' }}>PREPARING Support Tickets...</div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="page-header-row">
          <div>
            <div className="page-title">Support Tickets</div>
            <div className="page-subtitle">Unified view of user-reported issues and feedback</div>
          </div>
          <div className="badge badge-purple" style={{ padding: '0.5rem 1rem' }}>{total} TICKETS</div>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--border-subtle)', background: 'rgba(30,32,44,0.3)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>User</th>
                <th>Issue Details</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ paddingRight: '1.5rem' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? tickets.map((t: any) => {
                const name = userNameMap[t.user_id] || userNameMap[`user_${t.user_id}`];
                const priority = getPriorityBadge(t.priority);
                const initials = (name || 'U').split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase();
                
                return (
                  <tr 
                    key={t._id} 
                    className="ticket-row"
                    onClick={() => window.location.href = `/tickets/${t._id}`}
                    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                  >
                    <td style={{ paddingLeft: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '12px', 
                          background: name ? 'var(--accent-gradient)' : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.9rem' }}>{name || 'Registered User'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', letterSpacing: '0.02em', marginTop: '2px' }}>ID: {t.user_id.slice(-10)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '400px', paddingRight: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: '0.95rem' }}>{t.title}</div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-4)', 
                          marginTop: '4px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.5'
                        }}>
                          {t.description || 'No description provided'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent-light)', background: 'var(--accent-subtle)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {t.category || 'General'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.6rem', 
                        fontWeight: 900, 
                        color: priority.color, 
                        background: `${priority.color}15`,
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        border: `1px solid ${priority.color}30`
                      }}>
                        {priority.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.status === 'open' ? '#EF4444' : '#22C55E' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'capitalize' }}>{t.status}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 500, paddingRight: '1.5rem' }}>
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ opacity: 0.3, fontSize: '2rem', marginBottom: '0.5rem' }}>✉</div>
                    <div style={{ color: 'var(--text-4)' }}>No support tickets found</div>
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'open': return 'badge-rose';
    case 'in-progress': return 'badge-amber';
    case 'resolved': return 'badge-live';
    case 'closed': return 'badge-dot';
    default: return 'badge-purple';
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'critical': return { color: '#EF4444', label: 'CRITICAL' };
    case 'high': return { color: '#F59E0B', label: 'HIGH' };
    case 'medium': return { color: '#3B82F6', label: 'MEDIUM' };
    default: return { color: '#94A3B8', label: 'LOW' };
  }
}
