"use client";

import Image from "next/image";
import { useState } from "react";
import { CTASection } from "@/components/CTASection";
import { BillFeatures } from "@/components/BillFeatures";
import { BillFlow } from "@/components/BillFlow";
import { ResponsiveHero } from "@/components/ResponsiveHero";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";

export default function Home() {
  const [billFlowState, setBillFlowState] = useState<BillFlowState>("idle");

  return (
    <>
      <div id="rechnung-pruefen">
        <ResponsiveHero onStatusChange={setBillFlowState} />
      </div>

      <BillFlow status={billFlowState} />
      <BillFeatures />

      <section className="container py-20 md:py-28" aria-labelledby="personal-heading">
        <div className="grid items-center gap-12 md:grid-cols-[.9fr_1.1fr] md:gap-20">
          <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#071321] shadow-2xl shadow-black/30">
            <div className="aspect-[4/5] overflow-hidden bg-[#0b1b30]">
              <Image src="/cpm-energie-website/cristiano.svg" alt="Cristiano Moreira, persönlicher Ansprechpartner von CPM Energie" width={600} height={900} priority={false} className="h-full w-full object-cover object-center" />
            </div>
          </div>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#66d5ff]">CPM Energie</p>
            <h2 id="personal-heading" className="mt-3 text-3xl font-black tracking-[-.04em] text-white md:text-5xl">Digital geprüft. Persönlich erklärt.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">Deine Rechnung wird digital strukturiert, damit die wichtigen Tarifdaten schnell verständlich werden.</p>
            <p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">Wenn du danach Fragen hast, bekommst du einen persönlichen Ansprechpartner statt einer anonymen Tarifliste.</p>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
