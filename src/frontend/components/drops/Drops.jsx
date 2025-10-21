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

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#ff9800' }}>📦 Drops Tracker</h2>
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
      </div>
    </div>
  );
};

export default Drops;
