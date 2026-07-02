// ──────────────────────────────────────────────
// App — VibeForge 6-step wizard
// Describe → Interview → Architecture Review → Summary → Generate → Export
//
// Demo playback wiring:
//   App.tsx owns the useDemoPlayback hook and translates
//   DemoScriptAction into real application calls via onAction.
//   The playback controller has zero knowledge of application state.
// ──────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectDefinition } from "./hooks/useProjectDefinition";
import { useProjectRequirements } from "./hooks/useProjectRequirements";
import { useWizard } from "./hooks/useWizard";
import { useDemoPlayback } from "./demo/useDemoPlayback";
import { deterministicGenerate } from "./generator";
import { loadConversationMemory } from "./lib/conversationMemoryStorage";
import { loadProjectRequirements } from "./lib/projectRequirementsStorage";
import { loadArchitectureAnalysis } from "./lib/architectureAnalysisStorage";
import { createEmptyArchitectureAnalysis } from "./models/architectureAnalysis";
import { clearAllStorage } from "./lib/storage";
import { clearConversationMemory } from "./lib/conversationMemoryStorage";
import { clearProjectRequirements } from "./lib/projectRequirementsStorage";
import { clearArchitectureAnalysis } from "./lib/architectureAnalysisStorage";
import { clearWorkspace } from "./lib/workspaceStorage";
import { loadTheme, applyTheme, listenForSystemThemeChanges } from "./lib/themeSettings";
import WizardHeader from "./components/WizardHeader";
import LandingPage from "./components/LandingPage";
import InterviewStep from "./components/InterviewStep";
import ArchitectureInsightsStep from "./components/ArchitectureInsightsStep";
import SummaryStep from "./components/SummaryStep";
import GenerateStep from "./components/GenerateStep";
import ExportStep from "./components/ExportStep";
import AISettings from "./components/AISettings";
import GeneralSettings from "./components/GeneralSettings";
import { BIOBATCH_SENTINEL_DEMO } from "./demo/biobatchSentinel";
import type { DemoScriptAction } from "./demo/types";

