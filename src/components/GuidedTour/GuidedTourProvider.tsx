// ──────────────────────────────────────────────
// GuidedTourProvider — Tour state machine orchestrator
// Manages tour lifecycle: welcome → steps → completion
// Integrates with demo playback via currentDemoStepIndex
//
// Flow:
//   1. Welcome card appears
//   2. User clicks "Start walkthrough" → shows first tour card
//   3. User clicks "Watch the Demo" → starts scripted playback
//   4. Tour cards hide during playback
//   5. After all 11 topics complete → completion card
//   6. User clicks "Continue to Project Overview" → navigates to step 4
// ──────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { TourStep, TourState, GuidedTourConfig } from "./types";
import TourStepComponent from "./TourStep";
import TourHighlight from "./TourHighlight";
import WelcomeCard from "./WelcomeCard";
import CompletionCard from "./CompletionCard";

interface GuidedTourProviderProps {
  /** Tour configuration */
  config: GuidedTourConfig;
  /** Project name for welcome/completion cards */
  projectName: string;
  /** Project tagline for welcome card */
  projectTagline: string;
  /** Current demo step index (0-based) — used to trigger tour steps */
  currentDemoStepIndex: number;
  /** Whether the demo interview is complete */
  interviewComplete: boolean;
  /** Called when user clicks "Start walkthrough" on welcome card */
  onStartWalkthrough: () => void;
  /** Called when user clicks "Watch the Demo" on the first tour step */
  onStartDemo: () => void;
  /** Called when user clicks action button on non-first tour steps */
  onResumeDemo: () => void;
  /** Called when user exits the demo */
  onExitDemo: () => void;
  /** Called when user clicks "Finish the demo" on the last tour step */
  onFinishDemo?: () => void;
  /** Called when user clicks "Continue to Project Overview" on the completion card */
  onContinue?: () => void;
  /** Number of topics covered (for completion card) */
  topicCount: number;
  /** Children — the actual UI content */
  children: ReactNode;
  /** When true, auto-dismiss welcome/completion cards after a delay */
  autoAdvance?: boolean;
  /** Whether demo playback is currently active (hides tour cards) */
  isDemoPlaying?: boolean;
}

