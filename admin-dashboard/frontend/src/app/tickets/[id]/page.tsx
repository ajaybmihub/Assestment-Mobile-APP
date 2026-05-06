'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Ticket, ArrowLeft, Loader2, CheckCircle, Clock } from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    async function load() {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      try {
        const res = await fetch(`${API_URL}/tickets/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        const uRes = await fetch(`${API_URL}/users/${data.user_id}`, { cache: 'no-store' });
        let user = null;
        if (uRes.ok && uRes.status !== 204) {
          const text = await uRes.text();
          user = text ? JSON.parse(text) : null;
        }
        setTicket({ ...data, userName: user?.name || 'Registered User' });
        if (data.resolution_notes) setNotes(data.resolution_notes);
      } catch (e) {
        console.error('Error loading ticket or user:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    if (!notes.trim() && status === 'resolved') {
      setIsResolving(true);
      return;
    }
    
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        setIsResolving(false);
        const updated = await res.json();
        setTicket({ ...ticket, ...updated });
        if (updated.resolution_notes) setNotes(updated.resolution_notes);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
       <Loader2 className="animate-spin" size={32} color="var(--accent)" />
       <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>FETCHING TICKET...</div>
    </div>
  );

  if (!ticket) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <div style={{ marginBottom: '1.5rem', color: 'var(--accent)', opacity: 0.2 }}><Ticket size={80} /></div>
      <div className="page-title">Ticket Not Found</div>
      <div style={{ color: 'var(--text-4)', marginBottom: '2rem' }}>Reference: {id}</div>
      <Link href="/tickets" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={16} /> Return to Support Tickets
      </Link>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-4)', marginBottom: '1.5rem' }}>
          <Link href="/tickets" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>Support Tickets</Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>TKT-{ticket._id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="page-header-row">
          <div>
            <div className="page-title" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{ticket.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                 {ticket.category}
               </span>
               <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-4)' }} />
               <span style={{ color: 'var(--text-4)', fontSize: '0.85rem' }}>
                 By <strong style={{ color: 'var(--text-2)' }}>{ticket.userName}</strong> on {new Date(ticket.createdAt).toLocaleDateString()}
               </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-4)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Current Status</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-elevated)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ticket.status === 'open' ? '#EF4444' : (ticket.status === 'resolved' ? '#22C55E' : '#F59E0B') }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase' }}>{ticket.status}</span>
             </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-card)' }}>
           <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>Issue Description</div>
           <div style={{ fontSize: '1.15rem', color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
             {ticket.description}
           </div>

           {(ticket.image_url || (ticket.image_urls && ticket.image_urls.length > 0)) && (
             <div style={{ marginTop: '2.5rem' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Evidence & Attachments</div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                 {(ticket.image_urls || [ticket.image_url]).filter(Boolean).map((url: string, idx: number) => (
                   <div key={idx} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--border)', aspectRatio: '16/9' }}>
                     <img 
                       src={url} 
                       alt={`Attachment ${idx + 1}`} 
                       style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                       onClick={() => window.open(url, '_blank')}
                     />
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>

        <div className="card" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-subtle)' }}>
          <div className="card-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ fontSize: '1rem', color: 'var(--accent)' }}>Action Center</div>
          </div>
          <div style={{ padding: '2.5rem' }}>
              {/* 1. Change Ticket Status at TOP */}
              <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Ticket Status</div>
                 <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)', gap: '6px' }}>
                   <StatusButton 
                     active={ticket.status === 'open'} 
                     label="Open" 
                     color="#EF4444" 
                     onClick={() => updateStatus('open')} 
                     disabled={isUpdating}
                   />
                   <StatusButton 
                     active={ticket.status === 'in-progress'} 
                     label="In Progress" 
                     color="#F59E0B" 
                     onClick={() => updateStatus('in-progress')} 
                     disabled={isUpdating}
                   />
                   <StatusButton 
                     active={ticket.status === 'resolved' || isResolving} 
                     label="Resolved" 
                     color="#10B981" 
                     onClick={() => {
                       if (ticket.status !== 'resolved') {
                         setIsResolving(true);
                         if (notes.trim()) updateStatus('resolved');
                       }
                     }} 
                     disabled={isUpdating}
                   />
                 </div>
              </div>

              {/* 2. Message Section - show if already RESOLVED or if user clicked Resolved button */}
              {(ticket.status === 'resolved' || isResolving) && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution Notes / Progress Updates</div>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Resolved the sync issue by restarting the worker..."
                    readOnly={ticket.status === 'resolved' && !isResolving}
                    style={{ 
                      width: '100%', 
                      minHeight: '120px', 
                      background: ticket.status === 'resolved' && !isResolving ? 'rgba(255,255,255,0.02)' : 'var(--bg-elevated)', 
                      border: '2px solid var(--border)', 
                      borderRadius: '16px', 
                      padding: '1.25rem', 
                      color: ticket.status === 'resolved' && !isResolving ? 'var(--text-4)' : 'var(--text-1)',
                      resize: 'vertical',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      fontStyle: ticket.status === 'resolved' && !isResolving ? 'italic' : 'normal'
                    }}
                    onFocus={(e) => { if (!e.target.readOnly) { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.1)'; } }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                  {(isResolving || (ticket.status === 'resolved' && isResolving)) ? (
                    <button 
                      onClick={() => updateStatus('resolved')}
                      disabled={isUpdating}
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-end', padding: '0.5rem 1.5rem' }}
                    >
                      {ticket.status === 'resolved' ? 'Save Changes' : 'Confirm Resolution'}
                    </button>
                  ) : ticket.status === 'resolved' && (
                    <button 
                      onClick={() => setIsResolving(true)}
                      className="btn btn-outline"
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-end', padding: '0.4rem 1rem', fontSize: '0.75rem', height: 'auto' }}
                    >
                      Update Notes
                    </button>
                  )}
                </div>
              )}

              {/* 3. Quick Action at the bottom */}
              <div style={{ marginBottom: '1.5rem' }}>
                 <button 
                   onClick={() => {
                     setNotes("Triaged: This behavior is intended and not a bug.");
                     setIsResolving(true);
                   }}
                   disabled={isUpdating || ticket.status === 'resolved'}
                   className="btn btn-outline"
                   style={{ width: '100%', height: '48px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '12px', color: 'var(--text-3)', borderStyle: 'dashed' }}
                 >
                   QUICK ACTION: MARK AS 'NOT A BUG'
                 </button>
              </div>
           </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
           <Link href="/tickets" style={{ color: 'var(--text-4)', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} className="btn-hover-neu">
             <ArrowLeft size={16} /> Back to all tickets
           </Link>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ active, label, color, onClick, disabled }: { active: boolean, label: string, color: string, onClick: () => void, disabled: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled || active}
      style={{ 
        flex: 1,
        height: '40px',
        border: 'none',
        borderRadius: '10px',
        fontSize: '0.8rem',
        fontWeight: 700,
        cursor: (disabled || active) ? 'default' : 'pointer',
        background: active ? color : 'transparent',
        color: active ? '#fff' : 'var(--text-3)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}
    >
      {active && <CheckCircle size={14} />}
      {label.toUpperCase()}
    </button>
  );
}
