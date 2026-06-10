import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";

interface CinematicIntroProps {
  onComplete: () => void;
}

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */

const EMERALD = new THREE.Color("#10b981");
const EMERALD_BRIGHT = new THREE.Color("#6ee7b7");
const WHITE = new THREE.Color("#ffffff");

/* ------------------------------------------------------------------ */
/* PARTICLE FIELD — thousands of sparks that collapse into the center */
/* ------------------------------------------------------------------ */

function ParticleField({ phase }: { phase: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const trailsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const phaseRef = useRef(phase);

  const COUNT = 3000;
  const TRAIL_COUNT = 800;

  const { positions, velocities, randoms, trailPositions } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT);
    const tpos = new Float32Array(TRAIL_COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 6 + Math.random() * 14;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      rnd[i] = Math.random();
    }

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 4 + Math.random() * 10;
      tpos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      tpos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      tpos[i * 3 + 2] = r * Math.cos(phi);
    }

    return {
      positions: pos,
      velocities: vel,
      randoms: rnd,
      trailPositions: tpos,
    };
  }, []);

  const posRef = useRef(new Float32Array(positions));
  const velRef = useRef(new Float32Array(velocities));
  const tposRef = useRef(new Float32Array(trailPositions));

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !trailsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const p = phaseRef.current;
    const pos = posRef.current;
    const vel = velRef.current;
    const tpos = tposRef.current;

    const geo = pointsRef.current.geometry;
    const tgeo = trailsRef.current.geometry;
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const tmat = trailsRef.current.material as THREE.PointsMaterial;

    // Phase 1: gentle drift in deep space
    if (p <= 1) {
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3] += vel[i * 3] + Math.sin(t * 0.3 + randoms[i] * 6) * 0.001;
        pos[i * 3 + 1] +=
          vel[i * 3 + 1] + Math.cos(t * 0.2 + randoms[i] * 4) * 0.001;
        pos[i * 3 + 2] += vel[i * 3 + 2];
      }
      mat.opacity = Math.min(mat.opacity + delta * 0.3, 0.6);
      tmat.opacity = 0;
    }

    // Phase 2: particles begin accelerating toward center
    if (p === 2) {
      for (let i = 0; i < COUNT; i++) {
        const x = pos[i * 3],
          y = pos[i * 3 + 1],
          z = pos[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z) + 0.001;
        const pull = 0.04 * (dist / 8);
        vel[i * 3] += (-x / dist) * pull;
        vel[i * 3 + 1] += (-y / dist) * pull;
        vel[i * 3 + 2] += (-z / dist) * pull;
        pos[i * 3] += vel[i * 3];
        pos[i * 3 + 1] += vel[i * 3 + 1];
        pos[i * 3 + 2] += vel[i * 3 + 2];

        if (dist < 0.5) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const r = 5 + Math.random() * 8;
          pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pos[i * 3 + 2] = r * Math.cos(phi);
          vel[i * 3] = vel[i * 3 + 1] = vel[i * 3 + 2] = 0;
        }
      }

      for (let i = 0; i < TRAIL_COUNT; i++) {
        const x = tpos[i * 3],
          y = tpos[i * 3 + 1],
          z = tpos[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z) + 0.001;
        const pull = 0.08;
        tpos[i * 3] += (-x / dist) * pull + Math.sin(t + i) * 0.02;
        tpos[i * 3 + 1] += (-y / dist) * pull + Math.cos(t + i) * 0.02;
        tpos[i * 3 + 2] += (-z / dist) * pull;

        if (dist < 0.3) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const r = 3 + Math.random() * 6;
          tpos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          tpos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          tpos[i * 3 + 2] = r * Math.cos(phi);
        }
      }

      mat.opacity = Math.min(mat.opacity + delta * 0.5, 0.9);
      mat.size = 0.045 + Math.sin(t * 2) * 0.005;
      tmat.opacity = Math.min(tmat.opacity + delta * 1.5, 0.7);
      tmat.size = 0.025;
    }

    // Phase 3: explosion
    if (p === 3) {
      for (let i = 0; i < COUNT; i++) {
        const x = pos[i * 3],
          y = pos[i * 3 + 1],
          z = pos[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z) + 0.001;
        vel[i * 3] += (x / dist) * 0.12 * randoms[i];
        vel[i * 3 + 1] += (y / dist) * 0.12 * randoms[i];
        vel[i * 3 + 2] += (z / dist) * 0.12 * randoms[i];
        vel[i * 3] *= 0.97;
        vel[i * 3 + 1] *= 0.97;
        vel[i * 3 + 2] *= 0.97;
        pos[i * 3] += vel[i * 3];
        pos[i * 3 + 1] += vel[i * 3 + 1];
        pos[i * 3 + 2] += vel[i * 3 + 2];
      }
      mat.opacity *= 0.992;
      tmat.opacity *= 0.985;
    }

    if (p === 4) {
      mat.opacity *= 0.96;
      tmat.opacity *= 0.96;
    }

    geo.attributes.position.needsUpdate = true;
    tgeo.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[posRef.current, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color={EMERALD}
          transparent
          opacity={0}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <points ref={trailsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[tposRef.current, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color={EMERALD_BRIGHT}
          transparent
          opacity={0}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* SHOCKWAVE RINGS                                                     */
/* ------------------------------------------------------------------ */

function ShockwaveRing({ phase }: { phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0.01);
  const opacityRef = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    if (phase === 3) {
      scaleRef.current = 0.01;
      opacityRef.current = 1.2;
      active.current = true;
    }
  }, [phase]);

  useFrame((_, delta) => {
    if (!ref.current || !active.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    scaleRef.current += delta * 9;
    opacityRef.current -= delta * 1.4;
    ref.current.scale.setScalar(scaleRef.current);
    mat.opacity = Math.max(opacityRef.current, 0);
    if (opacityRef.current <= 0) active.current = false;
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.012, 16, 120]} />
      <meshBasicMaterial
        color={WHITE}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function ShockwaveRing2({ phase }: { phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0.01);
  const opacityRef = useRef(0);
  const active = useRef(false);
  const delayRef = useRef(0);

  useEffect(() => {
    if (phase === 3) {
      scaleRef.current = 0.01;
      opacityRef.current = 0;
      active.current = true;
      delayRef.current = 0;
    }
  }, [phase]);

  useFrame((_, delta) => {
    if (!ref.current || !active.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    delayRef.current += delta;
    if (delayRef.current < 0.18) return;
    scaleRef.current += delta * 7;
    opacityRef.current =
      delayRef.current < 0.22
        ? (delayRef.current - 0.18) * 20
        : opacityRef.current - delta * 1.1;
    ref.current.scale.setScalar(scaleRef.current);
    mat.opacity = Math.max(opacityRef.current, 0);
    if (opacityRef.current <= 0 && delayRef.current > 0.4)
      active.current = false;
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.008, 16, 120]} />
      <meshBasicMaterial
        color={EMERALD_BRIGHT}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* CORE GLOW                                                           */
/* ------------------------------------------------------------------ */

function CoreGlow({ phase }: { phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(phase);
  const timeRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const p = phaseRef.current;

    if (p === 1) {
      mat.opacity = 0.04 + Math.sin(t * 1.5) * 0.02;
      ref.current.scale.setScalar(0.3 + Math.sin(t) * 0.05);
    } else if (p === 2) {
      const glow = 0.1 + Math.sin(t * 3) * 0.05;
      mat.opacity = Math.min(mat.opacity + delta * 0.4, 0.6 + glow);
      ref.current.scale.setScalar(
        Math.min(ref.current.scale.x + delta * 0.3, 1.8),
      );
    } else if (p === 3) {
      mat.opacity = Math.max(mat.opacity - delta * 2.5, 0);
      ref.current.scale.setScalar(ref.current.scale.x + delta * 4);
    } else if (p === 4) {
      mat.opacity = Math.max(mat.opacity - delta * 1.5, 0);
    }
  });

  return (
    <mesh ref={ref} scale={[0.3, 0.3, 0.3]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={EMERALD_BRIGHT}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* AMBIENT STARS                                                       */
/* ------------------------------------------------------------------ */

function AmbientStars() {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 1500;

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = -10 - Math.random() * 30;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.003;
    ref.current.rotation.x += delta * 0.001;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.25}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* ORBIT RINGS                                                         */
/* ------------------------------------------------------------------ */

function OrbitRings({ phase }: { phase: number }) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const p = phaseRef.current;
    if (p < 2) return;

    [ring1, ring2, ring3].forEach((r, idx) => {
      if (!r.current) return;
      const mat = r.current.material as THREE.MeshBasicMaterial;
      r.current.rotation.x = t * (0.4 + idx * 0.15);
      r.current.rotation.y = t * (0.3 + idx * 0.1);
      r.current.rotation.z = t * (0.2 + idx * 0.12);

      if (p === 2) {
        mat.opacity = Math.min(mat.opacity + delta * 0.6, 0.15 + idx * 0.05);
      } else if (p === 3) {
        r.current.scale.setScalar(r.current.scale.x + delta * (3 + idx));
        mat.opacity = Math.max(mat.opacity - delta * 2, 0);
      } else if (p === 4) {
        mat.opacity = Math.max(mat.opacity - delta * 1, 0);
      }
    });
  });

  const makeMat = () => (
    <meshBasicMaterial
      color={EMERALD}
      transparent
      opacity={0}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[3.5, 0.005, 16, 100]} />
        {makeMat()}
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[4.2, 0.004, 16, 100]} />
        {makeMat()}
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[5.1, 0.003, 16, 100]} />
        {makeMat()}
      </mesh>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* CAMERA RIG                                                          */
/* ------------------------------------------------------------------ */

function CameraRig({ phase }: { phase: number }) {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;

    if (phase === 1) {
      camera.position.set(0, 0, 18);
      gsap.to(camera.position, { z: 12, duration: 4, ease: "power1.inOut" });
    } else if (phase === 2) {
      gsap.to(camera.position, { z: 7, duration: 3.5, ease: "power2.in" });
    } else if (phase === 3) {
      gsap.killTweensOf(camera.position);
      gsap.fromTo(
        camera.position,
        { z: camera.position.z },
        { z: 14, duration: 0.6, ease: "power4.out" },
      );
      gsap.to(camera.position, {
        z: 10,
        duration: 2.5,
        delay: 0.6,
        ease: "power2.inOut",
      });
    } else if (phase === 4) {
      gsap.to(camera.position, { z: 8, duration: 2, ease: "power2.in" });
    }
  }, [phase, camera]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    camera.position.x = Math.sin(t * 0.08) * 0.4;
    camera.position.y = Math.cos(t * 0.06) * 0.25;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* MAIN COMPONENT                                                      */
/* ------------------------------------------------------------------ */

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const letterboxTopRef = useRef<HTMLDivElement>(null);
  const letterboxBotRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: () => setTimeout(onComplete, 300) });

    // Fade in
    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: "power2.out" },
    );

    // Letterbox bars
    tl.fromTo(
      letterboxTopRef.current,
      { scaleY: 0, transformOrigin: "top" },
      { scaleY: 1, duration: 0.6, ease: "power3.out" },
      0.3,
    );
    tl.fromTo(
      letterboxBotRef.current,
      { scaleY: 0, transformOrigin: "bottom" },
      { scaleY: 1, duration: 0.6, ease: "power3.out" },
      0.3,
    );

    tl.add(() => setPhase(1), 0.5);
    tl.add(() => setPhase(2), 3.5);
    tl.add(() => setPhase(3), 7.2);

    // Flash
    tl.fromTo(
      flashRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.06, ease: "none" },
      7.2,
    );
    tl.to(
      flashRef.current,
      { opacity: 0, duration: 0.5, ease: "power3.out" },
      7.26,
    );

    // Eyebrow
    tl.fromTo(
      eyebrowRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      7.25,
    );

    // Title slams in
    tl.fromTo(
      titleRef.current,
      { opacity: 0, scale: 1.5, filter: "blur(20px)" },
      {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "power4.out",
      },
      7.3,
    );

    // Subtitle
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 16, letterSpacing: "0.8em" },
      {
        opacity: 1,
        y: 0,
        letterSpacing: "0.35em",
        duration: 1.2,
        ease: "power3.out",
      },
      8.0,
    );

    // Scanline sweep
    tl.fromTo(
      scanlineRef.current,
      { top: "-2px", opacity: 0.8 },
      { top: "100%", opacity: 0, duration: 1.4, ease: "power2.inOut" },
      7.3,
    );

    // Exit
    tl.add(() => setPhase(4), 10.5);
    tl.to(
      [letterboxTopRef.current, letterboxBotRef.current],
      { scaleY: 0, duration: 0.5, ease: "power3.in" },
      10.5,
    );
    tl.to(
      [eyebrowRef.current, titleRef.current, subtitleRef.current],
      { opacity: 0, y: -30, duration: 0.8, ease: "power2.in" },
      10.5,
    );
    tl.to(
      containerRef.current,
      { opacity: 0, duration: 1, ease: "power2.inOut" },
      11.0,
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] opacity-0"
      style={{ background: "#000906" }}
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 18], fov: 50, near: 0.1, far: 200 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#000906"]} />
          <AmbientStars />
          <ParticleField phase={phase} />
          <CoreGlow phase={phase} />
          <OrbitRings phase={phase} />
          <ShockwaveRing phase={phase} />
          <ShockwaveRing2 phase={phase} />
          <CameraRig phase={phase} />
        </Canvas>
      </div>

      {/* Letterbox bars */}
      <div
        ref={letterboxTopRef}
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "10vh",
          background: "#000",
          zIndex: 10,
          transformOrigin: "top",
        }}
      />
      <div
        ref={letterboxBotRef}
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "10vh",
          background: "#000",
          zIndex: 10,
          transformOrigin: "bottom",
        }}
      />

      {/* Flash frame */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none opacity-0"
        style={{ background: "#ffffff", zIndex: 20 }}
      />

      {/* Scanline sweep */}
      <div
        ref={scanlineRef}
        className="absolute left-0 right-0 pointer-events-none opacity-0"
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, rgba(16,185,129,0.9) 30%, rgba(255,255,255,0.8) 50%, rgba(16,185,129,0.9) 70%, transparent)",
          zIndex: 25,
          top: 0,
        }}
      />

      {/* Title block */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 15 }}
      >
        {/* Eyebrow */}
        <div
          ref={eyebrowRef}
          className="mb-5 flex items-center gap-4 opacity-0"
        >
          <div
            style={{
              width: 48,
              height: 1,
              background: "#10b981",
              opacity: 0.5,
            }}
          />
          <span
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.28em",
              color: "#10b981",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            Sports Intelligence
          </span>
          <div
            style={{
              width: 48,
              height: 1,
              background: "#10b981",
              opacity: 0.5,
            }}
          />
        </div>

        <h1
          ref={titleRef}
          className="select-none text-center opacity-0"
          style={{
            fontFamily:
              "'Arial Black', 'Arial Bold', 'Impact', system-ui, sans-serif",
            fontSize: "clamp(5rem, 18vw, 14rem)",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            color: "#ffffff",
            textShadow: `
              0 0 30px rgba(16, 185, 129, 1),
              0 0 60px rgba(16, 185, 129, 0.7),
              0 0 120px rgba(16, 185, 129, 0.4),
              0 0 200px rgba(16, 185, 129, 0.2)
            `,
          }}
        >
          RISBO
        </h1>

        <p
          ref={subtitleRef}
          className="select-none text-center opacity-0 mt-6"
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "clamp(0.6rem, 1.2vw, 0.8rem)",
            fontWeight: 400,
            letterSpacing: "0.35em",
            color: "#6ee7b7",
            textTransform: "uppercase",
            textShadow: "0 0 30px rgba(16, 185, 129, 0.8)",
          }}
        >
          Est. 2025
        </p>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.9) 100%)",
          zIndex: 5,
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
          opacity: 0.35,
          zIndex: 6,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
