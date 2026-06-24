import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'warn' | 'good';
  icon?: string;
  children?: ReactNode;
}

export default function StatCard({ title, value, subtitle, tone = 'default', icon, children }: StatCardProps) {
  const valueClass = tone === 'warn' ? 'stat-value warn' : tone === 'good' ? 'stat-value good' : 'stat-value';
  const cardClass = tone === 'warn' ? 'stat-card stat-card-warn' : tone === 'good' ? 'stat-card stat-card-good' : 'stat-card';
  return (
    <div className={cardClass}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-label">{title}</div>
      <div className={valueClass}>{value}</div>
      {subtitle && <div className="stat-sub">{subtitle}</div>}
      {children}
    </div>
  );
}
