"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Blade() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.035, 0);
    shape.bezierCurveTo(0.02, 0.25, 0.1, 0.65, 0.22, 1.18);
    shape.bezierCurveTo(0.32, 1.58, 0.52, 1.9, 0.74, 2.12);
    shape.lineTo(0.34, 2.22);
    shape.bezierCurveTo(0.16, 1.82, 0.05, 1.45, -0.02, 1.05);
    shape.bezierCurveTo(-0.08, 0.58, -0.08, 0.2, -0.035, 0);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.018, bevelSegments: 2 });
  }, []);

  return <mesh geometry={geometry} position={[-0.03, 0, 0]} rotation={[0, 0, -0.12]}><meshStandardMaterial color="#f2f7fb" metalness={0.72} roughness={0.22} /></mesh>;
}

function WindTurbine({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (rotor.current) rotor.current.rotation.z = state.clock.getElapsedTime() * speed * 1.55;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, -0.95, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.2, 2.7, 32]} />
        <meshStandardMaterial color="#d8e1e8" metalness={0.82} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.39, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.13, 0.52, 8, 20]} />
        <meshStandardMaterial color="#eaf2f7" metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.39, 0.18]}>
        <sphereGeometry args={[0.16, 28, 20]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.16} emissive="#138bd0" emissiveIntensity={0.12} />
      </mesh>
      <group ref={rotor} position={[0, 0.39, 0.25]}>
        {[0, 1, 2].map((i) => <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}><Blade /></group>)}
      </group>
      <mesh position={[0, -2.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 48]} />
        <meshBasicMaterial color="#19b7ff" transparent opacity={0.13} />
      </mesh>
    </group>
  );
}

function SolarArray({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const panel = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!panel.current) return;
    panel.current.rotation.y = -0.34 + Math.sin(state.clock.getElapsedTime() * 0.18) * 0.025;
  });

  return (
    <group ref={panel} position={position} scale={scale} rotation={[-0.24, -0.34, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.35, 0.075, 1.9]} />
        <meshStandardMaterial color="#071d38" metalness={0.88} roughness={0.17} emissive="#063b6a" emissiveIntensity={0.2} />
      </mesh>
      {[-1.34, -0.67, 0, 0.67, 1.34].map((x) => <mesh key={`v-${x}`} position={[x, 0.045, 0]}><boxGeometry args={[0.014, 0.012, 1.82]} /><meshBasicMaterial color="#70dcff" transparent opacity={0.55} /></mesh>)}
      {[-0.63, -0.21, 0.21, 0.63].map((z) => <mesh key={`h-${z}`} position={[0, 0.045, z]}><boxGeometry args={[3.28, 0.012, 0.014]} /><meshBasicMaterial color="#70dcff" transparent opacity={0.5} /></mesh>)}
      <mesh position={[0, -0.52, 0]}><boxGeometry args={[0.085, 0.9, 0.085]} /><meshStandardMaterial color="#aebbc5" metalness={0.8} roughness={0.28} /></mesh>
      <mesh position={[-1.2, -0.4, 0.18]}><boxGeometry args={[0.065, 0.7, 0.065]} /><meshStandardMaterial color="#aebbc5" metalness={0.8} roughness={0.28} /></mesh>
      <mesh position={[1.2, -0.4, -0.18]}><boxGeometry args={[0.065, 0.7, 0.065]} /><meshStandardMaterial color="#aebbc5" metalness={0.8} roughness={0.28} /></mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 7, 5]} intensity={3.6} color="#fff4dd" />
      <directionalLight position={[-4, 2, 3]} intensity={1.4} color="#9edfff" />
      <pointLight position={[0, 1, 3]} intensity={2.2} color="#19b7ff" />
      <Float speed={0.45} rotationIntensity={0.012} floatIntensity={0.035}>
        <WindTurbine position={[-1.75, 0.25, -0.7]} scale={0.54} speed={0.82} />
        <WindTurbine position={[0.05, 0.52, 0]} scale={0.86} speed={0.55} />
        <WindTurbine position={[1.65, 0.2, -0.85]} scale={0.5} speed={0.92} />
      </Float>
      <SolarArray position={[0.75, -1.5, 0.65]} scale={0.72} />
      <SolarArray position={[-1.2, -1.72, 0.95]} scale={0.47} />
      <Sparkles count={90} scale={[5.4, 4.2, 3.5]} size={1.15} speed={0.22} color="#bcefff" />
      <ContactShadows position={[0, -2.38, 0]} opacity={0.34} scale={7} blur={2.6} far={4.5} />
    </>
  );
}

export default function EnergyOrb() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return <div aria-hidden="true" className="h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#d8f8ff,transparent_28%),radial-gradient(circle,#19b7ff66,transparent_68%)] opacity-80 blur-md sm:h-[500px] sm:w-[500px]" />;
  }

  return (
    <div className="h-[500px] w-full max-w-[620px] sm:h-[610px]" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.05, 6.7], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
