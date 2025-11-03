import React from "react";
import styles from "./IconButton.module.css";

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "ghost";

export type IconButtonSize = "small" | "medium" | "large";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: React.ReactNode;
  isLoading?: boolean;
}

/**
 * IconButton Component
 * For icon-only buttons (like favorite, settings, etc.)
 *
 * @example
 * <IconButton icon="⚙️" title="Settings" onClick={handleSettings} />
 * <IconButton variant="danger" icon="🗑️" size="small" />
 */
const IconButton: React.FC<IconButtonProps> = ({
  variant = "secondary",
  size = "medium",
  icon,
  isLoading = false,
  className = "",
  disabled,
  ...rest
}) => {
  const buttonClasses = [
    styles.iconButton,
    styles[variant],
    styles[size],
    isLoading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <span className={styles.spinner} /> : icon}
    </button>
  );
};

export default IconButton;
