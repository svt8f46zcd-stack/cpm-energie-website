"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Blade() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.045, 0);
    shape.bezierCurveTo(0.01, 0.3, 0.08, 0.72, 0.18, 1.18);
    shape.bezierCurveTo(0.27, 1.58, 0.48, 1.98, 0.76, 2.3);
    shape.bezierCurveTo(0.86, 2.42, 0.9, 2.5, 0.9, 2.58);
    shape.lineTo(0.42, 2.47);
    shape.bezierCurveTo(0.19, 2.05, 0.08, 1.62, 0.01, 1.15);
    shape.bezierCurveTo(-0.06, 0.66, -0.08, 0.22, -0.045, 0);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSize: 0.028,
      bevelThickness: 0.022,
      bevelSegments: 3,
      curveSegments: 8,
    });
  }, []);

  return (
    <mesh geometry={geometry} rotation={[0, 0, -0.13]} castShadow>
      <meshStandardMaterial color="#eef4f8" metalness={0.72} roughness={0.2} />
    </mesh>
  );
}

function WindTurbine({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const rotor = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (rotor.current) rotor.current.rotation.z = state.clock.getElapsedTime() * speed * 1.35;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, -0.95, 0]} castShadow>
        <coneGeometry args={[0.2, 2.85, 48]} />
        <meshStandardMaterial color="#d6e0e7" metalness={0.86} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.49, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.13, 0.56, 12, 32]} />
        <meshStandardMaterial color="#edf3f7" metalness={0.82} roughness={0.17} />
      </mesh>
      <mesh position={[0, 0.49, 0.2]} castShadow>
        <sphereGeometry args={[0.17, 40, 28]} />
        <meshStandardMaterial color="#ffffff" metalness={0.84} roughness={0.13} emissive="#159fe4" emissiveIntensity={0.1} />
      </mesh>
      <group ref={rotor} position={[0, 0.49, 0.28]}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <Blade />
          </group>
        ))}
      </group>
      <mesh position={[0, -2.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 64]} />
        <meshBasicMaterial color="#19b7ff" transparent opacity={0.12} />
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
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.5, 0.08, 1.98]} />
        <meshStandardMaterial color="#061b34" metalness={0.92} roughness={0.14} emissive="#063e70" emissiveIntensity={0.18} />
      </mesh>
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x) => (
        <mesh key={`v-${x}`} position={[x, 0.047, 0]}>
          <boxGeometry args={[0.014, 0.012, 1.9]} />
          <meshBasicMaterial color="#75dcff" transparent opacity={0.58} />
        </mesh>
      ))}
      {[-0.66, -0.22, 0.22, 0.66].map((z) => (
        <mesh key={`h-${z}`} position={[0, 0.047, z]}>
          <boxGeometry args={[3.42, 0.012, 0.014]} />
          <meshBasicMaterial color="#75dcff" transparent opacity={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -0.55, 0]} castShadow>
        <boxGeometry args={[0.09, 0.96, 0.09]} />
        <meshStandardMaterial color="#aebbc5" metalness={0.84} roughness={0.24} />
      </mesh>
      <mesh position={[-1.22, -0.42, 0.18]} castShadow>
        <boxGeometry args={[0.068, 0.74, 0.068]} />
        <meshStandardMaterial color="#aebbc5" metalness={0.84} roughness={0.24} />
      </mesh>
      <mesh position={[1.22, -0.42, -0.18]} castShadow>
        <boxGeometry args={[0.068, 0.74, 0.068]} />
        <meshStandardMaterial color="#aebbc5" metalness={0.84} roughness={0.24} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[4, 7, 5]} intensity={3.8} color="#fff1d8" castShadow />
      <directionalLight position={[-4, 2, 3]} intensity={1.5} color="#9edfff" />
      <pointLight position={[0, 1, 3]} intensity={2.3} color="#19b7ff" />
      <Float speed={0.45} rotationIntensity={0.012} floatIntensity={0.035}>
        <WindTurbine position={[-1.75, 0.25, -0.7]} scale={0.54} speed={0.82} />
        <WindTurbine position={[0.05, 0.52, 0]} scale={0.86} speed={0.55} />
        <WindTurbine position={[1.65, 0.2, -0.85]} scale={0.5} speed={0.92} />
      </Float>
      <SolarArray position={[0.75, -1.5, 0.65]} scale={0.72} />
      <SolarArray position={[-1.2, -1.72, 0.95]} scale={0.47} />
      <Sparkles count={110} scale={[5.4, 4.2, 3.5]} size={1.15} speed={0.22} color="#bcefff" />
      <ContactShadows position={[0, -2.38, 0]} opacity={0.36} scale={7} blur={2.4} far={4.5} />
    </>
  );
}

export default function EnergyOrb() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return <div aria-hidden="true" className="h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#d8f8ff,transparent_28%),radial-gradient(circle,#19b7ff66,transparent_68%)] opacity-80 blur-md sm:h-[500px] sm:w-[500px]" />;
  }

  return (
    <div className="h-[500px] w-full max-w-[620px] sm:h-[610px]" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.05, 6.7], fov: 38 }}
        dpr={[1, 2.25]}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
