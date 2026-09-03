"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Orb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, mouse } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.15;
    meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;

    const targetX = (mouse.x * viewport.width) / 12;
    const targetY = (mouse.y * viewport.height) / 12;
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.03;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.03;

    const scale = 1 + Math.sin(t * 1.2) * 0.03;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <Sphere ref={meshRef} args={[1.4, 128, 128]}>
      <MeshDistortMaterial
        color="#22c55e"
        emissive="#16a34a"
        emissiveIntensity={0.6}
        roughness={0.15}
        metalness={0.3}
        distort={0.35}
        speed={1.8}
      />
    </Sphere>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={1.4} color="#4ade80" />
      <pointLight position={[-4, -3, -2]} intensity={0.8} color="#0ea5e9" />
    </>
  );
}

export default function EnergyOrb() {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="h-[320px] w-[320px] rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-sky-500 opacity-70 blur-2xl"
      />
    );
  }

  return (
    <div className="h-[320px] w-full max-w-[420px] sm:h-[420px]" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Lights />
        <Orb />
        <Sparkles count={40} scale={4} size={2.5} speed={0.4} color="#86efac" />
      </Canvas>
    </div>
  );
}
