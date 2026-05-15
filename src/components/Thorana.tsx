import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import buddaImg from '../assets/budda_rupaya.png';
import g1Img from '../assets/1.gif';
import g2Img from '../assets/2.gif';
import g3Img from '../assets/3.gif';
import g4Img from '../assets/4.gif';
import g5Img from '../assets/5.gif';
import g6Img from '../assets/6.gif';
import g7Img from '../assets/7.gif';
import g8Img from '../assets/8.gif';
import g9Img from '../assets/9.gif';
import footerImg from '../assets/footer.png';
import dharmaImg from '../assets/dharma_chakra.png';
import peacockRightImg from '../assets/peacok  right.svg';
import peacockLeftImg from '../assets/peacok left.svg';

const LIGHT_COLORS = ['#0000ff', '#00ff00', '#ffff00', '#ffa500', '#ff0000', '#ff00ff', '#00ffff'];

const Bulb = ({ position, color, sequenceOffset, patternType }: {
  position: [number, number, number],
  color: string,
  sequenceOffset: number,
  patternType: 'chase' | 'blink' | 'steady'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    let intensity = 0;

    switch (patternType) {
      case 'chase':
        // Creates the spinning effect around circles
        intensity = Math.sin(t * 8 - sequenceOffset) * 0.5 + 0.5;
        break;
      case 'blink':
        // Rapid rhythmic flashing
        intensity = Math.floor((t * 5 + sequenceOffset) % 2);
        break;
      default:
        intensity = 0.8;
    }

    meshRef.current.scale.setScalar(0.5 + intensity * 0.5);
    // @ts-ignore
    meshRef.current.material.emissiveIntensity = intensity * 4;
  });

  return (
    <mesh position={position} ref={meshRef}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} toneMapped={false} />
    </mesh>
  );
};

const WavingPeacock = ({ position, texture }: { position: [number, number, number], texture: THREE.Texture }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
  });
  return (
    <mesh ref={meshRef} position={position} scale={[8, 8, 2]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent={true} />
    </mesh>
  );
};

const RotatingChakra = ({ position, texture, scale = 1 }: { position: [number, number, number], texture: THREE.Texture, scale?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <circleGeometry args={[0.8, 32]} />
      <meshBasicMaterial map={texture} transparent={true} />
    </mesh>
  );
};

// AnimatedShape removed since it's unused

