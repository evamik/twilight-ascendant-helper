import React from 'react';

const CharacterList = ({ accountName, characters, onBack, onCharacterClick, buttonStyle, showBackButton = true }) => {
  return (
    <>
      {showBackButton && (
        <button
          onClick={onBack}
          style={{
            marginBottom: 10,
            padding: '8px 12px',
            background: '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            ...buttonStyle,
          }}
        >
          ← Back
        </button>
      )}
      <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>
        Characters in {accountName}
      </h2>
      {characters.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14 }}>No characters found</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {characters.map((char, index) => (
            <button
              key={index}
              onClick={() => onCharacterClick(char)}
              style={{
                padding: '8px 12px',
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'left',
                ...buttonStyle,
              }}
            >
              {char}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default CharacterList;
