'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlayCircle, Users, Mail, BookOpen } from 'lucide-react';

const NAV = [
  { label: 'Overview',        icon: <LayoutDashboard size={18} />, href: '/'           },
  { label: 'Assessments',     icon: <PlayCircle size={18} />,     href: '/interviews' },
  { label: 'Users',           icon: <Users size={18} />,          href: '/users'      },
  { label: 'Question Bank',   icon: <BookOpen size={18} />,       href: '/questions'  },
  { label: 'Support',         icon: <Mail size={18} />,           href: '/tickets'    },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ---- DESKTOP SIDEBAR ---- */}
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
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer card — mirrors the reference image upgrade/info block */}
        <div className="sidebar-footer">
          
          
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="avatar" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin User</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>v1.5.0-premium</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- MOBILE TOP HEADER ---- */}
      <header className="mobile-header">
        <div className="logo-mark">AI</div>
        <div className="logo-text">
          <span className="logo-name">Interview.AI</span>
        </div>
        <div className="live-dot">
          <span />
          Live
        </div>
      </header>

      {/* ---- MOBILE BOTTOM NAV ---- */}
      <nav className="mobile-nav">
        {NAV.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`mobile-nav-item${isActive ? ' active' : ''}`}>
              <span className="mob-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
