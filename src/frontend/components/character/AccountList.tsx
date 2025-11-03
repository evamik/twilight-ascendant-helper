import React from "react";
import styles from "./AccountList.module.css";
import { Button } from "../common/buttons";

interface AccountListProps {
  accounts: string[];
  onAccountClick: (account: string) => void;
  buttonStyle?: React.CSSProperties;
}

const AccountList: React.FC<AccountListProps> = ({
  accounts,
  onAccountClick,
  buttonStyle,
}) => {
  if (accounts.length === 0) {
    return <p className={styles.emptyMessage}>No accounts found</p>;
  }

  return (
    <div className={styles.container}>
      {accounts.map((account, index) => (
        <Button
          key={index}
          onClick={() => onAccountClick(account)}
          variant="primary"
          className={styles.button}
          style={buttonStyle}
        >
          {account}
        </Button>
      ))}
    </div>
  );
};

export default AccountList;
