import { createRoot } from 'react-dom/client';
import { App } from './ui/react/App.jsx';
import { Engine } from './core/Engine.js';
import { setLoadingProgress } from './core/LoadingScreen.js';
import './base.css';
import './index.css';

async function main() {
    setLoadingProgress(5, 'Starting React Core...');
    const engine = new Engine();
    
    // Initialize UI Root
    const uiContainer = document.getElementById('ui-root');
    if (!uiContainer) throw new Error('UI Root element not found');
    
    const root = createRoot(uiContainer);
    root.render(<App engine={engine} />);

    setLoadingProgress(10, 'Initializing Engine...');
    await engine.init();
}

main().catch(err => {
    console.error('[VoxelForge] Fatal error:', err);
    const loadingText = document.getElementById('loading-text');
    if (loadingText) loadingText.textContent = 'Error: ' + err.message;
});
