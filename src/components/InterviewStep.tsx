// ──────────────────────────────────────────────
// InterviewStep — Main interview workspace
// 3-column layout: ProgressPanel | ChatArea | UnderstandingPanel
// Supports live and demo modes with Guided Tour overlay
//
// In demo mode, the playback controller (useDemoPlayback)
// drives the virtual user. This component only renders
// the current state — it does NOT own playback logic.
//
// Flow:
//   1. Welcome card → "Start walkthrough" → shows first tour card
//   2. Tour card "Watch the Demo" → calls onStartDemo
//   3. Playback starts → tour cards hide → 11 topics play
//   4. Completion card → "Continue to Project Overview" → step 4
// ──────────────────────────────────────────────

import { useEffect, useRef, useCallback } from "react";
import { useInterview } from "../hooks/useInterview";
import ProgressPanel from "./ProgressPanel";
import ChatArea from "./ChatArea";
import UnderstandingPanel from "./UnderstandingPanel";
import GuidedTourProvider from "./GuidedTour/GuidedTourProvider";
import type { DemoScenario, SessionMode } from "../demo/types";
import type { UseDemoPlaybackReturn } from "../demo/useDemoPlayback";
import { getRequiredTopicIds } from "../orchestrator/interviewTopics";

interface InterviewStepProps {
  /** Raw idea text from step 1 */
  initialContext?: string;
  /** Navigate back */
  onBack: () => void;
  /** Skip to summary */
  onSkipToSummary: () => void;
  /** Continue to next step */
  onContinue: () => void;
  /** Open AI settings */
  onOpenSettings: (tab?: "endpoints" | "api-keys", endpointId?: string) => void;
  /** Current session mode */
  sessionMode: SessionMode;
  /** Active demo scenario (if in demo mode) */
  activeDemo: DemoScenario | null;
  /** Stop the demo */
  onStopDemo: () => void;
  /** Demo playback controller (only used in demo mode) */
  demoPlayback?: UseDemoPlaybackReturn;
  /** Callback to expose sendAnswer to parent (App.tsx) for demo action handling */
  onSendAnswerRef?: (fn: (answer: string) => Promise<void>) => void;
  /** Called when user clicks "Watch the Demo" on the first tour step */
  onStartDemo?: () => void;
  /** Callback to expose startInterview to parent (App.tsx) for demo start */
  onStartInterviewRef?: (fn: () => Promise<void>) => void;
}


