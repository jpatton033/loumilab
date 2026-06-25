import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Icosahedron, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

const NetworkPoints = () => {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      // distribute on sphere shell, radius ~2.4
      const r = 2.4 + Math.random() * 0.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.08;
      ref.current.rotation.x += dt * 0.02;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#7cc4ff"
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const Globe = () => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Glowing inner core */}
      <Sphere args={[1.4, 64, 64]}>
        <meshBasicMaterial color="#1e40af" transparent opacity={0.15} />
      </Sphere>
      {/* Wireframe shell */}
      <Icosahedron args={[2, 3]}>
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.55} />
      </Icosahedron>
      {/* Outer subtle shell */}
      <Sphere args={[2.05, 48, 48]}>
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.1} />
      </Sphere>
    </group>
  );
};

const OrbitingNode = ({
  radius,
  speed,
  offset,
  tilt,
  color = "#7cc4ff",
}: {
  radius: number;
  speed: number;
  offset: number;
  tilt: number;
  color?: string;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = Math.sin(t * 0.6) * tilt;
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

const HeroScene = () => {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 6.2], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#7cc4ff" />
        <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
          <Globe />
        </Float>
        <NetworkPoints />
        <OrbitingNode radius={2.7} speed={0.6} offset={0} tilt={0.3} />
        <OrbitingNode radius={2.9} speed={0.4} offset={1.8} tilt={0.5} color="#a5b4fc" />
        <OrbitingNode radius={3.1} speed={0.3} offset={3.2} tilt={0.2} color="#67e8f9" />
      </Suspense>
    </Canvas>
  );
};

export default HeroScene;
