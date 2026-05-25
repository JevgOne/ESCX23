import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'default' | 'warn' | 'good';
  children?: ReactNode;
}

export default function StatCard({ title, value, subtitle, tone = 'default', children }: StatCardProps) {
  const valueClass = tone === 'warn' ? 'stat-value warn' : tone === 'good' ? 'stat-value good' : 'stat-value';
  return (
    <div className="stat-card">
      <div className="stat-label">{title}</div>
      <div className={valueClass}>{value}</div>
      {subtitle && <div className="stat-sub">{subtitle}</div>}
      {children}
    </div>
  );
}
