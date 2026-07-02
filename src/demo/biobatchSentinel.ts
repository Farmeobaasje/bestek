// ──────────────────────────────────────────────
// BioBatch Sentinel — Demo Scenario
// Complete scripted interview for the guided demo
// ──────────────────────────────────────────────

import type { DemoScenario, DemoScript } from "./types";
import type { ArchitectureAnalysis } from "../models/architectureAnalysis";

// ── Declarative playback script ───────────────
// This script drives the virtual user through the
// entire wizard flow. Each action is translated by
// App.tsx into real application calls.
//
// The script ends with { action: "complete" } after
// all 11 interview answers. No premature goto actions.
// The completion card handles navigation to step 4.
// ──────────────────────────────────────────────

const SCRIPT: DemoScript = [
  // 1. Vision
  { action: "ask", topic: "vision" },
  { action: "answer", text: "BioBatch Sentinel is a laboratory operations platform for biotech teams running small-batch cell culture and fermentation experiments. It helps scientists track bioreactor runs, monitor culture conditions, record deviations, compare batch outcomes, and generate audit-ready experiment reports." },
  // 2. Users
  { action: "ask", topic: "target-users" },
  { action: "answer", text: "The primary users are biotech lab managers, fermentation scientists, cell culture researchers, quality assurance reviewers, process development teams, lab technicians, and biotech startup founders managing experimental production runs." },
  // 3. Problem
  { action: "ask", topic: "problems" },
  { action: "answer", text: "Small biotech teams often manage experimental batch data across spreadsheets, lab notebooks, instrument exports, and disconnected cloud folders. This makes it difficult to compare culture conditions, identify contamination risks, trace deviations, reproduce successful batches, and prepare reliable documentation for internal quality reviews or regulatory audits." },
  // 4. Goals
  { action: "ask", topic: "goals" },
  { action: "answer", text: "The goals are to improve batch traceability, reduce manual reporting work, help scientists compare process outcomes, flag deviations early, and give quality teams a clear audit trail for every experimental run." },
  // 5. Solution
  { action: "ask", topic: "solution" },
  { action: "answer", text: "The solution is a secure web application with batch run tracking, bioreactor condition logs, sample collection schedules, deviation records, contamination alerts, experiment protocol templates, instrument data imports, batch comparison dashboards, QA review workflows, electronic signatures, and exportable audit reports." },
  // 6. MVP Scope
  { action: "ask", topic: "mvp" },
  { action: "answer", text: "The MVP includes organization workspaces, a batch run dashboard, bioreactor profile management, culture condition logging, sample schedule planning, deviation tracking, contamination alert workflow, instrument CSV import, experiment protocol templates, batch comparison charts, QA review queue, electronic signatures, audit report export, role-based access control, notifications, and settings." },
  // 7. Tech Stack
  { action: "ask", topic: "tech-stack" },
  { action: "answer", text: "The preferred stack is React, TypeScript, Vite, Tailwind CSS on the frontend; Node.js with NestJS on the backend; PostgreSQL with Prisma for data; Supabase Storage for instrument files and audit exports; Clerk for authentication; Resend for email; Sentry and OpenTelemetry for monitoring; Vitest and Playwright for testing; Vercel and Railway for deployment." },
  // 8. Integrations
  { action: "ask", topic: "integrations" },
  { action: "answer", text: "The platform should support CSV imports from bioreactor controllers, Google Drive, Microsoft OneDrive, Slack alerts, Resend Email, Supabase Storage, Sentry, OpenTelemetry, and an optional future LIMS export for lab system integration." },
  // 9. Constraints
  { action: "ask", topic: "constraints" },
  { action: "answer", text: "The platform must protect sensitive experiment data, support tenant isolation, maintain an immutable audit trail, provide role-based access control, support electronic signatures, handle large instrument export files, remain usable in lab tablet workflows, and make all exported reports traceable to original batch data." },
  // 10. Risks
  { action: "ask", topic: "risks" },
  { action: "answer", text: "The main risks are incorrect experiment data entry, inconsistent instrument export formats, missing deviation records, contamination events not being logged quickly enough, audit trail gaps, unauthorized access to sensitive biotech process data, and over-customization for different lab protocols." },
  // 11. AI Workflow
  { action: "ask", topic: "ai-workflow" },
  { action: "answer", text: "The AI should interview the lab operations lead to understand experiment types, batch workflows, instrument export formats, deviation handling, QA review requirements, electronic signature rules, and reporting expectations. It should then recommend an architecture, identify scientific and compliance risks, generate a complete Project Definition, roadmap, README, PRD, SPEC, Memory Bank, Cline Rules, AGENTS.md, Bootstrap Prompt, and implementation plan, then validate everything for consistency, traceability, security, compliance readiness, and release quality before export." },
  // 12. Complete — triggers completion card
  { action: "complete" },
];

