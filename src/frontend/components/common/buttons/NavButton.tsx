import React from "react";
import styles from "./NavButton.module.css";

export interface NavButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * NavButton Component
 * Standardized navigation button for use in navigation bars
 */
const NavButton: React.FC<NavButtonProps> = ({
  onClick,
  children,
  className = "",
}) => {
  return (
    <button onClick={onClick} className={`${styles.navButton} ${className}`}>
      {children}
    </button>
  );
};

export default NavButton;
