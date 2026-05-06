'use client';
import React, { useState, useEffect } from 'react';
import { Activity, Server, ShieldCheck, Cpu, HardDrive, Terminal, Zap } from 'lucide-react';

export default function MonitorPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Simulated log feed
    const messages = [
      "Database connection pool synchronized",
      "OCR worker heartbeat: OK",
      "Assigned new task to summarize_resume_v2",
      "Cache invalidated for user_sync_meta",
      "Internal API response time: 42ms",
      "S3 upload successful: resume_6385.pdf",
      "Inbound sync request from Android (v1.0.5)",
      "High memory usage alert: Microservice [A]",
    ];

    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        msg: messages[Math.floor(Math.random() * messages.length)],
        level: Math.random() > 0.8 ? 'WARN' : 'INFO'
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">System Monitor</h1>
          <p className="page-subtitle">Real-time health monitoring, resource allocation & sync telemetry</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon icon-green"><ShieldCheck size={20} /></div>
          <div>
            <div className="stat-label">System Health</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>OPTIMAL</div>
            <div className="stat-meta">Uptime: 14d 6h 22m</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue"><Cpu size={20} /></div>
          <div>
            <div className="stat-label">CPU Load</div>
            <div className="stat-value">12.4%</div>
            <div className="stat-meta">8 Cores active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple"><HardDrive size={20} /></div>
          <div>
            <div className="stat-label">Memory Usage</div>
            <div className="stat-value">2.4 / 8 GB</div>
            <div className="stat-meta">32% allocated</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-amber"><Zap size={20} /></div>
          <div>
            <div className="stat-label">Avg Latency</div>
            <div className="stat-value">48ms</div>
            <div className="stat-meta">99.9th percentile</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Logs Terminal */}
        <div className="card" style={{ background: '#0F172A', border: '1px solid #1E293B', padding: '0', display: 'flex', flexDirection: 'column', height: '500px' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={16} color="#94A3B8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em' }}>LIVE SYSTEM TELEMETRY</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
            {logs.map(log => (
              <div key={log.id} style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                <span style={{ color: '#475569' }}>[{log.time}]</span>
                <span style={{ color: log.level === 'WARN' ? '#F59E0B' : '#10B981', fontWeight: 800, width: '45px' }}>{log.level}</span>
                <span style={{ color: '#CBD5E1' }}>{log.msg}</span>
              </div>
            ))}
            <div style={{ color: '#475569' }}>Initializing monitoring stream...</div>
          </div>
        </div>

        {/* Server Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Microservices</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ServiceStatus name="Auth Engine" status="online" />
              <ServiceStatus name="OCR Worker" status="online" />
              <ServiceStatus name="Resume Extractor" status="online" />
              <ServiceStatus name="AI Generator" status="busy" />
              <ServiceStatus name="Mail Relay" status="offline" />
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
             <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Live Traffic</div>
             <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                {[40, 70, 45, 90, 65, 30, 80, 50, 40, 60, 85, 45, 75, 55].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent)', borderRadius: '2px', opacity: 0.3 + (i/20) }} />
                ))}
             </div>
             <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>1,244 Requests / hr</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string, status: 'online' | 'busy' | 'offline' }) {
  const color = status === 'online' ? '#10B981' : (status === 'busy' ? '#F59E0B' : '#EF4444');
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 500 }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: color, textTransform: 'uppercase' }}>{status}</span>
      </div>
    </div>
  );
}
