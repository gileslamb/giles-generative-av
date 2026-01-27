"use client";

import { useEffect, useRef } from "react";

type Mode = "Listen" | "Watch" | "Feel" | "Commission" | "Contact" | "Rain";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  phase: number;
};

function params(mode: Mode) {
  switch (mode) {
    case "Feel":
      return { n: 7800, drift: 0.9, jitter: 0.55 };
    case "Listen":
      return { n: 6600, drift: 0.75, jitter: 0.35 };
    case "Watch":
      return { n: 4800, drift: 1.0, jitter: 0.25 };
    case "Contact":
      return { n: 4200, drift: 0.65, jitter: 0.15 };
    case "Rain":
      // Rain mode uses streaming emitter, params not used but required
      return { n: 0, drift: 0.1, jitter: 0.05 };
  }
}

type ShapeMode = "circular" | "angular";
type ColorPalette = "charcoal" | "blue" | "green" | "umber";

const COLOR_PALETTES: Record<ColorPalette, { bg: string; particle: string }> = {
  charcoal: {
    bg: "rgb(20, 20, 22)",
    particle: "rgb(255, 255, 255)",
  },
  blue: {
    bg: "rgb(15, 20, 30)",
    particle: "rgb(240, 245, 255)",
  },
  green: {
    bg: "rgb(18, 25, 20)",
    particle: "rgb(245, 255, 245)",
  },
  umber: {
    bg: "rgb(25, 20, 18)",
    particle: "rgb(255, 245, 240)",
  },
};

