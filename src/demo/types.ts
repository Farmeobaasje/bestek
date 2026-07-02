// ──────────────────────────────────────────────
// Demo types — Replayable Wizard Session
// ──────────────────────────────────────────────

import type { TourStep } from "../components/GuidedTour/types";
import type { WizardStep } from "../hooks/useWizard";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";

// ── Declarative Demo Script ───────────────────

export type DemoScriptAction =
  | { action: "ask"; topic: string }
  | { action: "answer"; text: string }
  | { action: "goto"; step: WizardStep }
  | { action: "run-architecture" }
  | { action: "pause"; duration: number }
  | { action: "complete" };

export type DemoScript = DemoScriptAction[];

// ── Playback phases ───────────────────────────

export type DemoPlaybackPhase =
  | "idle"
  | "welcome"
  | "playing"
  | "paused"
  | "complete";

// ── Demo Scenario ─────────────────────────────

export interface DemoScenario {
  id: string;
  name: string;
  metadata: {
    tagline: string;
    category: string;
  };
  project: {
    prompt: string;
    name: string;
    tagline: string;
  };
  interview: DemoInterviewStep[];
  /** Declarative playback script */
  script: DemoScript;
  /** Pre-canned architecture result (avoids LLM call during demo) */
  demoArchitecture?: ArchitectureAnalysis;
  /** Legacy tooltips — kept for backward compatibility */
  tooltips: DemoStepTooltip[];
  /** Guided Tour steps for premium onboarding experience */
  tourSteps?: TourStep[];
}

export interface DemoInterviewStep {
  /** Matches interviewTopics id (e.g. "vision", "target-users") */
  topic: string;
  /** Scripted AI question text */
  question: string;
  /** Scripted user answer text */
  answer: string;
  /** Delay in ms before the answer appears (after question finishes typing) */
  delay: number;
  /** Typing speed in ms per character (0 = instant) */
  typingSpeed?: number;
}

export interface DemoStepTooltip {
  /** After which interview step index this tooltip appears */
  afterStep: number;
  /** Tooltip text */
  text: string;
  /** Auto-dismiss delay in ms */
  duration: number;
}

export type SessionMode = "live" | "demo";

// ── Playback state (owned by useDemoPlayback) ─

export interface DemoPlaybackState {
  phase: DemoPlaybackPhase;
  currentScriptIndex: number;
  speed: 1 | 2 | 4;
}
