// ──────────────────────────────────────────────
// useDemoPlayback — Scripted Playback Controller
//
// Owns ONLY playback state:
//   - current phase (idle/welcome/playing/paused/complete)
//   - current script index
//   - speed multiplier
//   - timers (useRef)
//
// Owns NOT:
//   - typing text
//   - wizard state
//   - project definition
//   - any application state
//
// The controller behaves like a virtual user.
// It iterates through a declarative DemoScript and
// calls onAction() for each step. The action handler
// lives in App.tsx and translates actions into real
// application calls.
// ──────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from "react";
import type { DemoScript, DemoScriptAction, DemoPlaybackState } from "./types";

// ── Typing callback type ──────────────────────
// The controller fires onChar() for each character.
// The component (InterviewStep) decides how to render it.

export interface TypingController {
  start: (text: string, onChar: (partial: string) => void, onDone: () => void) => void;
  stop: () => void;
  isActive: boolean;
}

// ── Return type ───────────────────────────────

export interface UseDemoPlaybackReturn {
  state: DemoPlaybackState;
  /** Start playback from the beginning */
  start: (script: DemoScript) => void;
  /** Pause playback (preserves position) */
  pause: () => void;
  /** Resume playback from current position */
  resume: () => void;
  /** Restart from the beginning */
  restart: () => void;
  /** Exit demo entirely */
  exit: () => void;
  /** Set playback speed (1x, 2x, 4x) */
  setSpeed: (speed: 1 | 2 | 4) => void;
  /** Advance to the next script action (called by action handler when ready) */
  next: () => void;
  /** The current action being processed */
  currentAction: DemoScriptAction | null;
  /** Typing controller — start/stop character-by-character typing */
  typing: TypingController;
  /** The current script (for reference) */
  script: DemoScript;
  /** Current typed text (updated character-by-character during typing) */
  typingText: string;
}


// ── Typing speed constants ────────────────────

const BASE_CHAR_DELAY = 25; // ms per character at 1x
const PUNCTUATION_DELAY = 120; // extra ms after punctuation
const PUNCTUATION = new Set([".", "!", "?", ",", ";", ":"]);

// ── Hook ──────────────────────────────────────

export function useDemoPlayback(): UseDemoPlaybackReturn {
  const [state, setState] = useState<DemoPlaybackState>({
    phase: "idle",
    currentScriptIndex: 0,
    speed: 1,
  });
  const [typingText, setTypingText] = useState("");

  const scriptRef = useRef<DemoScript>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const cancelledRef = useRef(false);


  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    typingActiveRef.current = false;
  }, []);

  // ── Typing controller ─────────────────────
  // Pure timer-based. Updates typingText state on each character.
  const typing: TypingController = {
    start(text: string, onChar: (partial: string) => void, onDone: () => void) {
      clearTimers();
      typingActiveRef.current = true;
      cancelledRef.current = false;
      const speed = state.speed;
      let i = 0;

      function typeNext() {
        if (!typingActiveRef.current || cancelledRef.current) return;

        if (i >= text.length) {
          typingActiveRef.current = false;
          setTypingText("");
          onDone();
          return;
        }

        const partial = text.slice(0, i + 1);
        setTypingText(partial);
        onChar(partial);
        i++;

        const baseDelay = BASE_CHAR_DELAY / speed;
        const extraDelay = PUNCTUATION.has(text[i - 1]) ? PUNCTUATION_DELAY / speed : 0;
        const jitter = Math.random() * 10; // 0-10ms random jitter

        typingTimerRef.current = setTimeout(typeNext, baseDelay + extraDelay + jitter);
      }

      typeNext();
    },

    stop() {
      typingActiveRef.current = false;
      cancelledRef.current = true;
      setTypingText("");
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    },

    get isActive() {
      return typingActiveRef.current;
    },
  };


  // ── Get current action ────────────────────
  const script = scriptRef.current;
  const currentAction: DemoScriptAction | null =
    script[state.currentScriptIndex] ?? null;

  // ── Start ─────────────────────────────────
  const start = useCallback((newScript: DemoScript) => {
    scriptRef.current = newScript;
    clearTimers();
    cancelledRef.current = false;
    setState({
      phase: "playing",
      currentScriptIndex: 0,
      speed: 1,
    });
  }, [clearTimers]);

  // ── Pause ─────────────────────────────────
  const pause = useCallback(() => {
    clearTimers();
    typing.stop();
    setState((prev) => ({
      ...prev,
      phase: "paused",
    }));
  }, [clearTimers]);

  // ── Resume ────────────────────────────────
  const resume = useCallback(() => {
    cancelledRef.current = false;
    setState((prev) => ({
      ...prev,
      phase: "playing",
    }));
  }, []);

  // ── Restart ───────────────────────────────
  const restart = useCallback(() => {
    clearTimers();
    typing.stop();
    cancelledRef.current = false;
    setState({
      phase: "welcome",
      currentScriptIndex: 0,
      speed: 1,
    });
  }, [clearTimers]);

  // ── Exit ──────────────────────────────────
  const exit = useCallback(() => {
    clearTimers();
    typing.stop();
    cancelledRef.current = true;
    scriptRef.current = [];
    setState({
      phase: "idle",
      currentScriptIndex: 0,
      speed: 1,
    });
  }, [clearTimers]);

  // ── Set speed ─────────────────────────────
  const setSpeed = useCallback((speed: 1 | 2 | 4) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  // ── Next action ───────────────────────────
  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentScriptIndex: prev.currentScriptIndex + 1,
    }));
  }, []);

  return {
    state,
    start,
    pause,
    resume,
    restart,
    exit,
    setSpeed,
    next,
    currentAction,
    typing,
    script,
    typingText,
  };

}
