import React, { useEffect, useState, useRef } from 'react';
import AccountList from './components/AccountList';
import CharacterList from './components/CharacterList';
import CharacterData from './components/CharacterData';
import { useAccountCharacterNavigation } from './hooks/useAccountCharacterNavigation';

const defaultAnchor = { x: 0, y: 0 };

const Overlay = ({ visible }) => {
  const {
    accounts,
    characters,
    selectedAccount,
    selectedCharacter,
    characterData,
    handleAccountClick,
    handleCharacterClick,
    handleBackClick,
    loadCharacterData,
  } = useAccountCharacterNavigation();
  
  const [anchor, setAnchor] = useState(defaultAnchor);
  const [overlaySize, setOverlaySize] = useState({ width: 400, height: 200 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [previousSize, setPreviousSize] = useState({ width: 400, height: 200 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const overlayStart = useRef({ x: 0, y: 0 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ width: 400, height: 200 });

  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      
      ipcRenderer.on('set-anchor', (event, anchorPos) => {
        setAnchor(anchorPos);
      });
      ipcRenderer.on('set-overlay-size', (event, size) => {
        setOverlaySize(size);
      });
      return () => {
        ipcRenderer.removeAllListeners('set-anchor');
        ipcRenderer.removeAllListeners('set-overlay-size');
      };
    }
  }, []);

  const didDrag = useRef(false);
  const handleMouseDown = (e) => {
    dragging.current = true;
    didDrag.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.invoke('get-overlay-position').then((pos) => {
        overlayStart.current = pos || { x: 0, y: 0 };
      });
      ipcRenderer.send('drag-overlay', true);
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const moveTimeout = useRef(null);
  const lastMoveEvent = useRef(null);
  const DEBOUNCE_MS = 16; // ~60fps

  const sendMoveOverlay = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Only consider as drag if mouse moved more than a few pixels
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      didDrag.current = true;
    }
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('move-overlay', { dx, dy });
    }
  };

  const handleMouseMove = (e) => {
    lastMoveEvent.current = e;
    if (moveTimeout.current) return;
    moveTimeout.current = setTimeout(() => {
      sendMoveOverlay(lastMoveEvent.current);
      moveTimeout.current = null;
    }, DEBOUNCE_MS);
  };

  const handleMouseUp = () => {
    dragging.current = false;
    // Clear any pending move events
    if (moveTimeout.current) {
      clearTimeout(moveTimeout.current);
      moveTimeout.current = null;
    }
    // Only update anchor if a drag actually occurred
    if (didDrag.current) {
      // Request overlay and Warcraft window positions for accurate anchor
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        Promise.all([
          ipcRenderer.invoke('get-overlay-position'),
          ipcRenderer.invoke('get-warcraft-position'),
        ]).then(([overlayPos, warcraftPos]) => {
          if (overlayPos && warcraftPos) {
            const newAnchor = {
              x: overlayPos.x - warcraftPos.x,
              y: overlayPos.y - warcraftPos.y,
            };
            ipcRenderer.send('anchor-changed', newAnchor);
          }
          ipcRenderer.send('drag-overlay', false); // Notify main process drag ended
        });
      }
    } else {
      // Simple click - toggle minimize
      handleMinimizeToggle();
      // Just notify drag ended, no anchor update
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('drag-overlay', false);
      }
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMinimizeToggle = () => {
    if (isMinimized) {
      // Restore to previous size
      setOverlaySize(previousSize);
      setIsMinimized(false);
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('resize-overlay', previousSize);
      }
    } else {
      // Minimize to just the anchor button (48x48 to fit the button with some padding)
      setPreviousSize(overlaySize);
      const minimizedSize = { width: 48, height: 48 };
      setOverlaySize(minimizedSize);
      setIsMinimized(true);
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('resize-overlay', minimizedSize);
      }
    }
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { ...overlaySize };
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e) => {
    if (!resizing.current) return;
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const newWidth = Math.max(200, sizeStart.current.width + dx);
    const newHeight = Math.max(100, sizeStart.current.height + dy);
    setOverlaySize({ width: newWidth, height: newHeight });
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('resize-overlay', { width: newWidth, height: newHeight });
    }
  };

  const handleResizeMouseUp = () => {
    resizing.current = false;
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  };

  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: overlaySize.width,
        height: overlaySize.height,
        background: isMinimized ? 'transparent' : 'rgba(30,30,30,0.7)',
        zIndex: 9999,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 32,
          height: 32,
          background: '#ff9800',
          borderRadius: '50%',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#222',
          zIndex: 10001,
        }}
        onMouseDown={handleMouseDown}
        title={isMinimized ? "Click to restore, drag to move" : "Click to minimize, drag to move"}
      >
        {isMinimized ? '□' : '+'}
      </div>
      {!isMinimized && selectedAccount && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 56,
            padding: '6px 12px',
            background: '#555',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            zIndex: 10001,
          }}
          onClick={handleBackClick}
          title="Back"
        >
          ← Back
        </div>
      )}
      {!isMinimized && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 24,
            height: 24,
            background: '#fff',
            borderRadius: '6px',
            border: '2px solid #ff9800',
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 'bold',
            color: '#ff9800',
            zIndex: 10001,
          }}
          onMouseDown={handleResizeMouseDown}
          title="Resize overlay"
        >
          ↘
        </div>
      )}
      {!isMinimized && (
        <div
          style={{
            marginTop: 48,
            width: '100%',
            padding: '0 20px 20px 20px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            overflowX: 'hidden',
            height: 'calc(100% - 48px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="overlay-scroll-content"
        >
          {selectedCharacter ? (
            <CharacterData
              accountName={selectedAccount}
              characterName={selectedCharacter}
              characterData={characterData}
              onBack={handleBackClick}
              onLoad={() => loadCharacterData()}
            />
          ) : selectedAccount ? (
            <CharacterList
              accountName={selectedAccount}
              characters={characters}
              onBack={handleBackClick}
              onCharacterClick={handleCharacterClick}
              showBackButton={false}
            />
          ) : (
            <>
              <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>Accounts</h2>
              <AccountList
                accounts={accounts}
                onAccountClick={handleAccountClick}
              />
            </>
          )}
        </div>
      )}
      <style>{`
        .overlay-scroll-content::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Overlay;
