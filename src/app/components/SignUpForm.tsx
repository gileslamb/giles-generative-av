"use client";

import React, { useState } from "react";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("done");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="text-white/50 text-xs">
        Noted. I&apos;ll be in touch when something&apos;s happening.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email"
        required
        className="bg-transparent border-b border-white/15 text-xs text-white/60 placeholder-white/25 px-1 py-0.5 outline-none focus:border-white/40 w-36"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        {status === "sending" ? "..." : "Stay in touch"}
      </button>
      {status === "error" && (
        <span className="text-xs text-red-400/60">Try again</span>
      )}
    </form>
  );
}
