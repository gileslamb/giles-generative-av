"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function SiteBrand() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="pointer-events-none fixed left-5 top-5 z-30 flex flex-col gap-0">
      <a href="/" className="pointer-events-auto">
        <img
          src="/GL LOGO Cream Trans.png"
          alt="Giles Lamb"
          className="w-[50px] sm:w-[70px] h-auto opacity-90 hover:opacity-100 transition-opacity"
        />
      </a>
      <div
        className="mt-1 text-[9px] sm:text-[10px] tracking-[0.15em] text-white/30 uppercase pointer-events-none"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        Giles Lamb
      </div>
    </div>
  );
}
