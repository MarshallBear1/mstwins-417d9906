import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { analytics } from './lib/analytics';

// Initialize PostHog analytics
analytics.init('phc_your_project_api_key_here', {
  debug: process.env.NODE_ENV === 'development'
});

createRoot(document.getElementById("root")!).render(<App />);
