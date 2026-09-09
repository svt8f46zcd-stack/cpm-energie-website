"use client";

import { useEffect, useState } from "react";
import { DesktopHero } from "@/components/DesktopHero";
import { MobileHero } from "@/components/MobileHero";

type BillFlowState = "idle" | "uploading" | "analyzing" | "success" | "error";

export function ResponsiveHero({ onStatusChange }: { onStatusChange?: (status: BillFlowState) => void }) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return mobile ? <MobileHero onStatusChange={onStatusChange} /> : <DesktopHero onStatusChange={onStatusChange} />;
}
