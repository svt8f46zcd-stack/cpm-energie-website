"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const EnergyOrb = dynamic(() => import("./EnergyOrb"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full max-w-[420px] animate-pulse rounded-full bg-green-100 sm:h-[420px]" />
  ),
});

export default function EnergyOrbSection() {
  return (
    <div className="flex w-full items-center justify-center">
      <Suspense fallback={null}>
        <EnergyOrb />
      </Suspense>
    </div>
  );
}
