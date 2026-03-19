"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  label?: string;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "complete"; url: string }
  | { status: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_EXTENSIONS_LABEL = "JPG, PNG, WebP, GIF";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported file type. Please upload ${ALLOWED_EXTENSIONS_LABEL}.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "File exceeds the 5 MB size limit.";
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageUpload({
  onUpload,
  currentImage,
  label = "Image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>(
    currentImage ? { status: "complete", url: currentImage } : { status: "idle" }
  );
  // dragOver is tracked separately so we don't re-run the upload state machine
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Core upload flow ────────────────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setState({ status: "error", message: validationError });
      return;
    }

    setState({ status: "uploading" });

    try {
      // Step 1: Obtain presigned URL + S3 key
      const presignRes = await fetch("/api/admin/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!presignRes.ok) {
        const data = (await presignRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to obtain upload URL.");
      }

      const { uploadUrl, s3Key } = (await presignRes.json()) as {
        uploadUrl: string;
        s3Key: string;
      };

      // Step 2: PUT file directly to S3 via presigned URL
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error("Upload to storage failed. Please try again.");
      }

      // Step 3: Notify backend that the upload is complete; receive CDN URL
      const completeRes = await fetch("/api/admin/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key }),
      });

      if (!completeRes.ok) {
        const data = (await completeRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to finalize upload.");
      }

      const { url } = (await completeRes.json()) as { url: string };

      setState({ status: "complete", url });
      onUpload(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setState({ status: "error", message });
    }
  }, [onUpload]);

  // ── Event handlers ──────────────────────────────────────────────────────────

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so selecting the same file again triggers onChange
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    // Only clear on true exit — not when crossing child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  function handleRemove() {
    setState({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRetry() {
    setState({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const isUploading = state.status === "uploading";
  const labelId = `image-upload-label-${label.toLowerCase().replace(/\s+/g, "-")}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2">
      {/* Accessible label */}
      <span id={labelId} className="text-sm font-medium text-content-secondary">
        {label}
      </span>

      {/* Hidden file input — controlled via ref */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileInputChange}
        disabled={isUploading}
      />

      {/* ── Complete: image preview ── */}
      {state.status === "complete" && (
        <div className="relative rounded-card overflow-hidden bg-surface-card border border-border">
          <div className="relative w-full aspect-video">
            <Image
              src={state.url}
              alt="Uploaded image preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized
            />
          </div>
          {/* Overlay actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-surface/60 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-surface-card px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-overlay transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg bg-status-closed/20 px-3 py-1.5 text-sm font-medium text-status-closed hover:bg-status-closed/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-status-closed"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* ── Idle / Uploading / Error: drop zone ── */}
      {state.status !== "complete" && (
        <div
          role="button"
          aria-labelledby={labelId}
          aria-describedby={state.status === "error" ? `${labelId}-error` : undefined}
          aria-disabled={isUploading}
          tabIndex={isUploading ? -1 : 0}
          onClick={() => !isUploading && inputRef.current?.click()}
          onKeyDown={isUploading ? undefined : handleKeyDown}
          onDrop={isUploading ? undefined : handleDrop}
          onDragOver={isUploading ? undefined : handleDragOver}
          onDragLeave={isUploading ? undefined : handleDragLeave}
          className={[
            "relative flex flex-col items-center justify-center gap-3",
            "min-h-40 rounded-card border-2 border-dashed",
            "transition-colors duration-150",
            // Idle / hover / drag-over state
            isUploading
              ? "cursor-not-allowed border-border bg-surface-card opacity-70"
              : isDragOver
              ? "cursor-copy border-neon-purple bg-neon-purple/5"
              : "cursor-pointer border-border bg-surface-card hover:border-neon-purple hover:bg-neon-purple/5",
          ].join(" ")}
        >
          {/* Uploading spinner */}
          {isUploading && (
            <>
              <svg
                className="h-8 w-8 animate-spin text-neon-purple"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm text-content-secondary" aria-live="polite">
                Uploading…
              </p>
            </>
          )}

          {/* Idle prompt */}
          {state.status === "idle" && (
            <>
              {/* Upload icon */}
              <svg
                className="h-9 w-9 text-content-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm font-medium text-content-secondary text-center px-4">
                Drop image here or{" "}
                <span className="text-neon-purple underline underline-offset-2">
                  click to upload
                </span>
              </p>
              <p className="text-xs text-content-muted">
                {ALLOWED_EXTENSIONS_LABEL} — max 5 MB
              </p>
            </>
          )}

          {/* Error state */}
          {state.status === "error" && (
            <>
              {/* Error icon */}
              <svg
                className="h-9 w-9 text-status-closed"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p
                id={`${labelId}-error`}
                role="alert"
                className="text-sm font-medium text-status-closed text-center px-4"
              >
                {state.message}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
                className="rounded-lg bg-surface-overlay px-3 py-1.5 text-sm font-medium text-content hover:bg-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