export default function App() {
  const {
    projectDefinition,
    lastSavedAt,
    saveError,
    updateProjectDefinition,
    setProjectDefinition,
    resetProjectDefinition,
  } = useProjectDefinition();

  const { resetRequirements } = useProjectRequirements();

  const wizard = useWizard();
  const demoPlayback = useDemoPlayback();
  const [showAISettings, setShowAISettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [rawIdea, setRawIdea] = useState<string>("");
  const [settingsTab, setSettingsTab] = useState<"endpoints" | "api-keys">("endpoints");
  const [settingsFocusEndpoint, setSettingsFocusEndpoint] = useState<string | undefined>(undefined);
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  // ── Demo action handler refs ────────────────
  // InterviewStep exposes sendAnswer and startInterview via ref callbacks.
  // We store them here so the demo action handler can call them.
  const sendAnswerRef = useRef<((answer: string) => Promise<void>) | null>(null);
  const startInterviewRef = useRef<(() => Promise<void>) | null>(null);

  // ── Theme init ──────────────────────────────
  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
    return listenForSystemThemeChanges();
  }, []);

  // ── Generator sync ──────────────────────────
  const syncWithGenerator = useCallback(
    async (includeAnalysis: boolean = false) => {
      const memory = loadConversationMemory();
      const req = loadProjectRequirements();
      const analysis = includeAnalysis ? loadArchitectureAnalysis() : createEmptyArchitectureAnalysis();

      const result = await deterministicGenerate({
        memory,
        requirements: req,
        architecture: analysis,
      });

      updateProjectDefinition(result.projectDefinition);

      if (result.warnings.length > 0) {
        console.info("[Generator] Warnings:", result.warnings);
      }
    },
    [updateProjectDefinition],
  );

  // ── Demo action handler ─────────────────────
  // Translates DemoScriptAction into real application calls.
  // This is the bridge between the virtual user and the real workflow.
  const handleDemoAction = useCallback(
    async (action: DemoScriptAction) => {
      switch (action.action) {
        case "ask": {
          // The "ask" action just advances the script — the interview engine
          // already handles question generation. We just need to wait for
          // the question to appear, then the next "answer" action will respond.
          demoPlayback.next();
          break;
        }

        case "answer": {
          // Use the typing controller to simulate character-by-character typing,
          // then call sendAnswer when done.
          const sendAnswer = sendAnswerRef.current;
          if (!sendAnswer) {
            // Fallback: just advance without typing
            demoPlayback.next();
            break;
          }

          // Start typing animation — the InterviewStep listens to demoPlayback.typing
          // and renders the typed text via demoAnswerText.
          demoPlayback.typing.start(
            action.text,
            () => {
              // onChar — InterviewStep reads demoPlayback.typing state
              // We don't need to do anything here; the component polls via render
            },
            () => {
              // onDone — send the answer and advance
              sendAnswer(action.text).then(() => {
                demoPlayback.next();
              });
            },
          );
          break;
        }

        case "goto": {
          wizard.goTo(action.step);
          demoPlayback.next();
          break;
        }

        case "run-architecture": {
          // The ArchitectureInsightsStep has autoRun prop — it will auto-trigger
          // when it mounts. We just navigate there.
          wizard.goTo(3);
          demoPlayback.next();
          break;
        }

        case "pause": {
          // Wait for the specified duration, then advance
          setTimeout(() => {
            demoPlayback.next();
          }, action.duration);
          break;
        }

        case "complete": {
          // Do NOT call demoPlayback.exit() — that resets everything.
          // The completion card is shown by GuidedTourProvider when
          // interviewComplete becomes true (driven by useInterview).
          // Just leave the playback in its current state.
          // The user clicks "Continue to Project Overview" to navigate.
          break;
        }
      }
    },
    [demoPlayback, wizard],
  );

  // ── Process script actions on phase change ──
  // When playback enters "playing" phase, start processing actions.
  // Uses a lastProcessedIndexRef to ensure each script index is
  // processed exactly once — prevents re-processing on re-renders
  // caused by typing state updates (setTypingText → re-render →
  // new currentAction object reference → effect re-fire).
  const lastProcessedIndexRef = useRef(-1);
  useEffect(() => {
    if (demoPlayback.state.phase !== "playing") return;

    const idx = demoPlayback.state.currentScriptIndex;
    if (lastProcessedIndexRef.current === idx) return;
    lastProcessedIndexRef.current = idx;

    const action = demoPlayback.currentAction;
    if (!action) return;

    handleDemoAction(action);
  }, [demoPlayback.state.phase, demoPlayback.state.currentScriptIndex, handleDemoAction]);

  // ── Start over ──────────────────────────────
  const handleStartOver = useCallback(() => {
    clearAllStorage();
    clearConversationMemory();
    clearProjectRequirements();
    clearArchitectureAnalysis();
    clearWorkspace();

    resetProjectDefinition();
    resetRequirements();

    setRawIdea("");
    setAutoAnalyze(false);

    wizard.stopDemo();
  }, [resetProjectDefinition, resetRequirements, wizard]);

  const handleStartInterview = useCallback((idea: string) => {
    setRawIdea(idea);
    wizard.startLiveSession();
  }, [wizard]);

  const handleOpenSettings = useCallback((tab?: "endpoints" | "api-keys", focusEndpointId?: string) => {
    setSettingsTab(tab ?? "endpoints");
    setSettingsFocusEndpoint(focusEndpointId);
    setShowAISettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowAISettings(false);
    setSettingsFocusEndpoint(undefined);
  }, []);

  const handleOpenGeneralSettings = useCallback(() => {
    setShowGeneralSettings(true);
  }, []);

  const handleCloseGeneralSettings = useCallback(() => {
    setShowGeneralSettings(false);
  }, []);

  // ── Demo mode ───────────────────────────────
  const handleStartDemo = useCallback((projectId: string) => {
    if (projectId === "biobatch-sentinel") {
      wizard.startDemo(BIOBATCH_SENTINEL_DEMO);
    }
  }, [wizard]);

  // ── Step transition handlers ────────────────
  // Called when the Send button on the last topic triggers completion.
  // Syncs the generator, sets autoAnalyze so ArchitectureInsightsStep
  // auto-runs its analysis, then advances to step 3.
  const handleInterviewCompleteViaSend = useCallback(async () => {
    await syncWithGenerator(false);
    setAutoAnalyze(true);
    wizard.goNext();
  }, [syncWithGenerator, wizard]);

  const handleArchitectureContinue = useCallback(async () => {
    await syncWithGenerator(true);
    wizard.goNext();
  }, [syncWithGenerator, wizard]);

  // ── Reset autoAnalyze when leaving step 3 ────
  // Prevents stale autoAnalyze from triggering analysis again
  // if the user navigates back to step 3 later.
  useEffect(() => {
    if (wizard.currentStep !== 3) {
      setAutoAnalyze(false);
    }
  }, [wizard.currentStep]);

  return (
    <div className="min-h-screen bg-app text-app">
      {/* Header */}
      {wizard.currentStep > 1 && (
        <WizardHeader
          currentStep={wizard.currentStep}
          onStepClick={wizard.goTo}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          onOpenGeneralSettings={handleOpenGeneralSettings}
          onNewProject={handleStartOver}
        />
      )}

      {/* General Settings modal */}
      <GeneralSettings
        isOpen={showGeneralSettings}
        onClose={handleCloseGeneralSettings}
      />

      {/* AI Settings modal */}
      <AISettings
        isOpen={showAISettings}
        onClose={handleCloseSettings}
        initialTab={settingsTab}
        focusEndpointId={settingsFocusEndpoint}
      />

      {/* Main content */}
      <main className={wizard.currentStep === 1 ? "" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
        {/* Step 1: Landing page */}
        {wizard.currentStep === 1 && (
          <LandingPage
            onSetProjectDefinition={setProjectDefinition}
            onStartProjectDiscovery={handleStartInterview}
            onContinue={wizard.goNext}
            onOpenGeneralSettings={handleOpenGeneralSettings}
            onOpenAISettings={() => handleOpenSettings()}
            onStartDemo={handleStartDemo}
          />
        )}

        {/* Step 2: Interview */}
        {wizard.currentStep === 2 && (
          <InterviewStep
            initialContext={rawIdea}
            onBack={wizard.goBack}
            onSkipToSummary={() => wizard.goTo(4)}
            onContinue={handleInterviewCompleteViaSend}
            onOpenSettings={(tab, endpointId) => handleOpenSettings(tab, endpointId)}
            sessionMode={wizard.sessionMode}
            activeDemo={wizard.activeDemo}
            onStopDemo={wizard.stopDemo}
            demoPlayback={demoPlayback}
            onSendAnswerRef={(fn) => { sendAnswerRef.current = fn; }}
            onStartInterviewRef={(fn) => { startInterviewRef.current = fn; }}
            onStartDemo={async () => {
              // Called when user clicks "Watch the Demo" on the first tour card
              // 1. Start the interview engine first (initializes conversation memory)
              const startInterview = startInterviewRef.current;
              if (startInterview) {
                await startInterview();
              }
              // 2. Start the demo playback script (sets phase to "playing")
              if (demoPlayback && wizard.activeDemo) {
                demoPlayback.start(wizard.activeDemo.script);
              }
            }}
          />
        )}

        {/* Step 3: Architecture Insights */}
        {wizard.currentStep === 3 && (
          <ArchitectureInsightsStep
            onBack={wizard.goBack}
            onContinue={handleArchitectureContinue}
            autoRun={wizard.sessionMode === "demo" || autoAnalyze}
            demoArchitecture={wizard.sessionMode === "demo" ? wizard.activeDemo?.demoArchitecture : undefined}
          />
        )}

        {/* Step 4: Summary */}
        {wizard.currentStep === 4 && (
          <SummaryStep
            projectDefinition={projectDefinition}
            onUpdate={updateProjectDefinition}
            onBack={wizard.goBack}
            onContinue={wizard.goNext}
          />
        )}

        {/* Step 5: Generate */}
        {wizard.currentStep === 5 && (
          <GenerateStep
            projectDefinition={projectDefinition}
            onBack={wizard.goBack}
            onContinue={wizard.goNext}
          />
        )}

        {/* Step 6: Export */}
        {wizard.currentStep === 6 && (
          <ExportStep
            projectDefinition={projectDefinition}
            onBack={wizard.goBack}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
