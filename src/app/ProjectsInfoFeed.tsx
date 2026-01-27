"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { getSortedProjects } from "@/content/projects";

export default function ProjectsInfoFeed({ 
  onLineTypingStart, 
  onLineTypingEnd 
}: { 
  onLineTypingStart?: () => void;
  onLineTypingEnd?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);
  const isTypingActiveRef = useRef(false);
  const timeLimitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build full text with exact spacing
  useEffect(() => {
    const projects = getSortedProjects();
    const lines: string[] = [];
    
    projects.forEach((project, projectIndex) => {
      if (projectIndex > 0) {
        // Exactly 3 blank lines between projects
        lines.push("");
        lines.push("");
        lines.push("");
      }
      lines.push(`Name: ${project.name}`);
      lines.push(`Client: ${project.client}`);
      lines.push(`Runtime: ${project.runtime}`);
      lines.push(`Info: ${project.description}`);
      if (project.link) {
        lines.push(`Link: ${project.link}`);
      }
    });
    
    fullTextRef.current = lines.join("\n");
    currentIndexRef.current = 0;
    setDisplayedText("");
    isCompleteRef.current = false;
    setShowCursor(false);
    
    // Track current line for typing sound
    let currentLineIndex = -1;
    let lastCharWasNewline = false;
    
    // Start typing
    const startTyping = () => {
      // Guard: typing tick function must check isTypingActive at top
      if (!isTypingActiveRef.current) return;
      
      if (currentIndexRef.current >= fullTextRef.current.length) {
        // TYPING COMPLETE
        console.log("TYPING COMPLETE");
        isTypingActiveRef.current = false;
        isCompleteRef.current = true;
        setShowCursor(true);
        
        // Clear timers
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (timeLimitRef.current) {
          clearTimeout(timeLimitRef.current);
          timeLimitRef.current = null;
        }
        
        // Stop typing bed on final line end
        if (currentLineIndex >= 0 && onLineTypingEnd) {
          onLineTypingEnd();
        }
        return;
      }

      const char = fullTextRef.current[currentIndexRef.current];
      const isNewline = char === "\n";
      
      // Detect line start - BEFORE typing the character
      if (lastCharWasNewline || currentIndexRef.current === 0) {
        // New line starting - stop previous line and start new one immediately
        if (currentLineIndex >= 0 && onLineTypingEnd) {
          // End previous line immediately
          onLineTypingEnd();
        }
        currentLineIndex++;
        // Start new line immediately
        if (onLineTypingStart) onLineTypingStart();
      }
      
      // Detect line end - BEFORE typing the newline character
      if (isNewline && currentLineIndex >= 0 && onLineTypingEnd) {
        // Line ending - stop sound immediately
        onLineTypingEnd();
      }
      
      lastCharWasNewline = isNewline;

      // Fast typing with slight randomness (7-13ms per character, 5× faster)
      const baseDelay = 7;
      const randomVariation = Math.random() * 6;
      const delay = baseDelay + randomVariation;

      timeoutRef.current = setTimeout(() => {
        // Guard: check isTypingActive at top of tick function
        if (!isTypingActiveRef.current) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return;
        }
        
        currentIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.substring(0, currentIndexRef.current));
        startTyping();
      }, delay);
    };

    // Set typing active and start
    isTypingActiveRef.current = true;
    console.log("TYPING START");
    startTyping();

    // Start 10-second timer - stops typing after 10 seconds
    timeLimitRef.current = setTimeout(() => {
      // TYPING STOP (10s limit)
      console.log("TYPING STOP (10s limit)");
      isTypingActiveRef.current = false;
      
      // Clear typing timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, 10000);

    return () => {
      // Cleanup: set inactive and clear all timers
      isTypingActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (timeLimitRef.current) {
        clearTimeout(timeLimitRef.current);
        timeLimitRef.current = null;
      }
    };
  }, [onLineTypingStart, onLineTypingEnd]);

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [showCursor]);

  // Parse and render text with colors
  const renderText = () => {
    const lines = displayedText.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      if (line === "") {
        elements.push(<div key={lineIndex} className="h-4" />);
        return;
      }

      if (line.startsWith("Name: ")) {
        const name = line.substring(6);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Name:</span>
            <span className="text-red-400">{name}</span>
          </div>
        );
      } else if (line.startsWith("Link: ")) {
        const link = line.substring(6);
        const isComplete = isCompleteRef.current;
        const hasLink = link && link.trim() !== "";
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Link:</span>
            {isComplete && hasLink ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                {link}
              </a>
            ) : (
              <span className="text-green-400">{link || "—"}</span>
            )}
          </div>
        );
      } else if (line.startsWith("Client: ")) {
        const client = line.substring(8);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Client:</span>
            <span className="text-white">{client}</span>
          </div>
        );
      } else if (line.startsWith("Runtime: ")) {
        const runtime = line.substring(9);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Runtime:</span>
            <span className="text-white">{runtime}</span>
          </div>
        );
      } else if (line.startsWith("Info: ")) {
        const info = line.substring(6);
        elements.push(
          <div key={lineIndex} className="flex items-baseline gap-2">
            <span className="text-white/50">Info:</span>
            <span className="text-white">{info}</span>
          </div>
        );
      } else {
        elements.push(
          <div key={lineIndex} className="text-white">{line}</div>
        );
      }
    });

    return elements;
  };

  return (
    <div
      className="fixed left-6 top-[140px] z-10 pointer-events-auto"
      style={{
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        textShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        maxWidth: "700px",
        maxHeight: "calc(100vh - 180px)", // Constrain height to viewport
        letterSpacing: "0.01em",
        overflowY: "auto",
        overflowX: "hidden",
        scrollBehavior: "smooth",
      }}
    >
      <div className="space-y-0.5">
        {renderText()}
        {showCursor && (
          <span className="inline-block w-2 h-4 bg-white/80 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
}
