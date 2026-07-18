"use client";
import { useEffect, useState } from "react";

export type GLPower = "high-performance" | "default";

export interface WebGLStatus {
  /** null while probing, false = no usable WebGL, true = usable */
  ok: boolean | null;
  /** a powerPreference that produced a live context — feed it to the real Canvas */
  power: GLPower;
}

/** True if a probe context with these attributes comes back live. */
function contextWorks(power: GLPower): boolean {
  try {
    const canvas = document.createElement("canvas");
    const attrs: WebGLContextAttributes = {
      powerPreference: power,
      failIfMajorPerformanceCaveat: false,
      alpha: false,
    };
    const gl = (canvas.getContext("webgl2", attrs) ||
      canvas.getContext("webgl", attrs)) as WebGLRenderingContext | null;
    if (!gl || gl.isContextLost() || !gl.getParameter(gl.VERSION)) return false;
    // Free the probe context immediately; browsers cap live WebGL contexts.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Probe WebGL the way the real Canvas will request it. Locked-down enterprise
 * browsers (Edge with hardware acceleration disabled, VDI without a GPU, GPU
 * driver blocklists) commonly grant a plain context but reject a
 * "high-performance" one — which left our canvases blank. Try high-performance
 * first, fall back to a default/software context, report unusable only when
 * neither works so the caller can show real content instead of a black box.
 */
export function useWebGL(): WebGLStatus {
  const [status, setStatus] = useState<WebGLStatus>({ ok: null, power: "high-performance" });
  useEffect(() => {
    if (contextWorks("high-performance")) setStatus({ ok: true, power: "high-performance" });
    else if (contextWorks("default")) setStatus({ ok: true, power: "default" });
    else setStatus({ ok: false, power: "default" });
  }, []);
  return status;
}
