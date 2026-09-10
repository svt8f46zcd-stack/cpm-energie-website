"use client";

import dynamic from "next/dynamic";
import { lazy, Suspense, useEffect, useState } from "react";

const SplineCanvas = dynamic(() => import("@/components/CPMEnergyFlowSpline"), {
  ssr: false,
});

const isGitHubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

function EnergyFlowFallback({ staticOnly = false }: { staticOnly?: boolean }) {
  return (
    <div className={`cpm-energy-fallback${staticOnly ? " is-static" : ""}`} aria-hidden="true">
      <div className="cpm-energy-orbit cpm-energy-orbit-a" />
      <div className="cpm-energy-orbit cpm-energy-orbit-b" />
      <div className="cpm-energy-orbit cpm-energy-orbit-c" />
      <div className="cpm-energy-core">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function CPMEnergyFlow() {
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);

  useEffect(() => {
    if (!isGitHubPages) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    updateMotion();
    motionQuery.addEventListener("change", updateMotion);

    const canvas = document.createElement("canvas");
    const hasWebGL = Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }),
    );
    setWebgl(hasWebGL);

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    setWeakDevice(Boolean(connection?.saveData || (memory && memory <= 4) || navigator.hardwareConcurrency <= 4));

    const load = () => setReady(true);
    let timeout = window.setTimeout(load, 1200);
    if ("requestIdleCallback" in window) {
      window.clearTimeout(timeout);
      const idleId = window.requestIdleCallback(load, { timeout: 2200 });
      return () => {
        window.cancelIdleCallback(idleId);
        motionQuery.removeEventListener("change", updateMotion);
      };
    }

    return () => {
      window.clearTimeout(timeout);
      motionQuery.removeEventListener("change", updateMotion);
    };
  }, []);

  if (!isGitHubPages) return null;
  if (reducedMotion || !webgl || weakDevice || !ready) {
    return <EnergyFlowFallback staticOnly={reducedMotion || !webgl || weakDevice} />;
  }

  return (
    <Suspense fallback={<EnergyFlowFallback staticOnly />}>
      <SplineCanvas />
    </Suspense>
  );
}
