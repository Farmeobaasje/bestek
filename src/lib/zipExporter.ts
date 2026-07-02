// ──────────────────────────────────────────────
// zipExporter.ts — export all project files as ZIP
// Phase 5.4: bundles generated files, project
// definition JSON, and bootstrap prompt into a
// single downloadable ZIP archive.
// ──────────────────────────────────────────────

import JSZip from "jszip";
import type { ProjectDefinition, GeneratedFile } from "../types/projectDefinition";

/**
 * Slugify a string for use in filenames.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Export the full project as a ZIP download.
 *
 * Bundles:
 * - All GeneratedFile[] entries with their original paths
 * - project-definition.json
 * - bootstrap-prompt.md (extracted from generatedFiles)
 *
 * @param projectDefinition  The current ProjectDefinition
 * @param generatedFiles     Array of generated files to include
 * @returns                  true if the download was triggered, false on error
 */
export async function exportProjectZip(
  projectDefinition: ProjectDefinition,
  generatedFiles: GeneratedFile[],
): Promise<boolean> {
  try {
    const zip = new JSZip();

    // ── Generated files with original paths ──
    for (const file of generatedFiles) {
      // Guard against duplicates — bootstrap-prompt.md may appear in
      // generatedFiles; we handle it separately below to ensure it
      // appears exactly once.
      if (file.path === "bootstrap-prompt.md") {
        continue;
      }
      zip.file(file.path, file.content);
    }

    // ── Bootstrap prompt (extract from generatedFiles) ──
    const bootstrapFile = generatedFiles.find((f) => f.path === "bootstrap-prompt.md");
    const bootstrapContent = bootstrapFile?.content ?? "";
    zip.file("bootstrap-prompt.md", bootstrapContent);

    // ── Project Definition JSON ──
    const jsonContent = JSON.stringify(projectDefinition, null, 2);
    zip.file("project-definition.json", jsonContent);

    // ── Generate ZIP blob and trigger download ──
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const projectName = projectDefinition.project.name || "";
    const slug = slugify(projectName);
    const filename = slug ? `${slug}-bootstrap.zip` : "project-bootstrap.zip";

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();

    // Clean up
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("ZIP export failed:", error);
    return false;
  }
}
