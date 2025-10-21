import React, { useState, useEffect } from 'react';

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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#ff9800' }}>📦 Drops Tracker</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={copyReplay}
            disabled={copyingReplay}
            style={{
              padding: '8px 16px',
              background: copyingReplay ? '#666' : '#9c27b0',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: copyingReplay ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              opacity: copyingReplay ? 0.6 : 1,
            }}
          >
            {copyingReplay ? '⏳ Copying...' : '🎮 Copy Replay'}
          </button>
          <button
            onClick={openDirectory}
            style={{
              padding: '8px 16px',
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            📂 Open in Explorer
          </button>
          <button
            onClick={loadDrops}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#666' : '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {replayCopyStatus && (
        <div
          style={{
            padding: 12,
            background: replayCopyStatus.includes('✓') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            border: `1px solid ${replayCopyStatus.includes('✓') ? '#4caf50' : '#f44336'}`,
            borderRadius: 4,
            color: replayCopyStatus.includes('✓') ? '#4caf50' : '#f44336',
            marginBottom: 15,
            fontSize: 14,
          }}
        >
          {replayCopyStatus}
        </div>
      )}

      {lastModified && (
        <p style={{ margin: '0 0 15px 0', fontSize: 12, color: '#aaa' }}>
          Last updated: {formatDate(lastModified)}
        </p>
      )}

      {error && (
        <div
          style={{
            padding: 15,
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid #f44336',
            borderRadius: 4,
            color: '#f44336',
            marginBottom: 15,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && !dropsContent && (
        <div style={{ textAlign: 'center', padding: 40, fontSize: 16, color: '#aaa' }}>
          Loading drops...
        </div>
      )}

      {!loading && !dropsContent && !error && (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            border: '2px dashed #555',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 15 }}>📦</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>No Drops Tracked Yet</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#aaa', lineHeight: 1.6 }}>
            The drops.txt file doesn't exist yet.<br />
            Start playing Twilight Ascendant to track your drops!
          </p>
        </div>
      )}

      {!loading && dropsContent && (
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            padding: 15,
            borderRadius: 4,
            border: '1px solid #555',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            scrollbarGutter: 'stable',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: 13,
              fontFamily: 'Consolas, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#fff',
              lineHeight: 1.5,
            }}
          >
            {dropsContent}
          </pre>
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          padding: 15,
          background: 'rgba(33, 150, 243, 0.1)',
          border: '1px solid #2196f3',
          borderRadius: 4,
          fontSize: 12,
          color: '#2196f3',
          lineHeight: 1.6,
        }}
      >
        <strong>ℹ️ Info:</strong> Drops are tracked in the <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 2 }}>drops.txt</code> file 
        in your Twilight Ascendant data directory. The file updates automatically as you play.
        <br /><br />
        <strong>🎮 Copy Replay:</strong> Copies your latest <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 2 }}>LastReplay.w3g</code> to 
        this directory (replaces the previous copy), making it easy to share both drops and replay to Discord!
        Configure the replay directory in Settings if needed.
      </div>
    </div>
  );
};

export default Drops;
