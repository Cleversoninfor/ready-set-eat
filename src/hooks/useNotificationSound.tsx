import { useCallback, useEffect, useState } from 'react';

// === GLOBAL SOUND MANAGER ===
let audioContext: AudioContext | null = null;
let isCurrentlyEnabled = localStorage.getItem('notification-sound-enabled') !== 'false';
const listeners = new Set<() => void>();

// Alarm state
let alarmPlaying = false;

// We use multiple timeouts (on + off) per cycle; keep track so we can reliably stop.
const alarmTimeoutIds = new Set<ReturnType<typeof setTimeout>>();

let currentAlarmNodes: {
  mainOsc: OscillatorNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  gain: GainNode;
} | null = null;

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
    ctx.resume().catch(() => undefined);
  }
}

function clearAlarmTimeouts() {
  alarmTimeoutIds.forEach((id) => clearTimeout(id));
  alarmTimeoutIds.clear();
}

function stopCurrentBurst() {
  if (!currentAlarmNodes) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    currentAlarmNodes.gain.gain.cancelScheduledValues(now);
    currentAlarmNodes.gain.gain.setValueAtTime(currentAlarmNodes.gain.gain.value || 0.2, now);
    currentAlarmNodes.gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);

    const nodesToClean = currentAlarmNodes;
    setTimeout(() => {
      try {
        nodesToClean.mainOsc.stop();
        nodesToClean.lfo.stop();
        nodesToClean.mainOsc.disconnect();
        nodesToClean.lfo.disconnect();
        nodesToClean.lfoGain.disconnect();
        nodesToClean.gain.disconnect();
      } catch {
        // ignore
      }
    }, 60);

    currentAlarmNodes = null;
  } catch (error) {
    console.error('[Sound] Stop burst error:', error);
  }
}

function playBurst() {
  if (!alarmPlaying || currentAlarmNodes) return;

  try {
    const ctx = getAudioContext();
    safeResume(ctx);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.connect(ctx.destination);

    const mainOsc = ctx.createOscillator();
    mainOsc.type = 'square';
    mainOsc.frequency.setValueAtTime(1800, ctx.currentTime);
    mainOsc.connect(gain);

    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(8, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.25, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);

    mainOsc.start();
    lfo.start();

    currentAlarmNodes = { mainOsc, lfo, lfoGain, gain };
  } catch (error) {
    console.error('[Sound] Play burst error:', error);
  }
}

function runAlarmCycle() {
  if (!alarmPlaying) return;

  // Play for 1.5 seconds
  playBurst();

  const stopId = setTimeout(() => {
    if (!alarmPlaying) return;
    stopCurrentBurst();

    // Pause for 1 second, then repeat
    const nextId = setTimeout(() => {
      if (alarmPlaying) runAlarmCycle();
    }, 1000);

    alarmTimeoutIds.add(nextId);
  }, 1500);

  alarmTimeoutIds.add(stopId);
}

function startAlarmSound() {
  if (alarmPlaying) return;
  if (!isCurrentlyEnabled) return;

  // Safety: clear any leftover timers from past cycles
  clearAlarmTimeouts();

  alarmPlaying = true;
  runAlarmCycle();
  notifyAllListeners();
}

function stopAlarmSound() {
  if (!alarmPlaying) return;

  alarmPlaying = false;
  clearAlarmTimeouts();
  stopCurrentBurst();
  notifyAllListeners();
}

function setGlobalEnabled(enabled: boolean) {
  isCurrentlyEnabled = enabled;
  localStorage.setItem('notification-sound-enabled', String(enabled));
  if (!enabled) {
    stopAlarmSound();
  }
  notifyAllListeners();
}

function getIsAlarmPlaying() {
  return alarmPlaying;
}

function getIsEnabled() {
  return isCurrentlyEnabled;
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

  const startAlarm = useCallback(() => {
    startAlarmSound();
  }, []);

  const stopAlarm = useCallback(() => {
    stopAlarmSound();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setGlobalEnabled(enabled);
  }, []);

  return {
    startAlarm,
    stopAlarm,
    setEnabled,
    isEnabled: getIsEnabled(),
    isAlarmPlaying: getIsAlarmPlaying(),
  };
}

