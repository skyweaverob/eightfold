"use client";

import { useState, useEffect } from "react";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<"cube" | "hammer" | "shatter" | "zoom" | "done">("cube");

  useEffect(() => {
    const timeline = [
      { phase: "hammer" as const, delay: 800 },
      { phase: "shatter" as const, delay: 1600 },
      { phase: "zoom" as const, delay: 2400 },
      { phase: "done" as const, delay: 3200 },
    ];

    const timers = timeline.map(({ phase: p, delay }) =>
      setTimeout(() => setPhase(p), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "done") {
      onComplete();
    }
  }, [phase, onComplete]);

  // Generate shatter pieces
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 800,
    z: Math.random() * 500 - 250,
    rotateX: Math.random() * 720 - 360,
    rotateY: Math.random() * 720 - 360,
    rotateZ: Math.random() * 720 - 360,
    scale: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 0.2,
  }));

  return (
    <div
      className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center overflow-hidden transition-all duration-700 ${
        phase === "zoom" ? "scale-[20] opacity-0" : "scale-100 opacity-100"
      }`}
      style={{ perspective: "1000px" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900 via-black to-black" />

      {/* The Cube - AI-Driven Hiring */}
      <div
        className={`relative transition-all duration-500 ${
          phase === "shatter" || phase === "zoom" ? "opacity-0 scale-0" : "opacity-100"
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: phase === "cube" ? "rotateX(-15deg) rotateY(-25deg)" : "rotateX(-15deg) rotateY(-25deg)",
        }}
      >
        {/* Cube faces */}
        <div
          className="relative w-48 h-48"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 bg-gray-900 border border-gray-700 flex items-center justify-center"
            style={{ transform: "translateZ(96px)" }}
          >
            <span className="text-gray-400 text-sm font-medium tracking-wide text-center px-4">
              AI-DRIVEN<br />HIRING
            </span>
          </div>
          {/* Back face */}
          <div
            className="absolute inset-0 bg-gray-900 border border-gray-700"
            style={{ transform: "translateZ(-96px) rotateY(180deg)" }}
          />
          {/* Left face */}
          <div
            className="absolute inset-0 bg-gray-800 border border-gray-700 flex items-center justify-center"
            style={{ transform: "rotateY(-90deg) translateZ(96px)" }}
          >
            <span className="text-gray-500 text-xs font-medium">BLACK BOX</span>
          </div>
          {/* Right face */}
          <div
            className="absolute inset-0 bg-gray-800 border border-gray-700 flex items-center justify-center"
            style={{ transform: "rotateY(90deg) translateZ(96px)" }}
          >
            <span className="text-gray-500 text-xs font-medium">OPAQUE</span>
          </div>
          {/* Top face */}
          <div
            className="absolute inset-0 bg-gray-700 border border-gray-600"
            style={{ transform: "rotateX(90deg) translateZ(96px)" }}
          />
          {/* Bottom face */}
          <div
            className="absolute inset-0 bg-gray-950 border border-gray-800"
            style={{ transform: "rotateX(-90deg) translateZ(96px)" }}
          />
        </div>
      </div>

      {/* The Hammer - BOX BREAKER */}
      <div
        className={`absolute transition-all duration-300 ease-in ${
          phase === "cube"
            ? "translate-x-[300px] -translate-y-[200px] rotate-[-45deg] opacity-100"
            : phase === "hammer"
              ? "translate-x-0 translate-y-0 rotate-[15deg] opacity-100"
              : "opacity-0 scale-150"
        }`}
        style={{
          transformOrigin: "bottom right",
        }}
      >
        {/* Hammer head */}
        <div className="relative">
          <div className="w-32 h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg shadow-2xl shadow-blue-500/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-widest">
              BOX BREAKER
            </span>
          </div>
          {/* Hammer handle */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-32 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-lg" />
        </div>
      </div>

      {/* Shatter pieces */}
      {(phase === "shatter" || phase === "zoom") && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1000px" }}>
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-8 h-8 bg-gray-800 border border-gray-600"
              style={{
                animation: `shatter 0.8s ease-out forwards`,
                animationDelay: `${piece.delay}s`,
                "--tx": `${piece.x}px`,
                "--ty": `${piece.y}px`,
                "--tz": `${piece.z}px`,
                "--rx": `${piece.rotateX}deg`,
                "--ry": `${piece.rotateY}deg`,
                "--rz": `${piece.rotateZ}deg`,
                "--scale": piece.scale,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Impact flash */}
      {phase === "hammer" && (
        <div className="absolute inset-0 bg-blue-500 animate-flash" />
      )}

      {/* Text reveal after shatter */}
      {(phase === "shatter" || phase === "zoom") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
          <h1 className="text-6xl font-bold text-white tracking-tight mb-4">
            BOX BREAKER
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Break HR&apos;s Black Box.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes shatter {
          0% {
            transform: translate3d(0, 0, 0) rotateX(0) rotateY(0) rotateZ(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--tx), var(--ty), var(--tz))
                       rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(var(--rz))
                       scale(var(--scale));
            opacity: 0;
          }
        }

        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }

        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
}
