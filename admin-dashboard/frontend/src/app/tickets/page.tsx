'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, User } from 'lucide-react';

export default function TicketsPage() {
  const [data, setData] = useState<{ tickets: any[], total: number, userNameMap: Record<string, string> }>({
    tickets: [],
    total: 0,
    userNameMap: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      try {
        const [tRes, uRes] = await Promise.all([
          fetch(`${API_URL}/tickets`, { cache: 'no-store' }),
          fetch(`${API_URL}/users`, { cache: 'no-store' }),
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
        <Loader2 className="animate-spin" size={40} color="var(--accent)" />
        <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>PREPARING Support Tickets...</div>
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

      <div className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem', width: '250px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Profile</div></th>
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
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '12px', 
                          background: name ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                          border: '1px solid var(--accent-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || 'Registered User'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-4)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                            ID: <span style={{ color: 'var(--text-3)' }}>{t.user_id.slice(-10)}</span>
                          </div>
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
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {t.category || 'General'}
                          </span>
                          {(t.image_url || (t.image_urls && t.image_urls.length > 0)) && (
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '4px', 
                              fontSize: '0.6rem', fontWeight: 700, color: '#10B981',
                              background: '#10B98115', padding: '2px 6px', borderRadius: '40px' 
                            }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10B981' }} />
                              {t.image_urls?.length || 1} Attachment{ (t.image_urls?.length || 1) > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {(t.image_url || (t.image_urls && t.image_urls.length > 0)) && (
                           <div style={{ marginTop: '10px', display: 'flex', gap: '4px', overflowX: 'hidden' }}>
                             {(t.image_urls || [t.image_url]).filter(Boolean).slice(0, 3).map((url: string, i: number) => (
                               <img 
                                 key={i}
                                 src={url} 
                                 alt="Ticket preview" 
                                 style={{ 
                                   width: '60px', 
                                   height: '40px', 
                                   objectFit: 'cover', 
                                   borderRadius: '6px',
                                   border: '1px solid var(--border)',
                                   cursor: 'zoom-in'
                                 }} 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   window.open(url, '_blank');
                                 }}
                               />
                             ))}
                             {(t.image_urls?.length > 3) && (
                               <div style={{ width: '60px', height: '40px', background: 'var(--bg-elevated)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-4)', fontWeight: 700 }}>
                                 +{t.image_urls.length - 3}
                               </div>
                             )}
                           </div>
                        )}
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
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-icon"><Mail size={40} /></div>
                      <div className="empty-title">No support tickets found</div>
                      <div className="empty-sub">Reported issues will appear here for review.</div>
                    </div>
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
