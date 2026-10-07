import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'warn' | 'good';
  icon?: string;
  svgIcon?: string;
  children?: ReactNode;
}

export default function StatCard({ title, value, subtitle, tone = 'default', icon, svgIcon, children }: StatCardProps) {
  const valueClass = tone === 'warn' ? 'stat-value warn' : tone === 'good' ? 'stat-value good' : 'stat-value';
  const cardClass = tone === 'warn' ? 'stat-card stat-card-warn' : tone === 'good' ? 'stat-card stat-card-good' : 'stat-card';
  return (
    <div className={cardClass}>
      {svgIcon ? (
        <div className="stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={svgIcon} />
          </svg>
        </div>
      ) : icon ? (
        <div className="stat-icon">{icon}</div>
      ) : null}
      <div className="stat-label">{title}</div>
      <div className={valueClass}>{value}</div>
      {subtitle && <div className="stat-sub">{subtitle}</div>}
      {children}
    </div>
  );
}
