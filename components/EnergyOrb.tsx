"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Sphere, MeshDistortMaterial, Environment, Float, Trail } from "@react-three/drei";
import * as THREE from "three";

function OrbitRing({ radius, speed, tilt, opacity }: { radius: number; speed: number; tilt: [number, number, number]; opacity: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current) return;
    ring.current.rotation.z = state.clock.getElapsedTime() * speed;
    ring.current.rotation.x = tilt[0] + Math.sin(state.clock.getElapsedTime() * 0.35) * 0.05;
  });
  return (
    <mesh ref={ring} rotation={tilt}>
      <torusGeometry args={[radius, 0.014, 12, 180]} />
      <meshBasicMaterial color="#62dcff" transparent opacity={opacity} />
    </mesh>
  );
}

function EnergyNode({ index, radius }: { index: number; radius: number }) {
  const node = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!node.current) return;
    const t = state.clock.getElapsedTime() * (0.35 + index * 0.025) + index * 1.7;
    node.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.12) * radius * 0.62, Math.sin(t) * radius * 0.48);
    node.current.rotation.y += 0.015;
  });
  return (
    <Trail width={0.035} length={2.5} color="#5edcff" attenuation={(t) => t * t}>
      <Sphere ref={node} args={[0.055, 16, 16]}>
        <meshBasicMaterial color="#b8f4ff" />
      </Sphere>
    </Trail>
  );
}

function EnergyCore() {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();

  useFrame((state) => {
    if (!core.current || !shell.current || !halo.current) return;
    const t = state.clock.getElapsedTime();
    const targetX = (mouse.x * viewport.width) / 10;
    const targetY = (mouse.y * viewport.height) / 10;

    core.current.position.x += (targetX - core.current.position.x) * 0.035;
    core.current.position.y += (targetY - core.current.position.y) * 0.035;
    shell.current.position.copy(core.current.position);
    halo.current.position.copy(core.current.position);

    core.current.rotation.y = t * 0.22;
    core.current.rotation.x = Math.sin(t * 0.27) * 0.14;
    shell.current.rotation.y = -t * 0.1;
    shell.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    halo.current.rotation.z = t * 0.08;

    const pulse = 1 + Math.sin(t * 1.55) * 0.035;
    core.current.scale.setScalar(pulse);
    halo.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.035);
  });

  return (
    <group>
      <Float speed={1.25} rotationIntensity={0.2} floatIntensity={0.28}>
        <Sphere ref={core} args={[1.28, 96, 96]}>
          <MeshDistortMaterial
            color="#20b8ff"
            emissive="#0877c9"
            emissiveIntensity={1.35}
            roughness={0.1}
            metalness={0.58}
            distort={0.3}
            speed={1.45}
          />
        </Sphere>
      </Float>

      <Sphere ref={shell} args={[1.52, 64, 64]}>
        <meshPhysicalMaterial
          color="#72e5ff"
          transparent
          opacity={0.085}
          roughness={0.06}
          metalness={0.25}
          transmission={0.78}
          thickness={0.4}
          ior={1.25}
        />
      </Sphere>

      <Sphere ref={halo} args={[1.76, 32, 32]}>
        <meshBasicMaterial color="#19b7ff" transparent opacity={0.035} blending={THREE.AdditiveBlending} />
      </Sphere>

      <OrbitRing radius={1.72} speed={0.22} tilt={[Math.PI / 2.5, 0, 0]} opacity={0.72} />
      <OrbitRing radius={1.9} speed={-0.14} tilt={[-Math.PI / 3.2, 0.2, 0]} opacity={0.42} />
      <OrbitRing radius={2.08} speed={0.09} tilt={[0.7, -0.5, 0.4]} opacity={0.24} />

      {Array.from({ length: 8 }, (_, index) => <EnergyNode key={index} index={index} radius={1.82 + (index % 3) * 0.12} />)}
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[3.5, 3.5, 4]} intensity={2.5} color="#7ae5ff" />
      <pointLight position={[-4, -2, -2]} intensity={1.2} color="#167de5" />
      <pointLight position={[0, 0, 5]} intensity={0.95} color="#d8f7ff" />
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
        <Sparkles count={105} scale={5.2} size={2.1} speed={0.4} color="#9ce9ff" />
      </Canvas>
    </div>
  );
}
