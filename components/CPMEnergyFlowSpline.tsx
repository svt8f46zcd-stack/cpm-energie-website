"use client";

import { lazy, Suspense } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));
const sceneUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL;

function SceneFallback() {
  return (
    <div className="cpm-energy-fallback is-static" aria-hidden="true">
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

export default function CPMEnergyFlowSpline() {
  if (!sceneUrl) return <SceneFallback />;

  return (
    <div className="cpm-energy-spline" aria-hidden="true">
      <Suspense fallback={<SceneFallback />}>
        <Spline scene={sceneUrl} />
      </Suspense>
    </div>
  );
}
