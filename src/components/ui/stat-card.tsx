import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
  delay?: number;
}

const colorMap = {
  primary: { bg: 'bg-primary-50', icon: 'bg-primary-500', text: 'text-primary-600' },
  secondary: { bg: 'bg-secondary-50', icon: 'bg-secondary-500', text: 'text-secondary-600' },
  accent: { bg: 'bg-accent-50', icon: 'bg-accent-500', text: 'text-accent-600' },
  warning: { bg: 'bg-warning-50', icon: 'bg-warning-500', text: 'text-warning-600' },
  error: { bg: 'bg-error-50', icon: 'bg-error-500', text: 'text-error-600' },
};

export function StatCard({ title, value, icon: Icon, trend, color, delay = 0 }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div
      className="stat-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-surface-500 mb-2">{title}</p>
          <p className="text-2xl font-bold text-surface-800">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium ${trend.positive ? 'text-accent-600' : 'text-error-600'}`}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-surface-400">نسبت به ماه قبل</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
          <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center`}>
            <Icon className="text-white" size={18} />
          </div>
        </div>
      </div>
      <div className={`absolute -bottom-2 -left-2 w-20 h-20 rounded-full ${c.bg} opacity-50 blur-2xl`} />
    </div>
  );
}