export default function PointCloud({
  mode,
  backgroundScene,
  energy,
  bloom,
  flockStyle,
  shapeMode,
  colorPalette,
}: {
  mode: Mode;
  backgroundScene: "space" | "rain" | "forest";
  energy: number;
  bloom: number;
  flockStyle: "single" | "streams";
  shapeMode: ShapeMode;
  colorPalette: ColorPalette;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointer = useRef({ x: 0, y: 0, active: false });
  const smoothPointer = useRef({ x: 0, y: 0 }); // Smooth mouse position for magnet
  const energyRef = useRef(energy);
  const bloomRef = useRef(bloom);

  // Update refs when props change (without re-running animation)
  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    bloomRef.current = bloom;
  }, [bloom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.active = true;
    };

    const onLeave = () => {
      pointer.current.active = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove); // Listen on window, not just canvas
    window.addEventListener("pointerleave", onLeave);
    resize();
    
    // Initialize smooth pointer to center of screen
    smoothPointer.current.x = w * 0.5;
    smoothPointer.current.y = h * 0.5;

    const paramsResult = params(mode);
    if (!paramsResult) throw new Error(`Invalid mode: ${mode}`);
    const baseDrift = paramsResult.drift;
    const baseJitter = paramsResult.jitter;

    // Initialize particles based on background scene
    const pts: P[] = [];
    const rainParticles: P[] = []; // Active rain particles (grows over time)
    let rainStartTime = performance.now();
    let lastBackgroundScene = backgroundScene;
    let rainSpawnAccumulator = 0; // Accumulator for time-based spawning
    
    // Only initialize standard particles for Space/Forest (Rain uses emitter)
    if (backgroundScene !== "rain") {
      const n = paramsResult.n;
      // Smaller points: 0.6-1.6px radius
      for (let i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * baseDrift * 1.2,
          vy: (Math.random() - 0.5) * baseDrift * 1.2,
          r: Math.random() * 1.0 + 0.6, // Smaller radius: 0.6-1.6px
          a: Math.random() * 0.20 + 0.08, // Base alpha
          phase: Math.random() * Math.PI * 2,
        });
      }

      // Shuffle array once for randomized reveal order
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
    }
    const RAIN_TARGET_COUNT = 5000; // Target number of active rain particles
    const RAIN_RAMP_DURATION = 9.0; // 9 seconds to reach target density
    const RAIN_FALL_SPEED = 2.0; // Fast downward velocity
    const RAIN_SPAWN_Y = -40; // Spawn at top edge
    const RAIN_MIN_SPAWN_INTERVAL = 50; // Start slow: one particle every 50ms
    const RAIN_MAX_SPAWN_INTERVAL = 8; // End fast: one particle every 8ms

    let last = performance.now();

    // Reset function for scene changes
    const resetParticles = (scene: "space" | "rain" | "forest", t: number) => {
      // Clear all particles
      pts.length = 0;
      rainParticles.length = 0;
      
      if (scene === "rain") {
        // Rain: initialize emitter
        rainStartTime = t;
        rainSpawnAccumulator = 0;
      } else {
        // Space or Forest: initialize standard particles
        const paramsResult = params(mode);
        if (paramsResult) {
          const n = paramsResult.n;
          const baseDrift = paramsResult.drift;
          
          for (let i = 0; i < n; i++) {
            pts.push({
              x: Math.random() * w,
              y: Math.random() * h,
              vx: (Math.random() - 0.5) * baseDrift * 1.2,
              vy: (Math.random() - 0.5) * baseDrift * 1.2,
              r: Math.random() * 1.0 + 0.6,
              a: Math.random() * 0.20 + 0.08,
              phase: Math.random() * Math.PI * 2,
            });
          }
          
          // Shuffle for randomized reveal
          for (let i = pts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pts[i], pts[j]] = [pts[j], pts[i]];
          }
        }
      }
    };

    const tick = (t: number) => {
      // Reset particles when background scene changes
      if (backgroundScene !== lastBackgroundScene) {
        resetParticles(backgroundScene, t);
        lastBackgroundScene = backgroundScene;
      }

      const dt = Math.min(32, t - last); // dt in milliseconds
      last = t;
      const time = t * 0.001;
      const dtSec = dt * 0.001; // Convert to seconds for force calculations

      // Read current energy and bloom from refs (no re-render needed)
      const currentEnergy = energyRef.current;
      const currentBloom = bloomRef.current;

      // Bloom drives structure; energy drives texture only
      // Audio reactivity: additive - baseline when off, enhanced when on
      const b = Math.min(1, Math.max(0, currentBloom));
      const e0 = Math.min(1, Math.max(0, currentEnergy));
      const e = 1 - Math.exp(-3.0 * e0);

      // Rain mode: streaming emitter - spawn particles continuously over time
      if (backgroundScene === "rain") {
        const rainElapsed = (t - rainStartTime) * 0.001; // seconds since rain started
        const rampProgress = Math.min(1.0, rainElapsed / RAIN_RAMP_DURATION);
        // EaseInOut curve for smooth ramp
        const eased = rampProgress < 0.5
          ? 2 * rampProgress * rampProgress
          : 1 - Math.pow(-2 * rampProgress + 2, 2) / 2;
        
        // Calculate target count based on ramp
        const targetCount = Math.floor(RAIN_TARGET_COUNT * eased);
        
        // Spawn rate increases over time (interval decreases)
        const spawnInterval = RAIN_MIN_SPAWN_INTERVAL + (RAIN_MAX_SPAWN_INTERVAL - RAIN_MIN_SPAWN_INTERVAL) * (1 - eased);
        
        // Time-based spawning: accumulate time, spawn when threshold reached
        rainSpawnAccumulator += dt;
        while (rainSpawnAccumulator >= spawnInterval && rainParticles.length < targetCount) {
          // Spawn new rain particle at top with random X
          rainParticles.push({
            x: Math.random() * w,
            y: RAIN_SPAWN_Y + Math.random() * 20, // Stagger spawn at top
            vx: 0.02, // Slight constant drift (wind)
            vy: RAIN_FALL_SPEED, // Fast downward
            r: Math.random() * 0.5 + 0.3, // 0.3-0.8px radius (half of standard)
            a: Math.random() * 0.20 + 0.08, // Base alpha
            phase: Math.random() * Math.PI * 2,
          });
          rainSpawnAccumulator -= spawnInterval;
        }
      }

      // Minimal → build: reveal fraction of points (10% → 100%) - Standard modes only
      const reveal = 0.10 + b * 0.90; // start at 10% presence, ramp to 100%
      const drawCount = backgroundScene === "rain" ? 0 : Math.floor(pts.length * reveal); // Don't draw standard particles in Rain mode

      // Mode-specific adjustments
      let modeCohesion = 1.0;
      let modeFlowLateral = 1.0;
      let modeAlphaBoost = 1.0;
      let modeBehavior: "murmuration" | "vortex" | "rain" | "rainMode" = "murmuration";
      
      // Background scene determines behavior (overrides page mode for background)
      if (backgroundScene === "rain") {
        modeAlphaBoost = 1.0;
        modeBehavior = "rainMode"; // Dedicated rain mode (streaming emitter)
      } else if (backgroundScene === "forest") {
        // TODO: Forest will later have leaf/tree aggregation behavior
        // For now, reuse Space behavior but with reset
        modeAlphaBoost = 1.0;
        modeBehavior = "murmuration";
      } else {
        // Space: use page mode behavior
        if (mode === "Listen") {
          modeCohesion = 1.3; // Tighten murmuration
          modeBehavior = "murmuration";
        } else if (mode === "Watch") {
          modeFlowLateral = 1.4; // More lateral/exploratory flow
          modeBehavior = "vortex"; // Vortex swirl around center
        } else if (mode === "Feel") {
          modeAlphaBoost = 1.15; // Increase alpha + warmth
          modeBehavior = "rain"; // Downward drift, respawn at top
        } else {
          modeBehavior = "murmuration"; // Commission, Contact use baseline
        }
      }

      // Murmuration cohesion increases with bloom, adjusted by mode
      const cohesion = (0.002 + b * 0.012) * modeCohesion; // flock "tightness"

      // Combine bloom + energy into intensity signal with higher floor
      const intensity = Math.min(1, 0.30 + b * 0.70) * (0.55 + e * 0.75);

      // Color palette evolution with bloom - more noticeable
      const palette = COLOR_PALETTES[colorPalette];
      const baseBgRgb = palette.bg.match(/\d+/g)?.map(Number) || [20, 20, 22];
      const baseParticleRgb = palette.particle.match(/\d+/g)?.map(Number) || [255, 255, 255];
      
      // Evolve colors with bloom (subtle but noticeable)
      const bloomColorShift = b * 0.15; // 0-15% shift
      const bgRgb = baseBgRgb.map((c, i) => {
        // Shift toward warmer/lighter as bloom increases
        const target = i === 0 ? Math.min(255, c + 8) : Math.min(255, c + 4);
        return Math.floor(c + (target - c) * bloomColorShift);
      });
      const particleRgb = baseParticleRgb.map((c, i) => {
        // Slight warm shift for particles
        const target = i === 0 ? c : Math.min(255, c - 5);
        return Math.floor(c + (target - c) * bloomColorShift * 0.3);
      });

      // Fade trail - much lighter base, reduced slightly by intensity, using palette
      const fade = 0.10 - intensity * 0.04; // base 0.10, down to ~0.06 at full intensity
      ctx.fillStyle = `rgba(${bgRgb[0]},${bgRgb[1]},${bgRgb[2]},${fade})`;
      ctx.fillRect(0, 0, w, h);

      // Smooth mouse position with damping for buttery magnet effect
      const damping = 0.15;
      smoothPointer.current.x += (pointer.current.x - smoothPointer.current.x) * damping;
      smoothPointer.current.y += (pointer.current.y - smoothPointer.current.y) * damping;

      const px = smoothPointer.current.x;
      const py = smoothPointer.current.y;
      const active = pointer.current.active;

      // Energy ONLY modulates flow texture (small, capped), NOT speed
      const flowStrength = Math.min(0.08, 0.04 + currentEnergy * 0.04); // Small, capped flow strength
      const jitterLive = baseJitter * (0.85 + b * 0.25); // Only bloom affects jitter, not energy
      const driftLive = baseDrift * (0.75 + b * 0.70); // Only bloom affects drift, NOT energy

      const vmax = 0.50; // Max velocity clamp to prevent runaway (lowered)

      // Murmuration attractors
      let attractors: Array<{ x: number; y: number }> = [];

      if (flockStyle === "single") {
        // Single: one moving attractor (slow Lissajous)
        const ax = w * (0.5 + 0.18 * Math.sin(time * 0.08));
        const ay = h * (0.5 + 0.18 * Math.cos(time * 0.06));
        attractors = [{ x: ax, y: ay }];
      } else {
        // Streams: 4 moving attractors (different phases)
        attractors = [
          {
            x: w * (0.5 + 0.22 * Math.sin(time * 0.07 + 0.0)),
            y: h * (0.5 + 0.22 * Math.cos(time * 0.05 + 1.1)),
          },
          {
            x: w * (0.5 + 0.24 * Math.sin(time * 0.06 + 2.2)),
            y: h * (0.5 + 0.24 * Math.cos(time * 0.04 + 0.7)),
          },
          {
            x: w * (0.5 + 0.20 * Math.sin(time * 0.08 + 3.4)),
            y: h * (0.5 + 0.20 * Math.cos(time * 0.06 + 2.6)),
          },
          {
            x: w * (0.5 + 0.18 * Math.sin(time * 0.05 + 4.1)),
            y: h * (0.5 + 0.18 * Math.cos(time * 0.07 + 3.3)),
          },
        ];
      }

      // Update and draw only revealed points
      for (let i = 0; i < drawCount; i++) {
        const p = pts[i];
        // Apply stronger velocity damping for smoother, floating motion
        p.vx *= 0.994;
        p.vy *= 0.994;

        // Base jitter - low frequency, not energy-twitchy
        const jx = Math.sin(time * 0.8 + p.phase) * jitterLive;
        const jy = Math.cos(time * 0.75 + p.phase) * jitterLive;

        // Slower, more coherent flow field - energy modulates texture only (small, capped)
        const flowTime = time * 0.25; // Even slower time scale
        
        // Multi-layer flow field for organic, current-like movement
        // Apply lateral adjustment for "Watch" mode
        const lateralScale = modeFlowLateral;
        const flowX1 = Math.sin(p.x * 0.0018 + flowTime) * flowStrength * lateralScale;
        const flowY1 = Math.cos(p.y * 0.0018 + flowTime * 1.1) * flowStrength;
        const flowX2 = Math.sin((p.x + p.y) * 0.0012 + flowTime * 0.6) * flowStrength * 0.5 * lateralScale;
        const flowY2 = Math.cos((p.y - p.x) * 0.0012 + flowTime * 0.7) * flowStrength * 0.5;
        
        const flowX = flowX1 + flowX2;
        const flowY = flowY1 + flowY2;
        
        // Add slow velocity variation for organic feel
        const velVariation = Math.sin(time * 0.3 + p.phase * 2) * 0.08;
        const vxVaried = p.vx + velVariation * baseDrift;
        const vyVaried = p.vy + Math.cos(time * 0.28 + p.phase * 2) * 0.08 * baseDrift;
        
        // Start with base velocity
        let vx = vxVaried;
        let vy = vyVaried;

        // Mode-specific behaviors
        if (modeBehavior === "vortex") {
          // Watch: Vortex swirl around center, center follows mouse
          const centerX = active ? px : w * 0.5;
          const centerY = active ? py : h * 0.5;
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          
          // Radial pull toward center
          const radialPull = 0.0008 * (1 + b * 0.5);
          vx -= (dx / dist) * radialPull;
          vy -= (dy / dist) * radialPull;
          
          // Tangential swirl (perpendicular to radius)
          const swirlStrength = 0.0012 * (1 + b * 0.4);
          vx += (-dy / dist) * swirlStrength;
          vy += (dx / dist) * swirlStrength;
        } else if (modeBehavior === "rain") {
          // Feel: Downward drift, respawn at top - unmistakable rain
          const downwardDrift = 0.25 + b * 0.15; // Stronger downward motion
          vy += downwardDrift * dtSec;
          
          // Minimal lateral flow for rain
          const lateralFlow = Math.sin(p.x * 0.001 + time * 0.2) * 0.02;
          vx += lateralFlow * dtSec;
          
          // Respawn at top when off screen
          if (p.y > h + 50) {
            p.y = -10;
            p.x = Math.random() * w;
            p.vx = (Math.random() - 0.5) * 0.2; // Less lateral spread
            p.vy = 0;
          }
        } else {
          // Murmuration: baseline behavior
          // Apply flow field as gentle steering force to velocity (with dt scaling)
          vx += flowX * dtSec * 2.0; // Gentle steering, dt-scaled
          vy += flowY * dtSec * 2.0;

          // Murmuration: steer toward attractor(s)
          let tx = attractors[0].x;
          let ty = attractors[0].y;

          if (flockStyle === "streams") {
            // Find nearest attractor
            let best = 1e18;
            for (const a of attractors) {
              const dx = a.x - p.x;
              const dy = a.y - p.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < best) {
                best = d2;
                tx = a.x;
                ty = a.y;
              }
            }
          }

          // Pull toward target (cohesion)
          const dxA = tx - p.x;
          const dyA = ty - p.y;
          const distA = Math.sqrt(dxA * dxA + dyA * dyA) + 1;

          vx += (dxA / distA) * cohesion;
          vy += (dyA / distA) * cohesion;

          // Subtle turning wave (bird-like undulation)
          // Angular mode: sharper turns, less orbital
          const waveBase = shapeMode === "angular" ? 0.3 : 0.2;
          const wave = Math.sin((p.x + p.y) * 0.002 + time * 0.5) * (waveBase + b * 0.6);
          const turnStrength = shapeMode === "angular" ? 0.6 : 0.35;
          vx += (-dyA / distA) * cohesion * wave * turnStrength;
          vy += (dxA / distA) * cohesion * wave * turnStrength;
        }

        // Mouse interaction: magnet for standard modes, repel for rain
        if (active && modeBehavior !== "rainMode") {
          // Standard modes: magnetic attractor (unchanged - exact same code)
          const mx = px;
          const my = py;
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;

          const radius = 600; // Influence radius
          const influence = Math.max(0, 1 - dist / radius);
          const inf = influence * influence * influence; // Cubic falloff for smoother gradient

          // Stronger, more noticeable magnet effect - particles gather around cursor
          const pull = (0.20 + b * 0.12) * inf; // bloom increases magnetism
          const orbit = (0.04 + b * 0.04) * inf; // Subtle orbital/swirl motion

          vx += (dx / dist) * pull;
          vy += (dy / dist) * pull;
          vx += (-dy / dist) * orbit; // Perpendicular for swirl
          vy += (dx / dist) * orbit;
        }

        // Clamp velocity to prevent runaway motion
        const vmag = Math.sqrt(vx * vx + vy * vy);
        if (vmag > vmax) {
          vx = (vx / vmag) * vmax;
          vy = (vy / vmag) * vmax;
        }

        // Update position with constant speed (never energy-scaled)
        p.x += (vx + jx) * (dt * 0.028);
        p.y += (vy + jy) * (dt * 0.028);
        
        // Update stored velocity for damping next frame
        p.vx = vx;
        p.vy = vy;

        // wrap (skip for rain modes - handled above)
        if (modeBehavior !== "rain" && modeBehavior !== "rainMode") {
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }

        // Audio reactivity: modulate brightness and size
        const audioBoost = 1.0 + currentEnergy * 0.4; // 0-40% boost
        const audioSizeBoost = 1.0 + currentEnergy * 0.3; // 0-30% size increase
        
        // Alpha + radius with bloom and audio reactivity
        // Apply mode alpha boost for "Feel" mode
        const a = Math.min(1, p.a * (0.40 + intensity * 2.4) * modeAlphaBoost * audioBoost);
        const baseR = p.r * (0.70 + intensity * 1.3);
        const r = baseR * audioSizeBoost; // Audio modulates size slightly

        // Set additive blending for bloom effect
        ctx.globalCompositeOperation = "lighter";

        // Draw bloom/glow pass first (larger, softer)
        const bloomRadius = r * 2.5;
        const bloomAlpha = a * 0.15; // Subtle glow
        ctx.fillStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${bloomAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, bloomRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw main particle as circle (always circles, no squares)
        ctx.fillStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${a})`;
        
        if (modeBehavior === "rain") {
          // Feel mode: Draw streaks (short lines) instead of dots
          const streakLength = Math.abs(p.vy) * 12 + 3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + streakLength);
          ctx.strokeStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${a * 0.9})`;
          ctx.lineWidth = r * 1.2;
          ctx.lineCap = "round";
          ctx.stroke();
        } else {
          // All other modes: Draw circles only (no squares)
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rain mode: update and render streaming emitter particles
      if (backgroundScene === "rain") {
        const windDrift = 0.02; // Slight constant drift
        
        for (let i = 0; i < rainParticles.length; i++) {
          const p = rainParticles[i];
          
          // Set velocity: primarily down (fast), slight drift
          let vx = windDrift;
          let vy = RAIN_FALL_SPEED;
          
          // Mouse repel (umbrella effect) - only in Rain mode
          if (active) {
            const mx = px;
            const my = py;
            const dx = p.x - mx; // Reversed direction for repel
            const dy = p.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            
            const radius = 250; // Smaller radius for rain repel
            const falloff = Math.max(0, 1 - dist / radius);
            const inf = falloff * falloff; // Quadratic falloff
            const strength = 1.5 * inf; // Repel strength (≈8.3× original baseline)
            
            // Repel: push away from cursor
            vx += (dx / dist) * strength;
            vy += (dy / dist) * strength;
            
            // Clamp repel force to prevent runaway
            const vmag = Math.sqrt(vx * vx + vy * vy);
            const maxRepelSpeed = 3.0;
            if (vmag > maxRepelSpeed) {
              vx = (vx / vmag) * maxRepelSpeed;
              vy = (vy / vmag) * maxRepelSpeed;
            }
          }
          
          // Update position
          p.x += vx * (dt * 0.028);
          p.y += vy * (dt * 0.028);
          
          // Recycle: respawn at top when off bottom (continuous stream)
          if (p.y > h + 20) {
            p.y = RAIN_SPAWN_Y + Math.random() * 20; // Respawn at top, staggered
            p.x = Math.random() * w; // New random X
            p.vx = windDrift;
            p.vy = RAIN_FALL_SPEED;
          }
          
          // Render rain particle (small dot with bloom)
          // Audio reactivity: additive - baseline when off, enhanced when on
          const audioBoost = 1.0 + currentEnergy * 0.4; // 0-40% boost
          const a = Math.min(1, p.a * (0.40 + intensity * 2.4) * modeAlphaBoost * audioBoost);
          const baseR = p.r * (0.70 + intensity * 1.3);
          const r = baseR; // Rain particles don't use audio size boost (keep small)
          
          // Set additive blending for bloom effect
          ctx.globalCompositeOperation = "lighter";
          
          // Draw bloom/glow pass
          const bloomRadius = r * 2.5;
          const bloomAlpha = a * 0.12; // Subtle glow
          ctx.fillStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${bloomAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, bloomRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw main particle (small circle)
          ctx.fillStyle = `rgba(${particleRgb[0]},${particleRgb[1]},${particleRgb[2]},${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw cursor ring (halo) - always visible when active, above particles
      if (active) {
        // Use source-over for ring to avoid doubling with lighter mode
        ctx.globalCompositeOperation = "source-over";
        
        // Calculate movement speed for "charge up" effect
        const dx = pointer.current.x - smoothPointer.current.x;
        const dy = pointer.current.y - smoothPointer.current.y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        const speedBoost = Math.min(1.0, speed * 0.01); // Subtle charge with movement
        
        // Single outer ring with subtle glow
        const ringRadius = 40 + speedBoost * 5;
        const ringAlpha = 0.3 + speedBoost * 0.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + speedBoost * 0.2})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset composite operation for next frame
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [mode, backgroundScene, flockStyle, shapeMode, colorPalette]); // Re-run on mode, backgroundScene, flockStyle, shapeMode, or colorPalette change

  return <canvas ref={canvasRef} className="fixed inset-0" aria-hidden="true" />;
}
