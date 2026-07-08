import React from "react";

function KpiCard({
  title,
  value,
  helpText,
  icon: Icon,
  loading = false,
}) {
  return (
    <div className="dash-surface-card p-5 sm:p-6 flex justify-between items-start gap-4 min-h-[132px] hover:shadow-md transition-shadow duration-300">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium dash-text-muted">{title}</p>
        {loading ? (
          <div className="mt-2 h-9 w-28 bg-gray-200 dark:bg-slate-600 rounded-lg animate-pulse" />
        ) : (
          <p className="mt-1 text-2xl sm:text-3xl font-bold dash-text tracking-tight break-words">
            {value ?? 0}
          </p>
        )}
        {helpText && (
          <p className="mt-2 text-xs sm:text-sm dash-text-muted leading-snug">
            {helpText}
          </p>
        )}
      </div>
      {Icon && (
        <div className="shrink-0 p-2.5 sm:p-3 bg-[#d69e2e]/30 rounded-lg">
          <Icon size={28} style={{ color: "var(--dash-icon)" }} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}

export default KpiCard;
