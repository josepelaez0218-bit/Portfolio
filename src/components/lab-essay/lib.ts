import { useEffect, useRef } from "react";
import type { Pointer } from "@/components/lab-story/effects";

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
/** Maps p from [a, b] to [0, 1], clamped. */
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Shared pointer ─────────────────────────────────────────────────────────
// One pointer for the whole essay (mouse or finger), in viewport coords.
// Velocity is the delta of the last move, decayed every frame by the scenes.
export const pointer: Pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };

let listening = false;
export const listenPointer = () => {
  if (listening) return;
  listening = true;
  const set = (x: number, y: number) => {
    if (pointer.active) {
      pointer.vx = x - pointer.x;
      pointer.vy = y - pointer.y;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  };
  window.addEventListener("pointermove", (e) => set(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchstart", (e) => e.touches[0] && set(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener("touchmove", (e) => e.touches[0] && set(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener("touchend", () => (pointer.active = false));
  document.documentElement.addEventListener("pointerleave", () => (pointer.active = false));
};

// ─── Pinned scenes ──────────────────────────────────────────────────────────
/**
 * For a tall wrapper with a sticky, full-viewport stage inside: calls
 * `onFrame(progress)` every animation frame while the wrapper is on screen,
 * where progress is 0 when the stage pins and 1 when it unpins.
 */
export const usePinned = (onFrame: (progress: number) => void) => {
  const wrapperRef = useRef<HTMLElement>(null);
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    listenPointer();
    let raf: number | null = null;
    let inView = false;

    const tick = () => {
      raf = null;
      if (!inView) return;
      const rect = wrapper.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const p = scrollable > 0 ? clamp01(-rect.top / scrollable) : 1;
      frameRef.current(p);
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && raf === null) raf = requestAnimationFrame(tick);
    });
    io.observe(wrapper);
    return () => {
      io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return wrapperRef;
};

/** Canvas sized to its CSS box at device pixel ratio; returns a 2D context in CSS px. */
export const fitCanvas = (canvas: HTMLCanvasElement) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
};

// ─── Sound (opt-in) ─────────────────────────────────────────────────────────
// Tiny Web Audio helper: soft sine blips. Silent until the visitor turns it on.
let audio: AudioContext | null = null;
export const sound = {
  enabled: false,
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      audio ??= new AudioContext();
      void audio.resume();
    }
    return this.enabled;
  },
  blip(freq: number, duration = 0.18, gain = 0.06) {
    if (!this.enabled || !audio) return;
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(gain, t + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp).connect(audio.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  },
};

/** Pentatonic scale, for pleasant blips whatever the input. */
export const PENTATONIC = [220, 247, 277, 330, 370, 440, 494, 554, 659, 740];
