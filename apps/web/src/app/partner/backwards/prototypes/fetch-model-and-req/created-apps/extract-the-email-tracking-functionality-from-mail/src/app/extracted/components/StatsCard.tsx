// Ported from: source/packages/dashboard/src/components/StatsCard.tsx

interface StatsCardProps {
  icon: string;
  label: string;
  value: number | string;
  variant?: 'default' | 'success' | 'info';
}

export default function StatsCard({ icon, label, value, variant = 'default' }: StatsCardProps) {
  return (
    <div className={`stats-card ${variant}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <span className="stats-value">{value}</span>
        <span className="stats-label">{label}</span>
      </div>
    </div>
  );
}
