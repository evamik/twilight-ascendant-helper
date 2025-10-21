import React from 'react';
import styles from './AccountList.module.css';

const AccountList = ({ accounts, onAccountClick, buttonStyle }) => {
  if (accounts.length === 0) {
    return <p className={styles.emptyMessage}>No accounts found</p>;
  }

  return (
    <div className={styles.container}>
      {accounts.map((account, index) => (
        <button
          key={index}
          onClick={() => onAccountClick(account)}
          className={styles.button}
          style={buttonStyle}
        >
          {account}
        </button>
      ))}
    </div>
  );
};

export default AccountList;