const BackgroundPatterns = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 3, -0.5]}>
      <planeGeometry args={[13, 13]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 }
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;

          // Utility functions
          vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
          }

          void main() {
            // Create LED dot matrix (lots of bulbs)
            vec2 grid = fract(vUv * 80.0); 
            float dist = distance(grid, vec2(0.5));
            float isBulb = 1.0 - step(0.4, dist);

            vec2 centerUv = vUv - vec2(0.5);
            float angle = atan(centerUv.y, centerUv.x);
            float radius = length(centerUv);

            // Expanding rings and rotating rays
            float spiral = sin(angle * 16.0 + radius * 10.0 - uTime * 5.0);
            float rings = sin(radius * 40.0 - uTime * 8.0);
            float pattern = smoothstep(0.0, 1.0, spiral * rings);

            float hue = fract(angle / 6.28 + radius * 2.0 + uTime * 0.2);
            vec3 color = hsv2rgb(vec3(hue, 1.0, 1.0));

            float intensity = pattern * 2.0 + 0.1;
            vec3 finalColor = color * intensity * isBulb;
            
            // Mask to a giant circular shape
            float outerMask = smoothstep(0.5, 0.48, radius); 
            
            gl_FragColor = vec4(finalColor, outerMask * isBulb);
          }
        `}
        transparent={true}
      />
    </mesh>
  );
};

export const Thorana = () => {
  const [
    buddaTex, g1Tex, g2Tex, g3Tex, g4Tex, g5Tex, g6Tex, g7Tex, g8Tex, g9Tex,
    footerTex, dharmaTex, peacockRightTex, peacockLeftTex
  ] = useTexture([
    buddaImg, g1Img, g2Img, g3Img, g4Img, g5Img, g6Img, g7Img, g8Img, g9Img,
    footerImg, dharmaImg, peacockRightImg, peacockLeftImg
  ]);
  const aTextures = [g1Tex, g2Tex, g3Tex, g4Tex, g5Tex, g6Tex, g7Tex, g8Tex, g9Tex];

  const R = 2.4; // Center circle radius
  const z = Math.sin(Math.PI / 8);
  const r = R * (z / (1 - z)); // Outer circles radius ~ 1.488
  const distance = R + r;

  const STORY_POSITIONS = useMemo(() => [
    [0, 9.7],       // Top Center
    [-2.8, 9.0],      // Upper Left
    [2.8, 9.0],       // Upper Right
    [-4.8, 6.5],      // Mid-Upper Left
    [4.8, 6.5],       // Mid-Upper Right
    [-3.5, 3.6],      // Mid-Lower Left
    [3.5, 3.6],       // Mid-Lower Right
    [-4.5, 0.5],      // Bottom Left
    [4.5, 0.5],       // Bottom Right
  ], []);

  const lights = useMemo(() => {
    const l = [];

    // Math from index.html

    // 1. MAIN CENTRAL CIRCLE
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      l.push({
        position: [Math.cos(angle) * (R * 1.9), Math.sin(angle) * (R * 1.9) + 0.8, 0.7] as [number, number, number],
        color: LIGHT_COLORS[i % 3],
        sequenceOffset: angle * 10,
        patternType: 'chase' as const
      });
    }

    // Inner ring for central circle removed to avoid overlapping Buddha image

    // 2. 9 SURROUNDING CIRCLES (Manual arrangement from image)
    STORY_POSITIONS.forEach((pos, c) => {
      const cx = pos[0];
      const cy = pos[1];

      const numBulbs = 35;
      for (let i = 0; i < numBulbs; i++) {
        const angle = (i / numBulbs) * Math.PI * 2;
        l.push({
          position: [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 0.2] as [number, number, number],
          color: LIGHT_COLORS[(c + i) % LIGHT_COLORS.length],
          sequenceOffset: angle * 5 + c,
          patternType: (c % 2 === 0 ? 'blink' : 'chase') as 'blink' | 'chase'
        });
      }
    });

    // 3. REMOVED TOP PEAK LIGHTS (Story circle is now at top)


    // 4. LARGE OUTER BOUNDARY RING
    const outerRadius = distance + r + 0.3; // Just outside the 8 circles
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2;
      l.push({
        position: [Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius + 3, 0.1] as [number, number, number],
        color: LIGHT_COLORS[i % LIGHT_COLORS.length],
        sequenceOffset: angle * 15,
        patternType: 'chase' as const
      });
    }

    return l;
  }, []);

  return (
    <group position={[0, -8, -35]} scale={4}>
      <WavingPeacock
        position={[STORY_POSITIONS[5][0] - 1.5, STORY_POSITIONS[5][1], 0.3]}
        texture={peacockLeftTex}
      />
      <WavingPeacock
        position={[STORY_POSITIONS[6][0] + 1.5, STORY_POSITIONS[6][1], 0.3]}
        texture={peacockRightTex}
      />
      {/* Top Dharma Chakra */}
      <RotatingChakra
        position={[0, 10.8, 2]}
        texture={dharmaTex}
        scale={1.2}
      />

      {/* Central Buddha Placeholder */}
      <mesh position={[0, 0.8, 0.8]}>        <circleGeometry args={[R * 1.8, 32]} />
        <meshBasicMaterial map={buddaTex} transparent={true} />
      </mesh>

      {/* Background Animated Light Grid */}
      <BackgroundPatterns />
      {/* Removed Peak Dharma Chakra - Story 0 is now the peak */}

      {/* Surrounding Story Placeholders */}
      {aTextures.map((tex, c) => {
        const cx = STORY_POSITIONS[c][0];
        const cy = STORY_POSITIONS[c][1];
        return (
          <mesh key={c} position={[cx, cy, 1]}>
            <circleGeometry args={[r * 0.95, 32]} />
            <meshBasicMaterial map={tex} transparent={true} />
          </mesh>
        );
      })}

      {/* Render the light logic */}
      {lights.map((light, idx) => (
        <Bulb key={idx} {...light} />
      ))}

      {/* Footer Image */}
      <mesh position={[0, -4, -0.2]}>
        <planeGeometry args={[18, 8]} />
        <meshBasicMaterial map={footerTex} transparent={true} />
      </mesh>

      {/* Decorative Footer Dharma Chakra */}
      <mesh position={[4.2, -3.6, 0.3]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial map={dharmaTex} transparent={true} />
      </mesh>

      {/* Shapes (Beautification) */}
      {/* <AnimatedShape position={[-6, 8, -0.2]} rotation={[0, 0, Math.PI / 4]} args={[4, 4]} texture={shape1Tex} />
      <AnimatedShape position={[6, 8, -0.2]} rotation={[0, 0, -Math.PI / 4]} args={[4, 4]} texture={shape1Tex} />

      <AnimatedShape position={[-6, -1, -0.2]} rotation={[0, 0, Math.PI / 6]} args={[4, 4]} texture={shape2Tex} />
      <AnimatedShape position={[6, -1, -0.2]} rotation={[0, 0, -Math.PI / 6]} args={[4, 4]} texture={shape2Tex} />

      <AnimatedShape position={[0, 10, -0.2]} args={[4, 4]} texture={shape3Tex} />

      <pointLight position={[0, 2, 2]} intensity={5} color="#ffcc00" distance={15} /> */}
    </group>
  );
};