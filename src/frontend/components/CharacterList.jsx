import React, { useState } from 'react';

const NON_T4_CLASSES = [
  'Novice',
  'Acolyte',
  'Initiate',
  'Thief',
  'Archer',
  'Swordsman',
  'Witch Hunter',
  'Templar',
  'Druid',
  'Cleric',
  'Mage',
  'Rogue',
  'Hunter',
  'Knight',
  'Slayer',
  'Arch Templar',
  'Arch Druid',
  'Priest',
  'Matriarch',
  'Sage',
  'Wizard',
  'Stalker',
  'Assassin',
  'Marksman',
  'Tracker',
  'Imperial Knight',
  'Crusader',
  'Witcher',
  'Inquisitor',
  'Dark Templar',
  'High Templar',
  'Shapeshifter',
  'Shaman'
];

const CharacterList = ({ accountName, characters, onBack, onCharacterClick, buttonStyle, showBackButton = true }) => {
  const [showOnlyT4, setShowOnlyT4] = useState(false);

  const isT4Character = (characterName) => {
    // Check if character name starts with any non-T4 class
    return !NON_T4_CLASSES.some(nonT4Class => 
      characterName.startsWith(nonT4Class)
    );
  };

  const filteredCharacters = showOnlyT4 
    ? characters.filter(isT4Character)
    : characters;

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
      
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '12px',
        cursor: 'pointer',
        fontSize: 14
      }}>
        <input
          type="checkbox"
          checked={showOnlyT4}
          onChange={(e) => setShowOnlyT4(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        <span>Show only T4 classes</span>
      </label>

      {filteredCharacters.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14 }}>
          {showOnlyT4 ? 'No T4 characters found' : 'No characters found'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredCharacters.map((char, index) => (
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
