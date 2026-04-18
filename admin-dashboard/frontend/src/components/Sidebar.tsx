'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'App Analytics', icon: '◈', href: '/' },
  { label: 'Users', icon: '◉', href: '/users' },
  { label: 'Session Activity', icon: '▶', href: '/interviews' },
  { label: 'Analytics', icon: '◎', href: '/analytics' },
  { label: 'Devices', icon: '⊡', href: '/monitor' },
];


export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">AI</div>
        <div className="logo-text">
          <span className="logo-name">Interview.AI</span>
          <span className="logo-tag">Enterprise</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon" style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className="status-dot" />
          <span className="status-text">System Online</span>
        </div>
        <div style={{ padding: '0.5rem 0.75rem 0', fontSize: '0.65rem', color: 'var(--text-4)', fontWeight: 600 }}>V1.5.0-STAGE</div>
      </div>
    </div>
  );
}
