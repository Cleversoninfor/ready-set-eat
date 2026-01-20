import { useCallback, useEffect, useState } from 'react';

// === GLOBAL SOUND MANAGER ===
let audioContext: AudioContext | null = null;
let isCurrentlyEnabled = localStorage.getItem('notification-sound-enabled') !== 'false';
const listeners = new Set<() => void>();

// Alarm (continuous) state
let alarmPlaying = false;
let alarmNodes:
  | {
      mainOsc: OscillatorNode;
      lfo: OscillatorNode;
      lfoGain: GainNode;
      gain: GainNode;
    }
  | null = null;

function notifyAllListeners() {
  listeners.forEach((fn) => fn());
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function safeResume(ctx: AudioContext) {
  if (ctx.state === 'suspended') {
    // ignore promise rejection (browser policies)
    ctx.resume().catch(() => undefined);
  }
}

function playBeep() {
  try {
    const ctx = getAudioContext();
    safeResume(ctx);

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
        safeResume(ctx2);

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

function startAlarmSound() {
  if (alarmPlaying) return;

  try {
    const ctx = getAudioContext();
    safeResume(ctx);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.connect(ctx.destination);

    // Main very "extridente" tone
    const mainOsc = ctx.createOscillator();
    mainOsc.type = 'square';
    mainOsc.frequency.setValueAtTime(1800, ctx.currentTime);
    mainOsc.connect(gain);

    // Tremolo (LFO) to make it more alarming
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(8, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.25, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    // Ramp volume up quickly
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);

    mainOsc.start();
    lfo.start();

    alarmNodes = { mainOsc, lfo, lfoGain, gain };
    alarmPlaying = true;
  } catch (error) {
    console.error('[Sound] Alarm start error:', error);
  }
}

function stopAlarmSound() {
  if (!alarmPlaying) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (alarmNodes) {
      // fade out
      alarmNodes.gain.gain.cancelScheduledValues(now);
      alarmNodes.gain.gain.setValueAtTime(alarmNodes.gain.gain.value || 0.2, now);
      alarmNodes.gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);

      setTimeout(() => {
        try {
          alarmNodes?.mainOsc.stop();
          alarmNodes?.lfo.stop();
        } catch {
          // ignore
        }

        try {
          alarmNodes?.mainOsc.disconnect();
          alarmNodes?.lfo.disconnect();
          alarmNodes?.lfoGain.disconnect();
          alarmNodes?.gain.disconnect();
        } catch {
          // ignore
        }

        alarmNodes = null;
        alarmPlaying = false;
      }, 90);
    } else {
      alarmPlaying = false;
    }
  } catch (error) {
    console.error('[Sound] Alarm stop error:', error);
    alarmNodes = null;
    alarmPlaying = false;
  }
}

function setGlobalEnabled(enabled: boolean) {
  isCurrentlyEnabled = enabled;
  localStorage.setItem('notification-sound-enabled', String(enabled));
  if (!enabled) stopAlarmSound();
  notifyAllListeners();
}

// === REACT HOOK ===
export function useNotificationSound() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (isCurrentlyEnabled) playBeep();
  }, []);

  const startAlarm = useCallback(() => {
    if (isCurrentlyEnabled) startAlarmSound();
  }, []);

  const stopAlarm = useCallback(() => {
    stopAlarmSound();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setGlobalEnabled(enabled);
  }, []);

  return {
    playNotificationSound,
    startAlarm,
    stopAlarm,
    setEnabled,
    isEnabled: isCurrentlyEnabled,
    isAlarmPlaying: alarmPlaying,
  };
}

