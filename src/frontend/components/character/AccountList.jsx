import React from 'react';

const AccountList = ({ accounts, onAccountClick, buttonStyle }) => {
  if (accounts.length === 0) {
    return <p style={{ margin: 0, fontSize: 14 }}>No accounts found</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {accounts.map((account, index) => (
        <button
          key={index}
          onClick={() => onAccountClick(account)}
          style={{
            padding: '10px 12px',
            background: '#ff9800',
            color: '#222',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'left',
            ...buttonStyle,
          }}
        >
          {account}
        </button>
      ))}
    </div>
  );
};

export default AccountList;
