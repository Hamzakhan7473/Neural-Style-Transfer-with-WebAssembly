import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Initializing Neural Style Transfer Engine...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Neural Style Transfer</h1>
        <p>Transform your images with AI-powered artistic styles using WebGPU</p>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <div className="placeholder">
            <h3>🎨 Neural Style Transfer Demo</h3>
            <p>This is a simplified version for testing. The full functionality will be added step by step.</p>
            <div className="features">
              <div className="feature">
                <h4>✅ Rust + WebAssembly Core</h4>
                <p>Built and ready</p>
              </div>
              <div className="feature">
                <h4>✅ React Frontend</h4>
                <p>Running successfully</p>
              </div>
              <div className="feature">
                <h4>🔄 WASM Integration</h4>
                <p>Next step</p>
              </div>
              <div className="feature">
                <h4>🔄 Style Transfer</h4>
                <p>Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
