"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Sphere, MeshDistortMaterial, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

function EnergyCore() {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();

  useFrame((state) => {
    if (!core.current || !shell.current) return;
    const t = state.clock.getElapsedTime();
    const targetX = (mouse.x * viewport.width) / 10;
    const targetY = (mouse.y * viewport.height) / 10;

    core.current.position.x += (targetX - core.current.position.x) * 0.035;
    core.current.position.y += (targetY - core.current.position.y) * 0.035;
    shell.current.position.x = core.current.position.x;
    shell.current.position.y = core.current.position.y;

    core.current.rotation.y = t * 0.18;
    core.current.rotation.x = Math.sin(t * 0.25) * 0.12;
    shell.current.rotation.y = -t * 0.08;
    shell.current.rotation.z = Math.sin(t * 0.18) * 0.08;

    const pulse = 1 + Math.sin(t * 1.35) * 0.025;
    core.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.25}>
        <Sphere ref={core} args={[1.34, 96, 96]}>
          <MeshDistortMaterial
            color="#20b8ff"
            emissive="#0877c9"
            emissiveIntensity={1.15}
            roughness={0.12}
            metalness={0.55}
            distort={0.22}
            speed={1.2}
          />
        </Sphere>
      </Float>

      <Sphere ref={shell} args={[1.56, 64, 64]} scale={[1, 1, 1]}>
        <meshPhysicalMaterial
          color="#5fdcff"
          transparent
          opacity={0.1}
          roughness={0.08}
          metalness={0.25}
          transmission={0.7}
          thickness={0.35}
          ior={1.25}
        />
      </Sphere>

      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.72, 0.025, 16, 160]} />
        <meshBasicMaterial color="#69dfff" transparent opacity={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 3.2, 0.2, 0]}>
        <torusGeometry args={[1.9, 0.018, 12, 160]} />
        <meshBasicMaterial color="#1aa8ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3.5, 3.5, 4]} intensity={2.3} color="#7ae5ff" />
      <pointLight position={[-4, -2, -2]} intensity={1.1} color="#167de5" />
      <pointLight position={[0, 0, 5]} intensity={0.8} color="#d8f7ff" />
    </>
  );
}

export default function EnergyOrb() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return <div aria-hidden="true" className="h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#b8f1ff,transparent_30%),radial-gradient(circle,#19b7ff66,transparent_68%)] opacity-80 blur-md sm:h-[420px] sm:w-[420px]" />;
  }

  return (
    <div className="h-[380px] w-full max-w-[470px] sm:h-[500px]" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5], fov: 43 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Lighting />
        <Environment preset="night" />
        <EnergyCore />
        <Sparkles count={70} scale={4.8} size={2} speed={0.35} color="#9ce9ff" />
      </Canvas>
    </div>
  );
}
