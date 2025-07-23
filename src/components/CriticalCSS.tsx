
import { useEffect } from 'react';

const CriticalCSS = () => {
  useEffect(() => {
    // Preload critical resources
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.href = '/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png';
    preloadLink.as = 'image';
    document.head.appendChild(preloadLink);

    // Preload font
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontLink.as = 'style';
    fontLink.onload = () => {
      fontLink.rel = 'stylesheet';
    };
    document.head.appendChild(fontLink);

    return () => {
      document.head.removeChild(preloadLink);
      document.head.removeChild(fontLink);
    };
  }, []);

  return null;
};

export default CriticalCSS;
