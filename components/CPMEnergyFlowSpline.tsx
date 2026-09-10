"use client";

function SceneFallback() {
  return (
    <div className="cpm-energy-fallback" aria-hidden="true">
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
  return <SceneFallback />;
}
