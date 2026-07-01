import React from "react";

/**
 * Responsive page header: stacks on mobile, row layout on desktop.
 */
export function PageHeader({ title, subtitle, children, className = "" }) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header__title min-w-0">
        {typeof title === "string" ? (
          <h1 className="text-lg sm:text-xl font-semibold break-words dash-text">
            {title}
          </h1>
        ) : (
          title
        )}
        {subtitle && (
          <p className="text-sm dash-text-muted mt-1 break-words">{subtitle}</p>
        )}
      </div>
      {children ? <div className="page-header__actions">{children}</div> : null}
    </div>
  );
}

export function DataTableShell({ children, className = "" }) {
  return (
    <div className={`data-table-shell ${className}`.trim()}>{children}</div>
  );
}

export function FilterStack({ children, className = "" }) {
  return (
    <div className={`filter-stack ${className}`.trim()}>{children}</div>
  );
}

export default PageHeader;