export default function InterviewStep({
  initialContext,
  onBack,
  onSkipToSummary,
  onContinue,
  onOpenSettings,
  sessionMode,
  activeDemo,
  onStopDemo,
  demoPlayback,
  onSendAnswerRef,
  onStartInterviewRef,
  onStartDemo,
}: InterviewStepProps) {

  const isDemo = sessionMode === "demo";
  const {
    messages,
    topics,
    understanding,
    overallConfidence,
    activeTopic,
    isLoading,
    interviewComplete,
    error,
    hasStarted,
    typingContext,
    activeEndpoint,
    startInterview,
    sendAnswer,
    skipCurrentTopic,
  } = useInterview(initialContext, isDemo);

  // ── Demo typing state ───────────────────────
  // Reads typingText from the playback controller.
  // Updated character-by-character by the typing engine.
  const demoAnswerText = demoPlayback?.typingText ?? "";
  const demoStartedRef = useRef(false);


  // Start interview when demo playback enters "playing" phase
  useEffect(() => {
    if (isDemo && !demoStartedRef.current && !hasStarted && demoPlayback?.state.phase === "playing") {
      demoStartedRef.current = true;
      startInterview();
    }
  }, [isDemo, hasStarted, startInterview, demoPlayback?.state.phase]);

  // ── Demo controls ───────────────────────────
  const handleStartDemo = useCallback(() => {
    if (!hasStarted) {
      startInterview();
    }
    if (demoPlayback && activeDemo) {
      demoPlayback.start(activeDemo.script);
    }
  }, [hasStarted, startInterview, demoPlayback, activeDemo]);

  const handlePauseDemo = useCallback(() => {
    demoPlayback?.pause();
  }, [demoPlayback]);

  const handleResumeDemo = useCallback(() => {
    if (!hasStarted) {
      startInterview();
    }
    demoPlayback?.resume();
  }, [hasStarted, startInterview, demoPlayback]);

  // ── Expose sendAnswer to parent ─────────────
  // App.tsx needs this to call sendAnswer from the demo action handler.
  useEffect(() => {
    if (onSendAnswerRef) {
      onSendAnswerRef(sendAnswer);
    }
  }, [onSendAnswerRef, sendAnswer]);

  // ── Expose startInterview to parent ─────────
  // App.tsx needs this to call startInterview before demoPlayback.start()
  // so the interview engine is initialized before action processing begins.
  useEffect(() => {
    if (onStartInterviewRef) {
      onStartInterviewRef(startInterview);
    }
  }, [onStartInterviewRef, startInterview]);

  // ── Last-topic detection ─────────────────────
  // Derive whether the current active topic is the final required topic.
  // Used by ChatArea to show "Complete & Analyze →" instead of "Send".
  const requiredTopicIds = getRequiredTopicIds();
  const lastTopicId = requiredTopicIds[requiredTopicIds.length - 1];
  const isLastTopic = !isDemo && hasStarted && !interviewComplete && activeTopic === lastTopicId;

  // ── Wrapped send handler with completion check ──
  // When on the last topic, sendAnswer then verify interviewComplete
  // before advancing. This prevents a race where the engine might
  // return a follow-up question instead of completing.
  const handleSendWithCompletionCheck = useCallback(async (message: string) => {
    await sendAnswer(message);
    // After sendAnswer resolves, check if the interview actually completed.
    // If the engine returned a follow-up question, interviewComplete will
    // still be false, so we stay on step 2.
    if (isLastTopic && interviewComplete) {
      onContinue();
    }
  }, [sendAnswer, isLastTopic, interviewComplete, onContinue]);

  // ── Tour config ─────────────────────────────
  const tourConfig = activeDemo?.tourSteps
    ? { steps: activeDemo.tourSteps, autoStart: true }
    : null;

  // Whether demo playback is actively playing (hides tour cards)
  const isDemoPlaying = isDemo && (demoPlayback?.state.phase === "playing" || demoPlayback?.state.phase === "paused");

  // ── Content ─────────────────────────────────
  const content = (
    <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-xl border border-divider overflow-hidden bg-panel">
      {/* Left: Progress Panel */}
      <div
        data-tour="progress-panel"
        className="w-[240px] shrink-0 border-r border-divider bg-surface"
      >
        <ProgressPanel
          topics={topics}
          overallConfidence={overallConfidence}
          activeTopic={activeTopic ?? undefined}
        />
      </div>

      {/* Center: Chat Area */}
      <div
        data-tour="interview-chat"
        className="flex-1 min-w-0"
      >
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSend={handleSendWithCompletionCheck}
          onSkip={skipCurrentTopic}
          canSkip={hasStarted && !interviewComplete}
          disabled={!hasStarted || interviewComplete}
          typingContext={typingContext}
          activeTopic={activeTopic}
          demoAnswer={demoAnswerText || undefined}
          isLastTopic={isLastTopic}
        />
      </div>

      {/* Right: Understanding Panel */}
      <div
        data-tour="live-project-definition"
        className="w-[280px] shrink-0 border-l border-divider bg-surface"
      >
        <UnderstandingPanel
          data={understanding}
          isLoading={isLoading}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-app">
            {isDemo ? "Guided Demo" : "Project Discovery"}
          </h2>
          {isDemo && activeDemo && (
            <span className="badge-brand text-[10px] px-2 py-0.5">
              {activeDemo.name}
            </span>
          )}
          {activeEndpoint && !isDemo && (
            <span
              className="text-[10px] text-muted px-2 py-0.5 rounded-full border border-divider"
              style={{ borderColor: activeEndpoint.providerColor + "30" }}
            >
              {activeEndpoint.label} · {activeEndpoint.model}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Demo controls — only show during active playback */}
          {isDemo && demoPlayback?.state.phase === "playing" && (
            <button onClick={handlePauseDemo} className="btn-secondary text-xs px-3 py-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause
            </button>
          )}
          {isDemo && demoPlayback?.state.phase === "paused" && (
            <button onClick={handleResumeDemo} className="btn-primary text-xs px-3 py-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Resume
            </button>
          )}
          {isDemo && (
            <button onClick={onStopDemo} className="btn-ghost text-xs px-2 py-1.5 text-muted hover:text-error">
              Exit Demo
            </button>
          )}

          {/* Live mode controls */}
          {!isDemo && !hasStarted && (
            <button onClick={startInterview} className="btn-primary text-xs px-3 py-1.5">
              Start Interview
            </button>
          )}
          {!isDemo && hasStarted && !interviewComplete && (
            <button onClick={onSkipToSummary} className="btn-ghost text-xs px-2 py-1.5">
              Skip to Summary
            </button>
          )}
          {!isDemo && (
            <button
              onClick={() => onOpenSettings()}
              className="btn-ghost p-2"
              title="AI Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Continue button (when interview is complete) — secondary style since the primary action is now in the Send button */}
          {interviewComplete && (
            <button onClick={onContinue} className="btn-secondary text-xs px-3 py-1.5">
              Continue to Architecture
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-error/30 bg-error/10">
          <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-error">{error}</p>
            {error.includes("AI endpoint") && (
              <button
                onClick={() => onOpenSettings()}
                className="text-xs text-brand hover:text-brand-soft mt-1 underline"
              >
                Open AI Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main workspace */}
      {isDemo && tourConfig ? (
        <GuidedTourProvider
          config={tourConfig}
          projectName={activeDemo?.project.name ?? "Demo Project"}
          projectTagline={activeDemo?.metadata.tagline ?? ""}
          currentDemoStepIndex={demoPlayback?.state.currentScriptIndex ?? 0}
          interviewComplete={interviewComplete}
          onStartWalkthrough={() => {
            // Just close the welcome card — don't start playback
          }}
          onStartDemo={onStartDemo ?? handleStartDemo}
          onResumeDemo={handleResumeDemo}
          onExitDemo={onStopDemo}
          onFinishDemo={onContinue}
          onContinue={onContinue}
          topicCount={activeDemo?.interview.length ?? 0}
          isDemoPlaying={isDemoPlaying}
        >
          {content}
        </GuidedTourProvider>
      ) : (
        content
      )}
    </div>
  );
}
