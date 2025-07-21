import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { analytics } from './lib/analytics';

// Initialize PostHog analytics
analytics.init('phc_MwlAhPZQdeGDHM1oPhMMEPSr75W6F1kxn94kGaAsQj2', {
  debug: process.env.NODE_ENV === 'development'
});

createRoot(document.getElementById("root")!).render(<App />);
