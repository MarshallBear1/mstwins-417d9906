import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { analytics } from './lib/analytics';

// Initialize PostHog analytics only if API key is provided
const posthogKey = 'phc_your_project_api_key_here';
if (posthogKey !== 'phc_your_project_api_key_here') {
  analytics.init(posthogKey, {
    debug: process.env.NODE_ENV === 'development'
  });
} else {
  console.log('📊 PostHog analytics disabled - replace API key in main.tsx to enable');
}

createRoot(document.getElementById("root")!).render(<App />);
