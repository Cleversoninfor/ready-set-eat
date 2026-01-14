import { useCallback, useEffect, useState } from 'react';

// === GLOBAL SOUND MANAGER ===
let audioContext: AudioContext | null = null;
let isCurrentlyEnabled = localStorage.getItem('notification-sound-enabled') !== 'false';
const listeners = new Set<() => void>();

function notifyAllListeners() {
  listeners.forEach(fn => fn());
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playBeep() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.25);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    // Second beep
    setTimeout(() => {
      try {
        const ctx2 = getAudioContext();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1100, ctx2.currentTime);
        osc2.frequency.setValueAtTime(1320, ctx2.currentTime + 0.1);

        gain2.gain.setValueAtTime(0, ctx2.currentTime);
        gain2.gain.linearRampToValueAtTime(0.4, ctx2.currentTime + 0.02);
        gain2.gain.linearRampToValueAtTime(0.4, ctx2.currentTime + 0.15);
        gain2.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.2);

        osc2.start(ctx2.currentTime);
        osc2.stop(ctx2.currentTime + 0.2);
      } catch (e) {
        console.error('[Sound] Second beep error:', e);
      }
    }, 350);
  } catch (error) {
    console.error('[Sound] Beep error:', error);
  }
}

function setGlobalEnabled(enabled: boolean) {
  isCurrentlyEnabled = enabled;
  localStorage.setItem('notification-sound-enabled', String(enabled));
  notifyAllListeners();
}

// === REACT HOOK ===
export function useNotificationSound() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (isCurrentlyEnabled) playBeep();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setGlobalEnabled(enabled);
  }, []);

  return { 
    playNotificationSound, 
    setEnabled, 
    isEnabled: isCurrentlyEnabled,
  };
}
