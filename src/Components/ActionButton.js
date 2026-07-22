import React from "react";

const VARIANT_CLASS = {
  gold: "action-menu-btn action-menu-btn--gold",
  blue: "action-menu-btn action-menu-btn--blue",
  green: "action-menu-btn action-menu-btn--green",
  red: "action-menu-btn action-menu-btn--red",
  slate: "action-menu-btn action-menu-btn--slate",
  amber: "action-menu-btn action-menu-btn--amber",
};

/**
 * Attractive action-menu / toolbar button used across table action menus.
 */
function ActionButton({
  children,
  icon,
  label,
  variant = "slate",
  className = "",
  type = "button",
  ...props
}) {
  const content =
    label || children ? (
      <>
        {icon ? <span className="action-menu-btn__icon">{icon}</span> : null}
        <span className="action-menu-btn__label">{label || children}</span>
      </>
    ) : (
      icon
    );

  return (
    <button
      type={type}
      className={`${VARIANT_CLASS[variant] || VARIANT_CLASS.slate} ${className}`.trim()}
      {...props}
    >
      {content}
    </button>
  );
}

export default ActionButton;