export default function GuidedTourProvider({
  config,
  projectName,
  projectTagline,
  currentDemoStepIndex,
  interviewComplete,
  onStartWalkthrough,
  onStartDemo,
  onResumeDemo,
  onExitDemo,
  onFinishDemo,
  onContinue,
  topicCount,
  children,
  autoAdvance = false,
  isDemoPlaying = false,
}: GuidedTourProviderProps) {
  const [tourState, setTourState] = useState<TourState>({
    isActive: config.autoStart,
    currentStepIndex: 0,
    showWelcome: config.autoStart,
    showCompletion: false,
    isPaused: false,
  });

  // Track which steps have been shown to prevent re-triggering
  const shownStepsRef = useRef<Set<number>>(new Set());

  // ── Auto-advance welcome ────────────────────
  // When autoAdvance is true, dismiss welcome after 2s
  useEffect(() => {
    if (!autoAdvance || !tourState.showWelcome) return;

    const timer = setTimeout(() => {
      setTourState((prev) => ({
        ...prev,
        showWelcome: false,
        isPaused: false,
      }));
      onStartWalkthrough();
    }, 2000);

    return () => clearTimeout(timer);
  }, [autoAdvance, tourState.showWelcome, onStartWalkthrough]);

  // ── Auto-advance completion ─────────────────
  // When autoAdvance is true, dismiss completion after 2s
  useEffect(() => {
    if (!autoAdvance || !tourState.showCompletion) return;

    const timer = setTimeout(() => {
      setTourState((prev) => ({
        ...prev,
        showCompletion: false,
        isPaused: false,
      }));
      onContinue?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [autoAdvance, tourState.showCompletion, onContinue]);

  // ── Step trigger logic ──────────────────────
  // Watch currentDemoStepIndex and trigger tour steps when
  // the interview reaches the triggerAfterStep threshold.
  // Only triggers when demo is NOT playing (tour cards hidden during playback).
  useEffect(() => {
    if (!tourState.isActive || tourState.showWelcome || tourState.showCompletion) return;
    if (isDemoPlaying) return; // Don't trigger tour steps during playback

    const steps = config.steps;
    if (steps.length === 0) return;

    // Find the next step to trigger based on currentDemoStepIndex
    const nextStepIndex = steps.findIndex((step, i) => {
      return (
        i > tourState.currentStepIndex &&
        !shownStepsRef.current.has(i) &&
        currentDemoStepIndex >= step.triggerAfterStep
      );
    });

    if (nextStepIndex !== -1) {
      shownStepsRef.current.add(nextStepIndex);
      setTourState((prev) => ({
        ...prev,
        currentStepIndex: nextStepIndex,
        isPaused: true,
      }));
    }
  }, [currentDemoStepIndex, tourState.isActive, tourState.showWelcome, tourState.showCompletion, tourState.currentStepIndex, config.steps, isDemoPlaying]);

  // ── Completion trigger ──────────────────────
  // Show completion card when interview is complete
  useEffect(() => {
    if (interviewComplete && tourState.isActive && !tourState.showCompletion) {
      setTourState((prev) => ({
        ...prev,
        showCompletion: true,
        isPaused: true,
      }));
    }
  }, [interviewComplete, tourState.isActive, tourState.showCompletion]);

  // ── Action handler ──────────────────────────
  // Called when user clicks the action button on a tour step
  const handleStepAction = useCallback(() => {
    const steps = config.steps;
    const currentStep = steps[tourState.currentStepIndex];

    if (!currentStep) return;

    const isFirstStep = tourState.currentStepIndex === 0;
    const isLastStep = tourState.currentStepIndex >= steps.length - 1;

    if (isFirstStep) {
      // First step — "Watch the Demo" — start the full demo playback
      onStartDemo();
      setTourState((prev) => ({
        ...prev,
        isPaused: false,
      }));
    } else if (isLastStep) {
      // Last step — "Finish the demo" — only valid if interview is complete
      if (interviewComplete) {
        onFinishDemo?.();
        setTourState((prev) => ({
          ...prev,
          isPaused: false,
        }));
      }
    } else {
      // Middle steps — resume demo playback briefly
      onResumeDemo();

      // Advance to the next tour step
      setTourState((prev) => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
        isPaused: false,
      }));
    }
  }, [config.steps, tourState.currentStepIndex, tourState.currentStepIndex === 0, onStartDemo, onResumeDemo, onFinishDemo, interviewComplete]);

  // ── Skip handler ────────────────────────────
  const handleSkip = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      isActive: false,
      showWelcome: false,
      showCompletion: false,
      isPaused: false,
    }));
  }, []);

  // ── Welcome handlers ────────────────────────
  const handleStartWalkthrough = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      showWelcome: false,
      isPaused: false,
    }));
    // Do NOT start demo playback here — just show the first tour card
  }, []);

  const handleExitFromWelcome = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      isActive: false,
      showWelcome: false,
      isPaused: false,
    }));
    onExitDemo();
  }, [onExitDemo]);

  // ── Completion handlers ─────────────────────
  const handleContinueFromCompletion = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      showCompletion: false,
      isPaused: false,
    }));
    onContinue?.();
  }, [onContinue]);

  const handleExitFromCompletion = useCallback(() => {
    setTourState((prev) => ({
      ...prev,
      isActive: false,
      showCompletion: false,
      isPaused: false,
    }));
    onExitDemo();
  }, [onExitDemo]);

  // ── Current step ────────────────────────────
  // Hide tour cards during demo playback
  const showTourCards = !isDemoPlaying;
  const currentStep: TourStep | null =
    tourState.isActive &&
    !tourState.showWelcome &&
    !tourState.showCompletion &&
    showTourCards &&
    config.steps[tourState.currentStepIndex]
      ? config.steps[tourState.currentStepIndex]
      : null;

  return (
    <>
      {/* Main content */}
      {children}

      {/* Welcome overlay */}
      {tourState.showWelcome && (
        <WelcomeCard
          projectName={projectName}
          projectTagline={projectTagline}
          onStart={handleStartWalkthrough}
          onExit={handleExitFromWelcome}
        />
      )}

      {/* Tour highlight overlay */}
      {currentStep && (
        <TourHighlight
          target={currentStep.highlightTarget}
          isVisible={true}
        />
      )}

      {/* Tour step card */}
      {currentStep && (
        <TourStepComponent
          stepNumber={currentStep.stepNumber}
          totalSteps={currentStep.totalSteps}
          title={currentStep.title}
          message={currentStep.message}
          position={currentStep.position}
          actionLabel={currentStep.actionLabel}
          onAction={handleStepAction}
          onSkip={handleSkip}
        />
      )}

      {/* Completion overlay */}
      {tourState.showCompletion && (
        <CompletionCard
          projectName={projectName}
          topicCount={topicCount}
          onContinue={handleContinueFromCompletion}
          onExit={handleExitFromCompletion}
        />
      )}
    </>
  );
}
