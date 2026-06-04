import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyGlobalOklchPatch } from './utils/oklchPatch.ts';

// Apply the global style sheet oklch-to-rgb patching engine
applyGlobalOklchPatch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
