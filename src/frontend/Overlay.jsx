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
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const grabOffset = useRef({ x: 0, y: 0 }); // Offset from window top-left to mouse position
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ width: 400, height: 200 });
  const isHoveringAnchor = useRef(false); // Track if mouse is over anchor
  const mouseDownPos = useRef({ x: 0, y: 0 }); // Track initial mouse position

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
  
  const handleAnchorMouseEnter = () => {
    isHoveringAnchor.current = true;
    if (isMinimized && window.require && !dragging.current) {
      const { ipcRenderer } = window.require('electron');
      // Stop forwarding mouse events when hovering over anchor
      ipcRenderer.send('set-mouse-forward', false);
    }
  };

  const handleAnchorMouseLeave = () => {
    isHoveringAnchor.current = false;
    if (isMinimized && window.require && !dragging.current) {
      const { ipcRenderer } = window.require('electron');
      // Resume forwarding mouse events when not hovering
      ipcRenderer.send('set-mouse-forward', true);
    }
  };
  
  const handleMouseDown = (e) => {
    dragging.current = true;
    didDrag.current = false;
    mouseDownPos.current = { x: e.screenX, y: e.screenY }; // Store initial position
    
    // Calculate grab offset immediately on mousedown (not on first move)
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      const pos = ipcRenderer.sendSync('get-overlay-position-sync');
      grabOffset.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y
      };
      
      // Disable mouse forwarding when potentially dragging
      ipcRenderer.send('set-mouse-forward', false);
      ipcRenderer.send('drag-overlay', true);
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const moveTimeout = useRef(null);
  const lastMoveEvent = useRef(null);
  const DEBOUNCE_MS = 16; // ~60fps
  const DRAG_THRESHOLD = 3; // pixels - must move at least this much to be considered a drag

  const sendMoveOverlay = (e) => {
    if (!dragging.current) return;
    
    // Check if mouse moved enough to be considered a drag
    const dx = Math.abs(e.screenX - mouseDownPos.current.x);
    const dy = Math.abs(e.screenY - mouseDownPos.current.y);
    const distanceMoved = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceMoved < DRAG_THRESHOLD && !didDrag.current) {
      // Not enough movement yet, don't start dragging
      return;
    }
    
    // Mark as dragged if mouse moved enough
    if (!didDrag.current) {
      didDrag.current = true;
      setIsDragging(true); // Now we know it's actually a drag
    }
    
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      // Simply set window position to mouse position minus grab offset
      const newX = e.screenX - grabOffset.current.x;
      const newY = e.screenY - grabOffset.current.y;
      ipcRenderer.send('set-overlay-position', { x: newX, y: newY });
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
    setIsDragging(false); // Set state to trigger re-render
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
          // Re-enable mouse forwarding if minimized
          if (isMinimized) {
            ipcRenderer.send('set-mouse-forward', true);
          }
        });
      }
    } else {
      // Simple click - toggle minimize
      const wasMinimized = isMinimized;
      handleMinimizeToggle();
      // Just notify drag ended, no anchor update
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('drag-overlay', false);
        // After minimizing, check if mouse is still over anchor
        if (!wasMinimized) {
          // We just minimized - mouse is still over anchor button (we just clicked it)
          // Don't enable mouse forwarding, leave it off so button is clickable
          ipcRenderer.send('set-mouse-forward', false);
        } else {
          // We just restored to full size - no mouse forwarding
          ipcRenderer.send('set-mouse-forward', false);
        }
      }
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMinimizeToggle = () => {
    if (isMinimized) {
      // Restore
      setIsMinimized(false);
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('set-overlay-minimized', false);
      }
    } else {
      // Minimize
      setIsMinimized(true);
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('set-overlay-minimized', true);
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
        width: isMinimized ? 48 : overlaySize.width,
        height: isMinimized ? 48 : overlaySize.height,
        background: isMinimized ? 'transparent' : 'rgba(30,30,30,0.7)',
        zIndex: 9999,
        pointerEvents: isDragging || !isMinimized ? 'auto' : 'none', // Enable during drag or when expanded
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
          pointerEvents: 'auto', // Only the anchor button captures events
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleAnchorMouseEnter}
        onMouseLeave={handleAnchorMouseLeave}
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
            pointerEvents: 'auto', // Enable pointer events
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
            pointerEvents: 'auto', // Enable pointer events
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
            pointerEvents: 'auto', // Enable pointer events for content area
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