// ── Pre-canned architecture analysis ──────────
// Avoids LLM calls during demo playback.
// ──────────────────────────────────────────────

const DEMO_ARCHITECTURE: ArchitectureAnalysis = {
  id: "demo-arch-biobatch",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  confidence: 85,
  executiveSummary: "BioBatch Sentinel is a biotech laboratory operations platform that requires a secure, multi-tenant architecture with strong data isolation, immutable audit trails, and real-time monitoring capabilities. The recommended approach is a modular monolith with clear bounded contexts for batch management, sample tracking, quality control, and reporting, deployed on a containerized infrastructure with PostgreSQL for transactional data and TimescaleDB for time-series bioreactor metrics.",
  overallScore: 85,
  suggestedArchitecture: "Modular Monolith with Event-Driven Communication\n\nThe system is organized into bounded contexts: Batch Management, Sample Tracking, Quality Control, Instrument Integration, and Reporting. Each context has its own database schema within a shared PostgreSQL instance, communicating via an internal event bus for cross-context operations (e.g., a deviation event triggers QA review workflow). This avoids the operational complexity of microservices while maintaining clear domain boundaries.",
  suggestedStack: {
    frontend: "React 18 + TypeScript + Vite + Tailwind CSS",
    backend: "Node.js + NestJS + Prisma ORM",
    database: "PostgreSQL + TimescaleDB (time-series)",
    infrastructure: "Docker + Railway + Vercel",
    ai: "OpenAI GPT-4o / Claude Sonnet 4",
    testing: "Vitest + Playwright",
    monitoring: "Sentry + OpenTelemetry",
  },
  estimatedComplexity: "high",
  estimatedTimeline: "4-6 months to MVP",
  recommendations: [
    {
      id: "rec-1",
      priority: "essential",
      category: "architecture",
      description: "Implement tenant isolation at the database level using PostgreSQL Row-Level Security (RLS) to ensure experiment data from different organizations is strictly separated.",
      effort: "medium",
      rationale: "Biotech labs handle sensitive proprietary data. RLS provides database-level enforcement that cannot be bypassed by application bugs.",
    },
    {
      id: "rec-2",
      priority: "essential",
      category: "compliance",
      description: "Design an immutable audit trail using append-only tables for all batch operations, deviation records, and electronic signatures.",
      effort: "medium",
      rationale: "Regulatory audits (FDA 21 CFR Part 11, GxP) require tamper-proof records of all quality-related events.",
    },
    {
      id: "rec-3",
      priority: "recommended",
      category: "performance",
      description: "Use TimescaleDB hypertables for bioreactor time-series data to enable efficient range queries and downsampling for dashboard visualizations.",
      effort: "low",
      rationale: "Bioreactor sensors generate continuous data streams. TimescaleDB provides 10-100x faster time-range queries compared to standard PostgreSQL.",
    },
    {
      id: "rec-4",
      priority: "recommended",
      category: "ux",
      description: "Design the UI with a tablet-first responsive layout since lab technicians often use tablets or mobile workstations on the lab floor.",
      effort: "medium",
      rationale: "Lab environments have limited desk space. A tablet-optimized interface improves adoption and data entry accuracy.",
    },
    {
      id: "rec-5",
      priority: "optional",
      category: "integration",
      description: "Build a pluggable instrument integration framework that allows labs to add custom CSV/API parsers without modifying core application code.",
      effort: "high",
      rationale: "Different labs use different bioreactor models with varying export formats. A plugin system future-proofs the platform.",
    },
  ],
  tradeoffs: [
    {
      id: "to-1",
      decision: "Modular Monolith vs. Microservices",
      optionA: "Modular Monolith — simpler deployment, shared database, easier debugging, lower operational overhead",
      optionB: "Microservices — independent scaling, technology diversity, team autonomy, higher operational complexity",
      chosen: "a",
      rationale: "For a team of 3-5 developers building an MVP, a modular monolith provides faster iteration and lower DevOps burden while maintaining clean domain boundaries for future extraction.",
    },
    {
      id: "to-2",
      decision: "Row-Level Security vs. Application-Level Authorization",
      optionA: "RLS — database-enforced tenant isolation, cannot be bypassed, consistent across all access patterns",
      optionB: "Application-level — more flexible, easier to test, works with any database, requires discipline",
      chosen: "a",
      rationale: "Biotech data sensitivity demands defense in depth. RLS provides a safety net even if application authorization has bugs.",
    },
  ],
  risks: [
    {
      id: "risk-1",
      category: "data-integrity",
      description: "Incorrect experiment data entry by lab technicians could compromise batch analysis and regulatory compliance.",
      impact: "high",
      likelihood: "medium",
      status: "open",
      mitigation: "Implement input validation with range checks, required field enforcement, and a two-person verification workflow for critical data points.",
    },
    {
      id: "risk-2",
      category: "integration",
      description: "Inconsistent instrument export formats across different bioreactor models may cause parsing failures or data loss.",
      impact: "medium",
      likelihood: "high",
      status: "open",
      mitigation: "Build a robust CSV parser with schema validation, preview mode, and manual field mapping fallback.",
    },
    {
      id: "risk-3",
      category: "compliance",
      description: "Audit trail gaps could occur if the system fails to log all state changes or if logs are accidentally truncated.",
      impact: "high",
      likelihood: "low",
      status: "open",
      mitigation: "Use append-only audit tables with database-level triggers, periodic integrity checks, and read-only access for audit records.",
    },
    {
      id: "risk-4",
      category: "security",
      description: "Unauthorized access to sensitive biotech process data could result in intellectual property theft.",
      impact: "critical",
      likelihood: "medium",
      status: "open",
      mitigation: "Implement RLS, encryption at rest, TLS for all communications, and session timeout policies. Conduct regular security audits.",
    },
  ],
  unknowns: [
    "What is the expected data volume per bioreactor run (sensor readings per minute)?",
    "Do labs require on-premises deployment options for air-gapped environments?",
    "What is the regulatory classification of the platform (GxP, FDA 21 CFR Part 11)?",
    "How many concurrent users are expected during peak lab hours?",
    "What is the disaster recovery and backup frequency requirement?",
  ],
  functionalAnalysis: {
    coreFeatures: [
      "Batch run tracking with status workflow",
      "Bioreactor condition monitoring dashboard",
      "Sample collection scheduling and tracking",
      "Deviation and contamination event logging",
      "Instrument CSV import with validation",
      "Experiment protocol templates",
      "Batch comparison charts and analytics",
      "QA review queue with electronic signatures",
      "Audit report export (PDF/CSV)",
      "Role-based access control",
    ],
    userFlows: [
      "Lab technician starts a new batch run, configures bioreactor parameters, and schedules sample collections",
      "Quality reviewer receives deviation alert, reviews batch data, and signs off electronically",
      "Lab manager compares batch outcomes across runs to identify optimal culture conditions",
    ],
    edgeCases: [],
    scalabilityConcerns: [],
  },


  technicalAnalysis: {
    architecturePattern: "Modular Monolith with Event-Driven Communication. Each bounded context (Batch, Sample, QC, Instrument, Reporting) has its own schema within a shared PostgreSQL database. Cross-context communication happens via an internal event bus using a message queue pattern.",
    dataModel: "Core entities: Organization, Workspace, User, BatchRun, BioreactorProfile, CultureCondition, SampleSchedule, Deviation, ContaminationAlert, InstrumentImport, ProtocolTemplate, QAReview, ElectronicSignature, AuditLog. Each entity has tenant_id for RLS enforcement and created_at/updated_at timestamps.",
    apiDesign: "RESTful API with NestJS controllers organized by bounded context. Key endpoints: /batches, /samples, /deviations, /instruments, /protocols, /qa-reviews, /reports. All endpoints require authentication and tenant context.",
    security: "Authentication via Clerk with JWT tokens. Authorization via RLS + application-level role checks. Electronic signatures with cryptographic hash chaining for audit trail integrity. Encryption at rest and in transit.",
    performance: "TimescaleDB hypertables for bioreactor time-series data. Redis caching for dashboard queries. Pagination and filtering for all list endpoints. Background jobs for report generation and instrument import processing.",
    deployment: "Docker containers deployed on Railway. Frontend on Vercel. PostgreSQL + TimescaleDB managed database. CI/CD via GitHub Actions with staging and production environments.",
  },
};

