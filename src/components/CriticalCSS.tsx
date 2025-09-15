
import { useEffect } from 'react';

const CriticalCSS = () => {
  useEffect(() => {
    // Preload critical resources
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.href = '/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png';
    preloadLink.as = 'image';
    document.head.appendChild(preloadLink);

    // Async load main stylesheet to prevent render blocking
    const mainStylesheet = document.createElement('link');
    mainStylesheet.rel = 'preload';
    mainStylesheet.href = '/src/index.css';
    mainStylesheet.as = 'style';
    mainStylesheet.onload = () => {
      mainStylesheet.rel = 'stylesheet';
    };
    document.head.appendChild(mainStylesheet);

    // Preload and async load font
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontLink.as = 'style';
    fontLink.crossOrigin = 'anonymous';
    fontLink.onload = () => {
      fontLink.rel = 'stylesheet';
    };
    document.head.appendChild(fontLink);

    // Add critical CSS inline for immediate render
    const criticalStyles = document.createElement('style');
    criticalStyles.innerHTML = `
      /* Critical above-the-fold styles */
      * { box-sizing: border-box; }
      body { 
        font-family: system-ui, -apple-system, sans-serif; 
        margin: 0; 
        background: #ffffff;
        color: #0f172a;
        line-height: 1.5;
      }
      .header { 
        position: fixed; 
        top: 0; 
        width: 100%; 
        z-index: 50; 
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
      }
      .hero { 
        min-height: 100vh; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      @media (max-width: 768px) {
        .hero { padding: 1rem; }
      }
    `;
    document.head.appendChild(criticalStyles);

    return () => {
      try {
        if (document.head.contains(preloadLink)) document.head.removeChild(preloadLink);
        if (document.head.contains(mainStylesheet)) document.head.removeChild(mainStylesheet);
        if (document.head.contains(fontLink)) document.head.removeChild(fontLink);
        if (document.head.contains(criticalStyles)) document.head.removeChild(criticalStyles);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  return null;
};

export default CriticalCSS;
