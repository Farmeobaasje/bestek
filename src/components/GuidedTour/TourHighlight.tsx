// ──────────────────────────────────────────────
// TourHighlight — Dynamic highlight overlay
// Uses getBoundingClientRect() for precise positioning
// Targets DOM elements via data-tour attributes
// ──────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import type { TourHighlightTarget } from "./types";

interface TourHighlightProps {
  /** Which UI panel to highlight */
  target: TourHighlightTarget;
  /** Whether the highlight is visible */
  isVisible: boolean;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TARGET_SELECTORS: Record<NonNullable<TourHighlightTarget>, string> = {
  "chat": '[data-tour="interview-chat"]',
  "progress-panel": '[data-tour="progress-panel"]',
  "understanding-panel": '[data-tour="live-project-definition"]',
};

export default function TourHighlight({ target, isVisible }: TourHighlightProps) {
  const [rect, setRect] = useState<HighlightRect | null>(null);

  const updatePosition = useCallback(() => {
    if (!target || !isVisible) {
      setRect(null);
      return;
    }

    const selector = TARGET_SELECTORS[target];
    if (!selector) {
      setRect(null);
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }

    const boundingRect = el.getBoundingClientRect();
    setRect({
      top: boundingRect.top,
      left: boundingRect.left,
      width: boundingRect.width,
      height: boundingRect.height,
    });
  }, [target, isVisible]);

  // Update on mount and when target changes
  useEffect(() => {
    updatePosition();
  }, [updatePosition]);

  // Re-calculate on scroll and resize for robustness
  useEffect(() => {
    if (!isVisible || !target) return;

    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, target, updatePosition]);

  if (!isVisible || !target || !rect) return null;

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none">
      {/* Semi-transparent overlay — lighter than before */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Cutout — the highlighted element shines through */}
      <div
        className="absolute bg-transparent pointer-events-auto"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />

      {/* Highlight ring around the cutout */}
      <div
        className="absolute rounded-lg ring-2 ring-brand/50 ring-offset-2 ring-offset-transparent transition-all duration-300"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      />
    </div>
  );
}
