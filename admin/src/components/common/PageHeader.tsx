interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, subtitle, actions, children }: PageHeaderProps) {
  const sub = subtitle ?? description;
  const right = actions ?? children;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
        {sub && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-wrap shrink-0">{right}</div>}
    </div>
  );
}
