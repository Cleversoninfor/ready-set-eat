import { useEffect } from 'react';
import { useStoreConfig } from './useStore';

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

function parseHslToHex(hslString: string | null | undefined, fallback: string): string {
  if (!hslString) return fallback;
  
  const match = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (match) {
    const h = parseInt(match[1]);
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    return hslToHex(h, s, l);
  }
  
  return fallback;
}

export function useDynamicManifest() {
  const { data: store } = useStoreConfig();

  useEffect(() => {
    if (!store) return;

    // Get theme color from primary color
    const themeColor = parseHslToHex(store.primary_color, '#f59e0b');
    
    // Build dynamic manifest
    const manifest = {
      name: store.pwa_name || store.name || 'Cardápio Digital',
      short_name: store.pwa_short_name || store.pwa_name?.slice(0, 12) || store.name?.slice(0, 12) || 'Cardápio',
      description: 'Cardápio digital e delivery - Faça seu pedido online',
      start_url: '/',
      display: 'standalone' as const,
      background_color: '#ffffff',
      theme_color: themeColor,
      orientation: 'portrait-primary' as const,
      icons: [] as Array<{ src: string; sizes: string; type: string; purpose: string }>,
      categories: ['food', 'shopping'],
      lang: 'pt-BR'
    };

    // Add icons - use store logo if available, otherwise fallback to default icons
    if (store.logo_url) {
      manifest.icons = [
        {
          src: store.logo_url,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: store.logo_url,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ];
    } else {
      manifest.icons = [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ];
    }

    // Create blob from manifest
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    // Update or create manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      // Store old URL to revoke later
      const oldUrl = manifestLink.href;
      manifestLink.href = manifestUrl;
      
      // Revoke old blob URL if it was a blob
      if (oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
    } else {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = manifestUrl;
      document.head.appendChild(manifestLink);
    }

    // Update apple-touch-icon with store logo
    if (store.logo_url) {
      let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (appleTouchIcon) {
        appleTouchIcon.href = store.logo_url;
      } else {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = store.logo_url;
        document.head.appendChild(appleTouchIcon);
      }
    }

    // Cleanup function
    return () => {
      // Don't revoke on cleanup as the manifest needs to stay active
    };
  }, [store]);
}
