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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://localhost:5000/tickets/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        const uRes = await fetch(`http://localhost:5000/users/${data.user_id}`, { cache: 'no-store' });
        const user = uRes.ok ? await uRes.json() : null;
        setTicket({ ...data, userName: user?.name || 'Registered User' });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!notes.trim() && status === 'resolved') {
      alert('Please provide resolution notes before marking as resolved.');
      return;
    }
    
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:5000/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (res.ok) {
        setNotes('');
        const updated = await res.json();
        setTicket({ ...ticket, ...updated });
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
        </div>

        <div className="card" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-subtle)' }}>
          <div className="card-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ fontSize: '1rem', color: 'var(--accent)' }}>Action Center</div>
          </div>
          <div style={{ padding: '2.5rem' }}>
             <div style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Enter resolution notes or progress updates below:</div>
              <textarea 
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Ex: Resolved the sync issue by restarting the worker..."
                 style={{ 
                   width: '100%', 
                   minHeight: '140px', 
                   background: 'var(--bg-elevated)', 
                   border: '2px solid var(--border)', 
                   borderRadius: '16px', 
                   padding: '1.25rem', 
                   color: 'var(--text-1)',
                   marginBottom: '2rem',
                   resize: 'vertical',
                   fontSize: '1rem',
                   outline: 'none',
                   transition: 'all 0.2s',
                   fontFamily: 'inherit'
                 }}
                 onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.1)'; }}
                 onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
             <div style={{ display: 'flex', gap: '1.5rem' }}>
                 <button 
                   onClick={() => updateStatus('in-progress')}
                   disabled={isUpdating || ticket.status === 'resolved'}
                   className="btn btn-ghost"
                   style={{ flex: 1, height: '54px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                 >
                   {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Clock size={18} />}
                   {isUpdating ? 'UPDATING...' : 'MARK IN-PROGRESS'}
                 </button>
                 <button 
                   onClick={() => updateStatus('resolved')}
                   disabled={isUpdating || ticket.status === 'resolved'}
                   className="badge badge-live"
                   style={{ 
                     flex: 1, 
                     height: '54px', 
                     fontSize: '0.9rem', 
                     fontWeight: 700, 
                     cursor: ticket.status === 'resolved' ? 'default' : 'pointer', 
                     border: 'none',
                     borderRadius: '12px',
                     opacity: ticket.status === 'resolved' ? 0.6 : 1,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '8px'
                   }}
                 >
                   {ticket.status === 'resolved' ? <CheckCircle size={18} /> : null}
                   {ticket.status === 'resolved' ? 'TICKET RESOLVED' : 'RESOLVE TICKET'}
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
