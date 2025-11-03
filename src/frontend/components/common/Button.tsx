import React from "react";
import styles from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "ghost";

export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Standardized Button Component
 * Provides consistent styling across the entire application
 *
 * @example
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 * <Button variant="danger" size="small" disabled>Delete</Button>
 * <Button variant="success" icon={<span>✓</span>}>Confirm</Button>
 */
const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "medium",
  fullWidth = false,
  icon,
  iconPosition = "left",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...rest
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
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
      {isLoading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <span className={styles.iconLeft}>{icon}</span>
          )}
          <span className={styles.content}>{children}</span>
          {icon && iconPosition === "right" && (
            <span className={styles.iconRight}>{icon}</span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
