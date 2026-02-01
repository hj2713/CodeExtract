// Ported from: UI component pattern common in the source repo

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green' | 'gray' | 'orange';
}

export function Badge({ children, variant = 'blue' }: BadgeProps) {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    gray: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        border ${variantStyles[variant]}
      `}
    >
      {children}
    </span>
  );
}
