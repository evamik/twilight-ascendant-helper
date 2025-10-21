import React, { useState, useEffect } from 'react';
import styles from './Drops.module.css';

const { ipcRenderer } = window.require ? window.require('electron') : {};

/**
 * Drops Component
 * Displays the content of drops.txt file from the Twilight Ascendant data directory
 */
const Drops = () => {
  const [dropsContent, setDropsContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastModified, setLastModified] = useState(null);
  const [copyingReplay, setCopyingReplay] = useState(false);
  const [replayCopyStatus, setReplayCopyStatus] = useState('');

  // Load drops content on mount
  useEffect(() => {
    loadDrops();
  }, []);

  const loadDrops = async () => {
    if (!ipcRenderer) {
      setError('IPC Renderer not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await ipcRenderer.invoke('get-drops');
      
      if (result.success) {
        setDropsContent(result.content);
        setLastModified(result.lastModified);
        if (result.message) {
          // File doesn't exist yet
          setError(null);
        }
      } else {
        setError(result.error || 'Failed to load drops');
      }
    } catch (err) {
      console.error('Error loading drops:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  };

  const openDirectory = async () => {
    if (!ipcRenderer) return;
    
    try {
      const result = await ipcRenderer.invoke('open-drops-directory');
      if (!result.success) {
        console.error('Failed to open directory:', result.error);
      }
    } catch (err) {
      console.error('Error opening directory:', err);
    }
  };

  const copyReplay = async () => {
    if (!ipcRenderer) return;
    
    try {
      setCopyingReplay(true);
      setReplayCopyStatus('');
      
      const result = await ipcRenderer.invoke('copy-latest-replay');
      
      if (result.success) {
        setReplayCopyStatus(`✓ ${result.message}`);
        setTimeout(() => setReplayCopyStatus(''), 5000);
      } else {
        setReplayCopyStatus(`✗ ${result.error}`);
        setTimeout(() => setReplayCopyStatus(''), 5000);
      }
    } catch (err) {
      console.error('Error copying replay:', err);
      setReplayCopyStatus(`✗ ${err.message}`);
      setTimeout(() => setReplayCopyStatus(''), 5000);
    } finally {
      setCopyingReplay(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📦 Drops Tracker</h2>
        <div className={styles.buttonGroup}>
          <button
            onClick={copyReplay}
            disabled={copyingReplay}
            className={copyingReplay ? styles.copyReplayButtonDisabled : styles.copyReplayButton}
          >
            {copyingReplay ? '⏳ Copying...' : '🎮 Copy Replay'}
          </button>
          <button
            onClick={openDirectory}
            className={styles.openExplorerButton}
          >
            📂 Open in Explorer
          </button>
          <button
            onClick={loadDrops}
            disabled={loading}
            className={loading ? styles.refreshButtonDisabled : styles.refreshButton}
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {replayCopyStatus && (
        <div className={replayCopyStatus.includes('✓') ? styles.success : styles.error}>
          {replayCopyStatus}
        </div>
      )}

      {lastModified && (
        <p className={styles.lastModified}>
          Last updated: {formatDate(lastModified)}
        </p>
      )}

      {error && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && !dropsContent && (
        <div className={styles.loadingMessage}>
          Loading drops...
        </div>
      )}

      {!loading && !dropsContent && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📦</div>
          <h3 className={styles.emptyStateTitle}>No Drops Tracked Yet</h3>
          <p className={styles.emptyStateText}>
            The drops.txt file doesn't exist yet.<br />
            Start playing Twilight Ascendant to track your drops!
          </p>
        </div>
      )}

      {!loading && dropsContent && (
        <div className={styles.dropsContent}>
          <pre className={styles.dropsText}>
            {dropsContent}
          </pre>
        </div>
      )}

      <div className={styles.infoBox}>
        <strong>ℹ️ Info:</strong> Drops are tracked in the <code>drops.txt</code> file 
        in your Twilight Ascendant data directory. The file updates automatically as you play.
        <br /><br />
        <strong>🎮 Copy Replay:</strong> Copies your latest <code>LastReplay.w3g</code> to 
        this directory (replaces the previous copy), making it easy to share both drops and replay to Discord!
        Configure the replay directory in Settings if needed.
      </div>
    </div>
  );
};

export default Drops;
