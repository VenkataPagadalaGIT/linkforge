"use client";
import * as React from "react";

/**
 * HoloPhoto — 3D hologram-style speaker photo treatment.
 * Neutralizes original branding (color halos), applies cyan glow ring,
 * scanlines, soft chromatic aberration, and lift on hover.
 */
export interface HoloPhotoProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl" | "full"; // tile size presets
  shape?: "square" | "portrait";
  fallback?: string; // initials
  loading?: "eager" | "lazy";
  className?: string;
  /** When true, uses a more vivid hover-only color reveal */
  interactive?: boolean;
}

const sizeMap: Record<NonNullable<HoloPhotoProps["size"]>, string> = {
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-28 h-28",
  xl: "w-40 h-40",
  full: "w-full h-full",
};

const HoloPhoto: React.FC<HoloPhotoProps> = ({
  src,
  alt,
  size = "md",
  shape = "square",
  fallback,
  loading = "lazy",
  className = "",
  interactive = true,
}) => {
  const aspect = shape === "portrait" ? "aspect-[3/4]" : "aspect-square";
  const sizeCls = size === "full" ? aspect : sizeMap[size];

  return (
    <div
      className={`holo-photo relative overflow-hidden bg-foreground/[0.03] ${sizeCls} ${
        interactive ? "holo-interactive" : ""
      } ${className}`}
    >
      {/* Photo layer */}
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          loading={loading}
          className="holo-photo-img absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-display text-foreground/40">
          {fallback || alt.split(" ").slice(0, 2).map((n) => n[0]).join("")}
        </div>
      )}

      {/* Holographic gradient tint */}
      <div className="holo-photo-tint absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Scanlines */}
      <div className="holo-photo-scan absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Edge glow ring */}
      <div className="holo-photo-ring absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Corner brackets — terminal aesthetic */}
      <span className="holo-bracket holo-bracket-tl" aria-hidden="true" />
      <span className="holo-bracket holo-bracket-tr" aria-hidden="true" />
      <span className="holo-bracket holo-bracket-bl" aria-hidden="true" />
      <span className="holo-bracket holo-bracket-br" aria-hidden="true" />
    </div>
  );
};

export default HoloPhoto;
