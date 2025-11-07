import React, { useEffect, useState, useRef } from "react";
import type { IpcRenderer } from "./types/electron";
import styles from "./Overlay.module.css";
import AccountList from "./components/character/AccountList";
import CharacterList from "./components/character/CharacterList";
import CharacterData from "./components/character/CharacterData";
import TabNavigation from "./components/common/TabNavigation";
import Drops from "./components/drops/Drops";
import Guide from "./components/guide/Guide";
import Settings from "./components/settings/Settings";
import { useAccountCharacterNavigation } from "./hooks/useAccountCharacterNavigation";
import { Button, IconButton } from "./components/common/buttons";
import { GuideNavigationProvider } from "./contexts/GuideNavigationContext";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface OverlayProps {
  visible: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ visible }) => {
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

  const [overlaySize, setOverlaySize] = useState<Size>({
    width: 450,
    height: 350,
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("loader");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [overlayScale, setOverlayScale] = useState<number>(1);
  const [guideUrl, setGuideUrl] = useState<string | undefined>(undefined);

  // Debug: log when isMinimized changes
  useEffect(() => {
    console.log("[Overlay] isMinimized state changed to:", isMinimized);
  }, [isMinimized]);
  const dragging = useRef<boolean>(false);
  const grabOffset = useRef<Position>({ x: 0, y: 0 }); // Offset from overlay top-left to initial click position
  const resizing = useRef<boolean>(false);
  const resizeStart = useRef<Position>({ x: 0, y: 0 });
  const sizeStart = useRef<Size>({ width: 450, height: 350 });
  const isHoveringAnchor = useRef<boolean>(false); // Track if mouse is over anchor
  const mouseDownPos = useRef<Position>({ x: 0, y: 0 }); // Track initial mouse position
  const lastMinimizeToggleTime = useRef<number>(0); // Track last minimize toggle time
  const MINIMIZE_COOLDOWN_MS = 0; // Minimum time between minimize toggles (disabled)

  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: IpcRenderer;
      };

      // Load saved overlay size from settings
      ipcRenderer.invoke("get-ui-settings").then((settings: any) => {
        if (settings.overlaySize) {
          setOverlaySize(settings.overlaySize);
          sizeStart.current = settings.overlaySize;
          // Resize the window to match saved size
          ipcRenderer.send("resize-overlay", settings.overlaySize);
        } else {
          // On mount, resize the window to match the default overlay size
          ipcRenderer.send("resize-overlay", {
            width: overlaySize.width,
            height: overlaySize.height,
          });
        }
      });

      // Load overlay scale from settings
      ipcRenderer.invoke("get-overlay-scale").then((scale: number) => {
        setOverlayScale(scale);
      });

      ipcRenderer.on("set-anchor", (_event: any, anchorPos: Position) => {
        // Update anchor position if needed in future
        console.log("Anchor updated:", anchorPos);
      });
      ipcRenderer.on("set-overlay-size", (_event: any, size: Size) => {
        setOverlaySize(size);
      });
      ipcRenderer.on("toggle-overlay-minimize", () => {
        setIsMinimized((prev) => {
          const newState = !prev;
          ipcRenderer.send("set-overlay-minimized", newState);
          return newState;
        });
      });

      // Listen for overlay scale changes
      ipcRenderer.on("overlay-scale-changed", (_event: any, scale: number) => {
        console.log("Overlay scale changed:", scale);
        setOverlayScale(scale);
      });

      return () => {
        ipcRenderer.removeAllListeners("set-anchor");
        ipcRenderer.removeAllListeners("set-overlay-size");
        ipcRenderer.removeAllListeners("toggle-overlay-minimize");
        ipcRenderer.removeAllListeners("overlay-scale-changed");
      };
    }
    return undefined;
  }, []);

  const didDrag = useRef<boolean>(false);

  const handleAnchorMouseEnter = () => {
    isHoveringAnchor.current = true;
    if (isMinimized && window.require && !dragging.current) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: IpcRenderer;
      };
      // Stop forwarding mouse events when hovering over anchor
      ipcRenderer.send("set-mouse-forward", false);
    }
  };

  const handleAnchorMouseLeave = () => {
    isHoveringAnchor.current = false;
    if (isMinimized && window.require && !dragging.current) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: IpcRenderer;
      };
      // Resume forwarding mouse events when not hovering
      ipcRenderer.send("set-mouse-forward", true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent drag if we just toggled minimize recently
    const timeSinceLastToggle = Date.now() - lastMinimizeToggleTime.current;
    if (timeSinceLastToggle < MINIMIZE_COOLDOWN_MS) {
      console.log("Ignoring mousedown - too soon after minimize toggle");
      return;
    }

    dragging.current = true;
    didDrag.current = false;
    mouseDownPos.current = { x: e.screenX, y: e.screenY }; // Store initial position
    console.log("Mouse down at:", mouseDownPos.current);

    if (window.require) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: IpcRenderer;
      };

      // Calculate where the user clicked relative to the overlay window
      // This is the offset we'll maintain during dragging
      const pos = ipcRenderer.sendSync("get-overlay-position-sync") as Position;
      grabOffset.current = {
        x: e.screenX - pos.x,
        y: e.screenY - pos.y,
      };
      console.log("Grab offset:", grabOffset.current);

      // Disable mouse forwarding when potentially dragging
      ipcRenderer.send("set-mouse-forward", false);
      ipcRenderer.send("drag-overlay", true);
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastMoveEvent = useRef<MouseEvent | null>(null);
  const DEBOUNCE_MS = 16; // ~60fps
  const DRAG_THRESHOLD = 3; // pixels - must move at least this much to be considered a drag

  const sendMoveOverlay = (e: MouseEvent) => {
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
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: IpcRenderer;
      };
      // Position overlay at mouse cursor minus the initial grab offset
      // This maintains the relative position where the user clicked
      const newX = e.screenX - grabOffset.current.x;
      const newY = e.screenY - grabOffset.current.y;
      ipcRenderer.send("set-overlay-position", { x: newX, y: newY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    lastMoveEvent.current = e;
    if (moveTimeout.current) return;
    moveTimeout.current = setTimeout(() => {
      if (lastMoveEvent.current) {
        sendMoveOverlay(lastMoveEvent.current);
      }
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
        const { ipcRenderer } = window.require("electron") as {
          ipcRenderer: IpcRenderer;
        };
        Promise.all([
          ipcRenderer.invoke("get-overlay-position") as Promise<Position>,
          ipcRenderer.invoke("get-warcraft-position") as Promise<Position>,
        ]).then(([overlayPos, warcraftPos]) => {
          if (overlayPos && warcraftPos) {
            const newAnchor = {
              x: overlayPos.x - warcraftPos.x,
              y: overlayPos.y - warcraftPos.y,
            };
            ipcRenderer.send("anchor-changed", newAnchor);
          }
          ipcRenderer.send("drag-overlay", false); // Notify main process drag ended
          // Re-enable mouse forwarding if minimized
          if (isMinimized) {
            ipcRenderer.send("set-mouse-forward", true);
          }
        });
      }
    } else {
      // Simple click - toggle minimize
      lastMinimizeToggleTime.current = Date.now(); // Record toggle time
      const wasMinimized = isMinimized;
      handleMinimizeToggle();
      // Just notify drag ended, no anchor update
      if (window.require) {
        const { ipcRenderer } = window.require("electron") as {
          ipcRenderer: IpcRenderer;
        };
        ipcRenderer.send("drag-overlay", false);
        // After minimizing, check if mouse is still over anchor
        if (!wasMinimized) {
          // We just minimized - mouse is still over anchor button (we just clicked it)
          // Don't enable mouse forwarding, leave it off so button is clickable
          ipcRenderer.send("set-mouse-forward", false);
        } else {
          // We just restored to full size - no mouse forwarding
          ipcRenderer.send("set-mouse-forward", false);
        }
      }
    }
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMinimizeToggle = () => {
    if (isMinimized) {
      // Restore
      setIsMinimized(false);
      if (window.require) {
        const { ipcRenderer } = window.require("electron") as {
          ipcRenderer: IpcRenderer;
        };
        ipcRenderer.send("set-overlay-minimized", false);
      }
    } else {
      // Minimize
      setIsMinimized(true);
      if (window.require) {
        const { ipcRenderer } = window.require("electron") as {
          ipcRenderer: IpcRenderer;
        };
        ipcRenderer.send("set-overlay-minimized", true);
      }
    }
  };

  const handleQuickLoad = async (characterName: string) => {
    if (!window.require || !selectedAccount) return;

    const { ipcRenderer } = window.require("electron") as {
      ipcRenderer: IpcRenderer;
    };

    try {
      // Get character data
      const data = await ipcRenderer.invoke(
        "get-character-data",
        selectedAccount,
        characterName
      );

      // Send load command
      const result = await ipcRenderer.invoke(
        "send-load-command",
        data,
        selectedAccount,
        characterName
      );

      if (!result.success) {
        alert(`Failed to load character: ${result.error}`);
      }
    } catch (error) {
      console.error("Quick load error:", error);
      alert("Failed to load character");
    }
  };

  const navigateToGuide = (url: string) => {
    setGuideUrl(url);
    setActiveTab("guide");
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { ...overlaySize };
    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!resizing.current) return;
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const newWidth = sizeStart.current.width + dx;
    const newHeight = sizeStart.current.height + dy;
    setOverlaySize({ width: newWidth, height: newHeight });
    if (window.require) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: IpcRenderer;
      };
      ipcRenderer.send("resize-overlay", {
        width: newWidth,
        height: newHeight,
      });
    }
  };

  const handleResizeMouseUp = () => {
    resizing.current = false;
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  if (!visible) return null;

  if (!visible) return null;

  return (
    <div
      className={styles.overlayContainer}
      style={{
        width: isMinimized ? 48 : overlaySize.width,
        height: isMinimized ? 48 : overlaySize.height,
        background: isMinimized ? "transparent" : "rgba(30,30,30,0.95)",
        pointerEvents: isDragging || !isMinimized ? "auto" : "none",
      }}
    >
      <div
        className={styles.overlayZoomContainer}
        style={{ zoom: overlayScale }}
      >
        <div
          className={styles.anchor}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleAnchorMouseEnter}
          onMouseLeave={handleAnchorMouseLeave}
          title={
            isMinimized
              ? "Click to restore, drag to move"
              : "Click to minimize, drag to move"
          }
        >
          {isMinimized ? "□" : "+"}
        </div>
        {!isMinimized && (
          <>
            {showSettings ? (
              <>
                {/* Settings view */}
                <Button
                  className={styles.backButtonSettings}
                  onClick={() => setShowSettings(false)}
                  variant="secondary"
                  size="medium"
                  title="Back"
                >
                  ← Back
                </Button>
                <div
                  className={styles.resizeHandle}
                  onMouseDown={handleResizeMouseDown}
                  title="Resize overlay"
                >
                  ↘
                </div>
                <div className={styles.contentAreaSettings}>
                  <Settings
                    onBack={() => setShowSettings(false)}
                    showBackButton={false}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Main overlay view */}
                {/* Tab Navigation */}
                <div className={styles.tabSection}>
                  <TabNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                  <IconButton
                    onClick={() => setShowSettings(true)}
                    className={styles.settingsButton}
                    variant="ghost"
                    size="medium"
                    icon="⚙️"
                    title="Settings"
                  />
                </div>

                {/* Universal back button - shows when navigating in characters */}
                {activeTab === "loader" && selectedAccount && (
                  <Button
                    className={styles.backButtonOverlay}
                    onClick={handleBackClick}
                    variant="secondary"
                    size="medium"
                    title="Back"
                  >
                    ← Back
                  </Button>
                )}

                <div
                  className={styles.resizeHandle}
                  onMouseDown={handleResizeMouseDown}
                  title="Resize overlay"
                >
                  ↘
                </div>

                <div
                  className={
                    activeTab === "loader" && selectedAccount
                      ? styles.contentArea
                      : styles.contentAreaNoBack
                  }
                >
                  <GuideNavigationProvider navigateToGuide={navigateToGuide}>
                    {activeTab === "loader" && (
                      <>
                        {selectedCharacter ? (
                          <CharacterData
                            accountName={selectedAccount!}
                            characterName={selectedCharacter}
                            characterData={characterData}
                            onBack={handleBackClick}
                            onLoad={() => loadCharacterData()}
                            showBackButton={false}
                          />
                        ) : selectedAccount ? (
                          <CharacterList
                            accountName={selectedAccount}
                            characters={characters}
                            onBack={handleBackClick}
                            onCharacterClick={handleCharacterClick}
                            onLoad={handleQuickLoad}
                            showBackButton={false}
                          />
                        ) : (
                          <>
                            <h2 className={styles.accountsTitle}>Accounts</h2>
                            <AccountList
                              accounts={accounts}
                              onAccountClick={handleAccountClick}
                            />
                          </>
                        )}
                      </>
                    )}
                    {activeTab === "drops" && <Drops />}
                    {activeTab === "guide" && <Guide url={guideUrl} />}
                  </GuideNavigationProvider>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Overlay;