// ── Demo scenario export ──────────────────────

export const BIOBATCH_SENTINEL_DEMO: DemoScenario = {
  id: "biobatch-sentinel-demo",
  name: "BioBatch Sentinel",
  metadata: {
    tagline: "Biotech Lab Operations",
    category: "Biotech",
  },
  project: {
    prompt: `I want to build BioBatch Sentinel, a laboratory operations platform for biotech labs. It should track samples, manage batch workflows, integrate with lab equipment via APIs, and provide real-time dashboards for QC metrics. Built with React, Node.js, and PostgreSQL.`,
    name: "BioBatch Sentinel",
    tagline: "Biotech Lab Operations Platform",
  },
  interview: [
    {
      topic: "vision",
      question:
        "What is the high-level vision for BioBatch Sentinel?",
      answer:
        "BioBatch Sentinel is a laboratory operations platform for biotech teams running small-batch cell culture and fermentation experiments. It helps scientists track bioreactor runs, monitor culture conditions, record deviations, compare batch outcomes, and generate audit-ready experiment reports.",
      delay: 1800,
      typingSpeed: 25,
    },
    {
      topic: "target-users",
      question:
        "Who are the primary users?",
      answer:
        "The primary users are biotech lab managers, fermentation scientists, cell culture researchers, quality assurance reviewers, process development teams, lab technicians, and biotech startup founders managing experimental production runs.",
      delay: 1600,
      typingSpeed: 28,
    },
    {
      topic: "problems",
      question:
        "What problem does this solve?",
      answer:
        "Small biotech teams often manage experimental batch data across spreadsheets, lab notebooks, instrument exports, and disconnected cloud folders. This makes it difficult to compare culture conditions, identify contamination risks, trace deviations, reproduce successful batches, and prepare reliable documentation for internal quality reviews or regulatory audits.",
      delay: 2000,
      typingSpeed: 30,
    },
    {
      topic: "goals",
      question:
        "What are the main goals?",
      answer:
        "The goals are to improve batch traceability, reduce manual reporting work, help scientists compare process outcomes, flag deviations early, and give quality teams a clear audit trail for every experimental run.",
      delay: 1800,
      typingSpeed: 26,
    },
    {
      topic: "solution",
      question:
        "What is the proposed solution?",
      answer:
        "The solution is a secure web application with batch run tracking, bioreactor condition logs, sample collection schedules, deviation records, contamination alerts, experiment protocol templates, instrument data imports, batch comparison dashboards, QA review workflows, electronic signatures, and exportable audit reports.",
      delay: 2000,
      typingSpeed: 28,
    },
    {
      topic: "mvp",
      question:
        "What should be included in the MVP?",
      answer:
        "The MVP includes organization workspaces, a batch run dashboard, bioreactor profile management, culture condition logging, sample schedule planning, deviation tracking, contamination alert workflow, instrument CSV import, experiment protocol templates, batch comparison charts, QA review queue, electronic signatures, audit report export, role-based access control, notifications, and settings.",
      delay: 2200,
      typingSpeed: 30,
    },
    {
      topic: "tech-stack",
      question:
        "What technology stack should the project use?",
      answer:
        "The preferred stack is React, TypeScript, Vite, Tailwind CSS on the frontend; Node.js with NestJS on the backend; PostgreSQL with Prisma for data; Supabase Storage for instrument files and audit exports; Clerk for authentication; Resend for email; Sentry and OpenTelemetry for monitoring; Vitest and Playwright for testing; Vercel and Railway for deployment.",
      delay: 1800,
      typingSpeed: 25,
    },
    {
      topic: "integrations",
      question:
        "Which integrations are needed?",
      answer:
        "The platform should support CSV imports from bioreactor controllers, Google Drive, Microsoft OneDrive, Slack alerts, Resend Email, Supabase Storage, Sentry, OpenTelemetry, and an optional future LIMS export for lab system integration.",
      delay: 2000,
      typingSpeed: 28,
    },
    {
      topic: "constraints",
      question:
        "What constraints must the system respect?",
      answer:
        "The platform must protect sensitive experiment data, support tenant isolation, maintain an immutable audit trail, provide role-based access control, support electronic signatures, handle large instrument export files, remain usable in lab tablet workflows, and make all exported reports traceable to original batch data.",
      delay: 2200,
      typingSpeed: 26,
    },
    {
      topic: "risks",
      question:
        "What are the main risks?",
      answer:
        "The main risks are incorrect experiment data entry, inconsistent instrument export formats, missing deviation records, contamination events not being logged quickly enough, audit trail gaps, unauthorized access to sensitive biotech process data, and over-customization for different lab protocols.",
      delay: 2000,
      typingSpeed: 28,
    },
    {
      topic: "ai-workflow",
      question:
        "How should AI support the workflow?",
      answer:
        "The AI should interview the lab operations lead to understand experiment types, batch workflows, instrument export formats, deviation handling, QA review requirements, electronic signature rules, and reporting expectations. It should then recommend an architecture, identify scientific and compliance risks, generate a complete Project Definition, roadmap, README, PRD, SPEC, Memory Bank, Cline Rules, AGENTS.md, Bootstrap Prompt, and implementation plan, then validate everything for consistency, traceability, security, compliance readiness, and release quality before export.",
      delay: 1600,
      typingSpeed: 25,
    },
  ],
  /** Declarative playback script */
  script: SCRIPT,
  /** Pre-canned architecture result (avoids LLM call during demo) */
  demoArchitecture: DEMO_ARCHITECTURE,
  // Legacy tooltips — kept for backward compatibility
  tooltips: [],
  // Guided Tour steps — premium onboarding experience
  tourSteps: [
    {
      id: "tour-interview",
      stepNumber: 1,
      totalSteps: 5,
      title: "The Interview",
      message:
        "VibeForge starts by interviewing you instead of immediately generating code. This lets the AI understand the real problem before making architectural decisions.\n\nWatch how the AI asks about your project vision — each answer becomes part of a structured blueprint.",
      position: "bottom",
      highlightTarget: "chat",
      triggerAfterStep: 0,
      actionLabel: "Watch the Demo",
    },
    {
      id: "tour-live-definition",
      stepNumber: 2,
      totalSteps: 5,
      title: "Live Project Definition",
      message:
        "As you answer, the right panel updates in real time. Every response becomes part of a structured Project Definition — no manual documentation needed.\n\nThe AI extracts requirements, goals, and constraints automatically as the conversation progresses.",
      position: "right",
      highlightTarget: "understanding-panel",
      triggerAfterStep: 1,
      actionLabel: "See it in action",
    },
    {
      id: "tour-progress",
      stepNumber: 3,
      totalSteps: 5,
      title: "Progress Tracking",
      message:
        "The left panel shows your interview progress. Completed topics get a checkmark.\n\nThe AI uses this context to ask smarter follow-up questions — it remembers everything you've said and builds on previous answers.",
      position: "left",
      highlightTarget: "progress-panel",
      triggerAfterStep: 3,
      actionLabel: "Track the progress",
    },
    {
      id: "tour-context",
      stepNumber: 4,
      totalSteps: 5,
      title: "Building Context",
      message:
        "The AI doesn't just collect answers — it builds a complete picture of your project.\n\nEach response unlocks additional parts of the Project Definition. You don't need to think about documentation anymore; the interview builds it for you.",
      position: "bottom",
      highlightTarget: "chat",
      triggerAfterStep: 6,
      actionLabel: "See how it builds",
    },
    {
      id: "tour-almost-done",
      stepNumber: 5,
      totalSteps: 5,
      title: "Almost There",
      message:
        "One more question and the interview will be complete. The AI will then have everything it needs to generate your full project blueprint — including PRD, SPEC, README, Roadmap, and more.",
      position: "bottom",
      highlightTarget: null,
      triggerAfterStep: 9,
      actionLabel: "Finish the demo",
    },
  ],
};
