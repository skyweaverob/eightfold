"use client";

import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState<"cube" | "spin" | "hammer" | "shatter" | "zoom" | "done">("cube");
  const isMobile = useIsMobile();

  // Responsive sizes
  const cubeSize = isMobile ? 180 : 320;
  const cubeHalf = cubeSize / 2;
  const pieceCount = isMobile ? 80 : 150;
  const spreadMultiplier = isMobile ? 0.5 : 1;

  useEffect(() => {
    // 8 second dramatic intro with spin
    const timeline = [
      { phase: "spin" as const, delay: 500 },
      { phase: "hammer" as const, delay: 3500 },
      { phase: "shatter" as const, delay: 4300 },
      { phase: "zoom" as const, delay: 6800 },
      { phase: "done" as const, delay: 8000 },
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

  // Generate shatter pieces - fewer on mobile
  const pieces = useMemo(() => Array.from({ length: pieceCount }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 2000 * spreadMultiplier,
    y: (Math.random() - 0.5) * 2000 * spreadMultiplier,
    z: (Math.random() * 1500 - 750) * spreadMultiplier,
    rotateX: Math.random() * 1440 - 720,
    rotateY: Math.random() * 1440 - 720,
    rotateZ: Math.random() * 1440 - 720,
    scale: Math.random() * 0.3 + 0.1,
    delay: Math.random() * 0.15,
    size: (Math.random() * 30 + 10) * (isMobile ? 0.6 : 1),
  })), [pieceCount, spreadMultiplier, isMobile]);

  return (
    <div
      className={`fixed inset-0 bg-black z-[9999] flex items-center justify-center overflow-hidden transition-all ${
        phase === "zoom" ? "scale-[30] opacity-0 duration-[1200ms]" : "scale-100 opacity-100 duration-700"
      }`}
      style={{ perspective: isMobile ? "800px" : "1500px" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-gray-900 via-black to-black" />

      {/* The Cube - AI-Driven Hiring */}
      <div
        className={`relative ${
          phase === "shatter" || phase === "zoom" ? "opacity-0 scale-0 transition-all duration-700" : "opacity-100"
        } ${phase === "spin" ? "animate-cube-spin" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: phase === "cube"
            ? "rotateX(-20deg) rotateY(-30deg)"
            : phase === "spin"
              ? undefined
              : phase === "hammer"
                ? "rotateX(-20deg) rotateY(-30deg) scale(1.05)"
                : "rotateX(-20deg) rotateY(-30deg) scale(1.05)",
        }}
      >
        {/* Cube faces */}
        <div
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transformStyle: "preserve-3d",
            position: "relative",
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              transform: `translateZ(${cubeHalf}px)`,
              background: "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)",
              boxShadow: "inset 0 0 100px rgba(255,255,255,0.05), 0 0 60px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)",
              }}
            />
            <span className={`text-gray-300 ${isMobile ? "text-lg" : "text-2xl"} font-bold tracking-wider text-center px-4 relative z-10`}>
              AI-DRIVEN<br />HIRING
            </span>
          </div>
          {/* Back face */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              transform: `translateZ(-${cubeHalf}px) rotateY(180deg)`,
              background: "linear-gradient(145deg, #0d0d0d 0%, #000000 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span className={`text-gray-300 ${isMobile ? "text-lg" : "text-2xl"} font-bold tracking-wider text-center px-4 relative z-10`}>
              AI-DRIVEN<br />HIRING
            </span>
          </div>
          {/* Left face */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              transform: `rotateY(-90deg) translateZ(${cubeHalf}px)`,
              background: "linear-gradient(180deg, #1a1a1a 0%, #080808 100%)",
              boxShadow: "inset 0 0 60px rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%)",
              }}
            />
            <span className={`text-gray-300 ${isMobile ? "text-lg" : "text-2xl"} font-bold tracking-wider text-center px-4 relative z-10`}>
              AI-DRIVEN<br />HIRING
            </span>
          </div>
          {/* Right face */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              transform: `rotateY(90deg) translateZ(${cubeHalf}px)`,
              background: "linear-gradient(180deg, #151515 0%, #050505 100%)",
              boxShadow: "inset 0 0 60px rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className={`text-gray-300 ${isMobile ? "text-lg" : "text-2xl"} font-bold tracking-wider text-center px-4 relative z-10`}>
              AI-DRIVEN<br />HIRING
            </span>
          </div>
          {/* Top face */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              transform: `rotateX(90deg) translateZ(${cubeHalf}px)`,
              background: "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 30%, #0a0a0a 100%)",
              boxShadow: "inset 0 0 80px rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)",
              }}
            />
            <span className={`text-gray-300 ${isMobile ? "text-lg" : "text-2xl"} font-bold tracking-wider text-center px-4 relative z-10`}>
              AI-DRIVEN<br />HIRING
            </span>
          </div>
          {/* Bottom face */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              transform: `rotateX(-90deg) translateZ(${cubeHalf}px)`,
              background: "#000000",
              border: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <span className={`text-gray-300 ${isMobile ? "text-lg" : "text-2xl"} font-bold tracking-wider text-center px-4 relative z-10`}>
              AI-DRIVEN<br />HIRING
            </span>
          </div>
        </div>
      </div>

      {/* The Hammer - BOX BREAKER */}
      <div
        className={`absolute transition-all ease-in ${
          phase === "cube" || phase === "spin"
            ? isMobile
              ? "translate-x-[200px] -translate-y-[180px] rotate-[-60deg] opacity-0 duration-[1200ms]"
              : "translate-x-[400px] -translate-y-[350px] rotate-[-60deg] opacity-0 duration-[1200ms]"
            : phase === "hammer"
              ? isMobile
                ? "translate-x-[-10px] translate-y-[10px] rotate-[25deg] opacity-100 duration-[700ms]"
                : "translate-x-[-20px] translate-y-[20px] rotate-[25deg] opacity-100 duration-[700ms]"
              : "opacity-0 scale-[2] duration-300"
        }`}
        style={{
          transformOrigin: "bottom right",
        }}
      >
        {/* Hammer head */}
        <div className="relative">
          <div
            className={`${isMobile ? "w-32 h-14" : "w-52 h-24"} rounded-xl flex items-center justify-center`}
            style={{
              background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)",
              boxShadow: isMobile
                ? "0 0 40px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)"
                : "0 0 80px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4), inset 0 2px 0 rgba(255,255,255,0.2)",
            }}
          >
            <div
              className="absolute inset-0 rounded-xl opacity-40"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
              }}
            />
            <span className={`text-white ${isMobile ? "text-xs" : "text-sm"} font-black tracking-[0.2em] relative z-10`}>
              BOX BREAKER
            </span>
          </div>
          {/* Hammer handle */}
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 ${isMobile ? "w-4 h-28" : "w-6 h-48"} rounded-b-xl`}
            style={{
              background: "linear-gradient(90deg, #92400e 0%, #b45309 30%, #d97706 50%, #b45309 70%, #92400e 100%)",
              boxShadow: "inset 2px 0 4px rgba(255,255,255,0.1), inset -2px 0 4px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      {/* Shatter pieces */}
      {(phase === "shatter" || phase === "zoom") && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: isMobile ? "1000px" : "2000px" }}>
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute"
              style={{
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                background: `linear-gradient(${Math.random() * 360}deg, #1a1a1a, #0a0a0a, #000)`,
                boxShadow: "inset 0 0 10px rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.1)",
                animation: `shatter 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
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
        <>
          <div className="absolute inset-0 bg-white animate-flash-white" />
          <div className="absolute inset-0 bg-blue-500 animate-flash" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-0 h-0 rounded-full border-4 border-blue-400 ${isMobile ? "animate-shockwave-mobile" : "animate-shockwave"}`} />
          </div>
        </>
      )}

      {/* Text reveal after shatter */}
      {(phase === "shatter" || phase === "zoom") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn px-4">
          <h1
            className={`${isMobile ? "text-4xl" : "text-8xl"} font-black text-white tracking-tight mb-4 md:mb-6 text-center`}
            style={{
              textShadow: isMobile
                ? "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)"
                : "0 0 60px rgba(59, 130, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)",
            }}
          >
            BOX BREAKER
          </h1>
          <p className={`${isMobile ? "text-lg" : "text-2xl"} text-gray-300 font-light tracking-wide text-center`}>
            Break HR&apos;s Black Box.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes cube-spin {
          0% {
            transform: rotateX(-20deg) rotateY(-30deg);
          }
          100% {
            transform: rotateX(-20deg) rotateY(330deg);
          }
        }

        .animate-cube-spin {
          animation: cube-spin 2.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes shatter {
          0% {
            transform: translate3d(0, 0, 0) rotateX(0) rotateY(0) rotateZ(0) scale(1);
            opacity: 1;
          }
          20% {
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
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }

        @keyframes flash-white {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-flash {
          animation: flash 0.5s ease-out forwards;
        }

        .animate-flash-white {
          animation: flash-white 0.15s ease-out forwards;
        }

        @keyframes shockwave {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
            border-width: 8px;
          }
          100% {
            width: 800px;
            height: 800px;
            opacity: 0;
            border-width: 2px;
          }
        }

        @keyframes shockwave-mobile {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
            border-width: 6px;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
            border-width: 1px;
          }
        }

        .animate-shockwave {
          animation: shockwave 0.6s ease-out forwards;
        }

        .animate-shockwave-mobile {
          animation: shockwave-mobile 0.6s ease-out forwards;
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
}
