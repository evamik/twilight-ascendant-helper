import React from "react";
import { Button, NavButton } from "../common/buttons";
import styles from "./SettingsNavigation.module.css";

export interface SettingsSection {
  ref: React.RefObject<HTMLDivElement | null>;
  label: string;
  id: string;
}

interface SettingsNavigationProps {
  sections: SettingsSection[];
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * SettingsNavigation Component
 * Sticky navigation bar with back button and section quick-jump buttons
 */
const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
  sections,
  showBackButton = false,
  onBack,
}) => {
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.stickyHeader}>
      {showBackButton && onBack && (
        <Button onClick={onBack} className={styles.backButton}>
          ← Back
        </Button>
      )}
      <nav className={styles.settingsNav}>
        {sections.map((section) => (
          <NavButton
            key={section.id}
            onClick={() => scrollToSection(section.ref)}
          >
            {section.label}
          </NavButton>
        ))}
      </nav>
    </div>
  );
};

export default SettingsNavigation;
