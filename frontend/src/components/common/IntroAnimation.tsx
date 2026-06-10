import { useEffect, useMemo, useState, type CSSProperties } from "react";

interface IntroAnimationProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  angle: number; // degrees, 0-360
  distance: number; // px, 80-250
  delay: number; // s
  size: number; // px, 2-5
  color: string;
}

const PARTICLE_COUNT = 40;
const FADE_AT = 2600; // ms — start fade-out
const TOTAL_DURATION = 3200; // ms — unmount

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [exiting, setExiting] = useState(false);

  // Particles are generated once — randomized angle, distance, delay, size, color.
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = Math.random() * 360;
      const distance = 80 + Math.random() * 170; // 80 - 250px
      const delay = Math.random() * 0.25; // staggered burst
      const size = 2 + Math.random() * 3; // 2 - 5px
      const color = Math.random() > 0.5 ? "#10b981" : "#ffffff";
      return { id: i, angle, distance, delay, size, color };
    });
  }, []);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setExiting(true), FADE_AT);
    const doneTimer = window.setTimeout(() => onComplete(), TOTAL_DURATION);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.5s ease-in",
        pointerEvents: "none",
      }}
    >
      <style>{keyframes}</style>

      {/* Center stage — everything is anchored to the exact center */}
      <div style={{ position: "relative", width: 0, height: 0 }}>
        {/* 1. The seed dot that pulses in at 0.15s */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: "50%",
            backgroundColor: "#10b981",
            boxShadow: "0 0 20px #10b981, 0 0 40px #10b981",
            opacity: 0,
            animation: "risbo-dot 1s ease-out 0.15s forwards",
          }}
        />

        {/* 2. Radial particle burst at ~0.4s */}
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;
          return (
            <div
              key={p.id}
              style={
                {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  borderRadius: "50%",
                  backgroundColor: p.color,
                  boxShadow:
                    p.color === "#10b981" ? "0 0 6px #10b981" : "0 0 4px #ffffff",
                  opacity: 0,
                  "--tx": `${tx}px`,
                  "--ty": `${ty}px`,
                  animation: `risbo-particle 1.6s ease-out ${0.4 + p.delay}s forwards`,
                } as CSSProperties
              }
            />
          );
        })}

        {/* Logo lockup + tagline — centered stack */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* 3. LOGO — full brand lockup (brain + RISBO), transparent PNG,
                punches in at 0.9s. */}
          <img
            src="/logo.png"
            alt="Risbo"
            style={{
              width: "clamp(340px, 52vw, 640px)",
              height: "auto",
              display: "block",
              filter: "drop-shadow(0 0 55px rgba(16,185,129,0.5))",
              opacity: 0,
              transform: "scale(0.6)",
              animation:
                "risbo-logo 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards",
            }}
          />

          {/* 4. Tagline — fades in at 1.6s */}
          <p
            style={{
              margin: "0.1em 0 0 0",
              textAlign: "center",
              fontFamily:
                "'DM Sans', system-ui, -apple-system, sans-serif",
              fontSize: "clamp(12px, 1.5vw, 17px)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.4em",
              color: "#9ca3af",
              opacity: 0,
              animation: "risbo-subtitle 0.7s ease-out 1.6s forwards",
            }}
          >
            Outsmart The Competition
          </p>
        </div>
      </div>
    </div>
  );
}

const keyframes = `
@keyframes risbo-dot {
  0%   { opacity: 0; transform: scale(0); }
  30%  { opacity: 1; transform: scale(1.3); }
  55%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.8); }
}

@keyframes risbo-particle {
  0%   { opacity: 0; transform: translate(0, 0) scale(1); }
  15%  { opacity: 1; }
  60%  { opacity: 1; }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0.4);
  }
}

@keyframes risbo-logo {
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes risbo-subtitle {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

export default IntroAnimation;
