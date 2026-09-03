"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function WindTurbine({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (rotor.current) rotor.current.rotation.z = state.clock.getElapsedTime() * speed * 2.1;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, -0.72, 0]}>
        <coneGeometry args={[0.17, 2.05, 20]} />
        <meshStandardMaterial color="#d9e5ed" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#edf8ff" metalness={0.7} roughness={0.18} emissive="#168fd0" emissiveIntensity={0.16} />
      </mesh>
      <group ref={rotor} position={[0, 0.33, 0.19]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.7} roughness={0.18} />
        </mesh>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={i} position={[0, 0.55, 0]} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <boxGeometry args={[0.09, 1.05, 0.035]} />
            <meshStandardMaterial color="#f4f9fc" metalness={0.35} roughness={0.22} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -1.77, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#19b7ff" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function SolarArray({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const panel = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!panel.current) return;
    panel.current.rotation.y = -0.35 + Math.sin(state.clock.getElapsedTime() * 0.22) * 0.035;
  });

  return (
    <group ref={panel} position={position} scale={scale} rotation={[-0.18, -0.35, 0]}>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[2.8, 0.08, 1.65]} />
        <meshStandardMaterial color="#0b2e55" metalness={0.8} roughness={0.2} emissive="#063b6a" emissiveIntensity={0.22} />
      </mesh>
      {[-0.92, -0.46, 0, 0.46, 0.92].map((x) => (
        <mesh key={`v-${x}`} position={[x, -0.065, 0]}>
          <boxGeometry args={[0.018, 0.018, 1.58]} />
          <meshBasicMaterial color="#73dfff" transparent opacity={0.55} />
        </mesh>
      ))}
      {[-0.52, 0, 0.52].map((z) => (
        <mesh key={`h-${z}`} position={[0, -0.06, z]}>
          <boxGeometry args={[2.72, 0.018, 0.018]} />
          <meshBasicMaterial color="#73dfff" transparent opacity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[0.08, 0.62, 0.08]} />
        <meshStandardMaterial color="#aebbc5" metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={3.2} color="#dff7ff" />
      <pointLight position={[-3, 2, 3]} intensity={2.2} color="#19b7ff" />
      <pointLight position={[3, -1, 2]} intensity={1.4} color="#1478ff" />

      <Float speed={0.7} rotationIntensity={0.02} floatIntensity={0.06}>
        <WindTurbine position={[-1.65, 0.35, -0.5]} scale={0.72} speed={0.78} />
        <WindTurbine position={[0, 0.65, 0]} scale={1.05} speed={0.52} />
        <WindTurbine position={[1.7, 0.25, -0.65]} scale={0.68} speed={0.92} />
      </Float>

      <SolarArray position={[0.65, -1.38, 0.65]} scale={0.88} />
      <SolarArray position={[-1.15, -1.62, 0.9]} scale={0.58} />

      <mesh position={[0, -2.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.8, 64]} />
        <meshStandardMaterial color="#041b2b" roughness={0.92} metalness={0.05} />
      </mesh>
      <Sparkles count={70} scale={[5.8, 4.2, 3.5]} size={1.6} speed={0.28} color="#9ce9ff" />
      <Environment preset="night" />
    </>
  );
}

export default function EnergyOrb() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return <div aria-hidden="true" className="h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#b8f1ff,transparent_30%),radial-gradient(circle,#19b7ff66,transparent_68%)] opacity-80 blur-md sm:h-[420px] sm:w-[420px]" />;
  }

  return (
    <div className="h-[430px] w-full max-w-[540px] sm:h-[550px]" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.15, 6.2], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
