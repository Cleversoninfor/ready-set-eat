import { useEffect } from 'react';
import { useStoreConfig } from './useStore';
import { useDynamicManifest } from './useDynamicManifest';

// Convert HSL string like "45 100% 51%" to proper CSS variable value
function parseHslColor(color: string | null | undefined, fallback: string): string {
  if (!color) return fallback;
  // Already in correct format (H S% L%)
  return color;
}

export function useTheme() {
  const { data: store } = useStoreConfig();
  
  // Use dynamic manifest hook to update PWA manifest
  useDynamicManifest();

  useEffect(() => {
    if (!store) return;

    const root = document.documentElement;

    // Apply primary color
    if (store.primary_color) {
      root.style.setProperty('--primary', parseHslColor(store.primary_color, '45 100% 51%'));
      root.style.setProperty('--ring', parseHslColor(store.primary_color, '45 100% 51%'));
      root.style.setProperty('--sidebar-ring', parseHslColor(store.primary_color, '45 100% 51%'));
    }

    // Apply secondary color
    if (store.secondary_color) {
      root.style.setProperty('--secondary', parseHslColor(store.secondary_color, '142 76% 49%'));
      root.style.setProperty('--whatsapp', parseHslColor(store.secondary_color, '142 76% 49%'));
    }

    // Apply accent color
    if (store.accent_color) {
      root.style.setProperty('--accent', parseHslColor(store.accent_color, '45 100% 95%'));
    }

    // Update theme-color meta tag
    if (store.primary_color) {
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        // Convert HSL to approximate hex for theme-color
        const hslMatch = store.primary_color.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
        if (hslMatch) {
          const h = parseInt(hslMatch[1]);
          const s = parseInt(hslMatch[2]) / 100;
          const l = parseInt(hslMatch[3]) / 100;
          const hex = hslToHex(h, s, l);
          themeColorMeta.setAttribute('content', hex);
        }
      }
    }

    // Update document title and apple-mobile-web-app-title
    if (store.pwa_name || store.name) {
      document.title = store.pwa_name || store.name || 'Cardápio';
      
      // Update apple-mobile-web-app-title
      const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitleMeta) {
        appleTitleMeta.setAttribute('content', store.pwa_short_name || store.pwa_name || store.name || 'Cardápio');
      }
    }

  }, [store]);
}

// Helper function to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
