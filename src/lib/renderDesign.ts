import type { RefObject } from "react";

/**
 * Renders the design preview element to a PNG Blob using html2canvas.
 * IMPORTANT: All images in the preview div must have crossOrigin="anonymous"
 * and Supabase Storage must have CORS configured for this to work.
 */
export async function renderDesignToBlob(
  previewRef: RefObject<HTMLDivElement | null>
): Promise<Blob | null> {
  if (!previewRef.current) return null;

  try {
    // Wait for all custom fonts to load before capturing
    await document.fonts.ready;

    // Dynamically import to keep it client-only and avoid SSR issues
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(previewRef.current, {
      useCORS: true,        // Required for cross-origin Supabase images
      allowTaint: false,
      scale: 5,             // 5× resolution → ~300 DPI for a standard print area
      backgroundColor: "#ffffff",
      logging: false,
    });

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/png",
        0.92
      );
    });
  } catch (err) {
    console.error("[renderDesign] renderDesignToBlob failed:", err);
    return null;
  }
}

/**
 * Returns a data URL (base64) string for inline preview.
 * Use this for showing the user a preview before saving.
 */
export async function renderDesignToDataUrl(
  previewRef: RefObject<HTMLDivElement | null>
): Promise<string | null> {
  if (!previewRef.current) return null;

  try {
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(previewRef.current, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: null,
      logging: false,
    });

    return canvas.toDataURL("image/png", 0.95);
  } catch (err) {
    console.error("renderDesignToDataUrl failed:", err);
    return null;
  }
}
