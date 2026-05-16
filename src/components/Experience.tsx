import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
  useGLTF
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Thorana } from './Thorana';
import { Loader } from './Loader';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Icon } from '@iconify/react';

import bgPana from '../assets/bg pana.png';
import songUrl from '../assets/song.mp3';
import lanternUrl from '../assets/lantern.glb';
import logoH from '../assets/logo h.png';


const Panorama = () => {
  // Load the equirectangular texture
  const texture = useTexture(bgPana);

  return (
    <mesh scale={[-1, 1, 1]} rotation={[0, Math.PI / 2, 0]}>
      <sphereGeometry args={[200, 10, 10]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
};

// Thorana world-space center
const THORANA_CENTER = new THREE.Vector3(0, -8, -12);
const SPAWN_Y = THORANA_CENTER.y - 10;
const MAX_Y = THORANA_CENTER.y + 45;

const Lantern = ({ startX, startZ, riseSpeed, swayOffset, startY, scale }: any) => {
  const { scene } = useGLTF(lanternUrl);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const yRef = useRef(startY);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Pure upward rise
    yRef.current += riseSpeed * delta;
    if (yRef.current > MAX_Y) yRef.current = SPAWN_Y;

    // Gentle horizontal sway (no orbit)
    const swayX = Math.sin(state.clock.elapsedTime * 0.5 + swayOffset) * 0.3;
    const swayZ = Math.cos(state.clock.elapsedTime * 0.4 + swayOffset) * 0.2;

    groupRef.current.position.set(startX + swayX, yRef.current, startZ + swayZ);
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6 + swayOffset) * 0.05;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
      <pointLight intensity={0.6} color="#ffaa33" distance={6} decay={2} />
    </group>
  );
};

const Lanterns = ({ count = 35 }) => {
  const lanterns = useMemo(() => {
    return Array.from({ length: count }).map((_) => {
      return {
        startX: THORANA_CENTER.x + (Math.random() - 0.5) * 25,
        startZ: THORANA_CENTER.z + 2 + Math.random() * 12, // Between -10 and 0 relative to camera
        riseSpeed: 1.0 + Math.random() * 1.2,
        swayOffset: Math.random() * Math.PI * 2,
        startY: SPAWN_Y + Math.random() * (MAX_Y - SPAWN_Y),
        scale: 0.09 + Math.random() * 0.06,
      };
    });
  }, [count]);

  return (
    <group>
      {lanterns.map((props, i) => (
        <Lantern key={i} {...props} />
      ))}
    </group>
  );
};

// ── FIREFLIES ──────────────────────────────────────────────
const FIREFLY_COUNT = 100;

const Fireflies = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-compute orbit params per firefly
  const flies = useMemo(() => Array.from({ length: FIREFLY_COUNT }).map(() => ({
    radius: 12 + Math.random() * 12,   // distance from thorana center
    heightOffset: (Math.random() - 0.5) * 20, // vertical spread
    speed: 0.15 + Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2,
    swaySpeed: 0.5 + Math.random() * 0.5,
    swayAmp: 0.5 + Math.random() * 1.5,
  })), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    flies.forEach((f, i) => {
      const angle = f.phase + t * f.speed;

      // Large circular orbit around THORANA_CENTER in XZ plane
      const x = Math.cos(angle) * f.radius;
      const z = Math.sin(angle) * f.radius;

      // Vertical sway
      const y = f.heightOffset + Math.sin(t * f.swaySpeed + f.phase) * f.swayAmp;

      dummy.position.set(
        THORANA_CENTER.x + x,
        THORANA_CENTER.y + 6 + y, // Moved lower from +12
        THORANA_CENTER.z + z
      );

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FIREFLY_COUNT]}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshStandardMaterial
        color="#ff9900"
        emissive="#ff6600"
        emissiveIntensity={4}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

export const Experience = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const storySectionRef = useRef<HTMLElement>(null);

  const startExperience = () => {
    setLoading(false);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio playback failed:", e));
    }
  };

  useEffect(() => {
    // We still keep the click listener as a backup for audio
    const playAudio = () => {
      if (audioRef.current && !loading) {
        audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
      }
    };
    document.addEventListener('click', playAudio, { once: true });
    return () => document.removeEventListener('click', playAudio);
  }, [loading]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  return (
    <div style={{ width: '100vw', background: '#000' }}>
      {loading && <Loader onEnter={startExperience} />}
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Canvas shadows gl={{ antialias: true, stencil: false }}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={70} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minDistance={20}
              maxDistance={20}
              rotateSpeed={0.3}
              dampingFactor={0.05}
            />

            {/* Environmental Elements */}
            <Panorama />
            {/* <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} /> */}
            <Lanterns count={10} />
            <Fireflies />

            <ambientLight intensity={0.2} />
            <pointLight position={[0, 10, 0]} intensity={1} color="#4444ff" />

            {/* Main Subject */}
            <Thorana />



            {/* Post-processing */}
            <EffectComposer enableNormalPass={true}>
              <Bloom
                luminanceThreshold={0.2}
                mipmapBlur
                intensity={1.5}
                radius={0.4}
              />
              <Noise opacity={0.05} />
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>
          </Suspense>
        </Canvas>

        <div className="overlay">
          <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 100, pointerEvents: 'auto' }}>
            <img src={logoH} alt="Brand Logo" style={{ height: '50px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))', opacity: 0.9 }} />
          </div>
          {/* Removed header as per request */}




          <button
            onClick={toggleMute}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              cursor: 'pointer',
              zIndex: 100,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox={"0 0 24 24"}>
                <path d="M22 12c0-4.09-2.47-7.61-6-9.16v2.24c2.39 1.39 4 3.96 4 6.92 0 1.85-.64 3.54-1.69 4.89l-1.42-1.42c.7-.98 1.12-2.17 1.12-3.47 0-1.77-.78-3.36-2-4.46v7.05l-2-2V4c0-.37-.2-.71-.53-.88-.32-.17-.72-.15-1.03.05L7.73 6.32 2.71 1.29 1.3 2.7l20 20 1.41-1.41-2.98-2.98A9.94 9.94 0 0 0 22 11.99Zm-10-1.41L9.17 7.76 12 5.87zm0 7.54-4.45-2.96s-.06-.02-.08-.03c-.06-.03-.12-.06-.19-.08s-.13-.03-.2-.04c-.03 0-.06-.02-.09-.02h-3V9h.76L3.02 7.27C2.41 7.61 2 8.26 2 9v6c0 1.1.9 2 2 2h2.7l5.75 3.83c.17.11.36.17.55.17.16 0 .32-.04.47-.12.33-.17.53-.51.53-.88v-1.76l-2-2z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill={"currentColor"} viewBox={"0 0 24 24"}>
                <path d="M4 17h2.7l5.75 3.83c.17.11.36.17.55.17.16 0 .32-.04.47-.12.33-.17.53-.51.53-.88V4c0-.37-.2-.71-.53-.88-.32-.17-.72-.15-1.03.05L6.69 7h-2.7c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2Zm0-8h3s.06-.02.09-.02c.06 0 .13-.02.19-.04a.6.6 0 0 0 .19-.08c.03-.01.06-.02.08-.03L12 5.87v12.26l-4.45-2.96s-.06-.02-.08-.03c-.06-.03-.12-.06-.19-.08-.06-.02-.13-.03-.19-.04-.03 0-.06-.02-.09-.02H4zm18 3c0-4.09-2.47-7.61-6-9.16v2.24c2.39 1.39 4 3.96 4 6.92s-1.61 5.53-4 6.92v2.24c3.53-1.55 6-5.07 6-9.16"></path><path d="M18 12c0-1.77-.78-3.36-2-4.46v8.92c1.22-1.1 2-2.69 2-4.46"></path>
              </svg>
            )}
          </button>

          <button
            className="scroll-down-btn"
            onClick={() => {
              storySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Scroll to story"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </button>

          <audio ref={audioRef} src={songUrl} loop />

        </div>
      </div>
      {/* ── STORY SECTION ── */}
      <section
        ref={storySectionRef}
        style={{
          background: '#000',
          padding: '8rem 1.5rem',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 className="title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '0.5rem' }}>Digital Vesak Thorana</h1>
          <p className="subtitle" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', maxWidth: 'none' }}>
            Department of Information Technology <br /> SLIATE | KURUNEGALA
          </p>

          <div className="view-360-msg" style={{ margin: '3rem auto 0 auto', background: 'none' }}>
            <DotLottieReact
              src="https://lottie.host/ee03a083-4c71-4c0b-a41a-328f711d3d58/mFARL9xdeQ.lottie"
              autoplay
              loop
              style={{ height: '60px', width: '60px' }}
            />
            <span style={{ fontSize: '0.8rem' }}>360° View Enabled • Watch the surroundings</span>
          </div>
        </div>

        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          {/* Decorative divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #b8860b)' }} />
            <span style={{ color: '#b8860b', fontSize: '1.4rem' }}>☸</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #b8860b)' }} />
          </div>

          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 700,
            color: '#f5c842',
            marginBottom: '0.4rem',
            letterSpacing: '0.02em',
            textAlign: 'center'
          }}>ස්වර්ණ මයුර ජාතකය</h2>
          <p style={{
            color: '#aaa',
            marginBottom: '2rem',
            fontFamily: 'sans-serif',
            fontSize: '0.95rem',
            textAlign: 'center'
          }}>
            Swarna Mayura Jathakaya
          </p>

          <div className="story-description" style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: '2',
            color: 'rgba(255,255,255,0.88)',
            whiteSpace: 'pre-wrap',
          }}>
            {`ඈත අතීතයේ හිමාල කඳු ප්‍රදේශයක අතිශයින් සුන්දර රන්වන් පැහැති මයුරෙකු ජීවත් විය. ඔහු සාමාන්‍ය මයුරෙකු නොව, පෙර භවයක බෝධිසත්වයන් වහන්සේය. ඔහුගේ පිහාටු රන් මෙන් දිලිසෙමින්, ආලෝකමත් සිරුරක් ඇති නිසා “ස්වර්ණ මයුරයා” ලෙස ප්‍රසිද්ධ විය.

සෑම උදෑසනකම ඔහු සූර්යයාට නමස්කාර කර පිරිත් ගාථා කියමින් තම ආරක්ෂාව ප්‍රාර්ථනා කළේය. එම පිරිත් බලයෙන් කිසිවෙකුටත් ඔහුව අල්ලා ගැනීමට නොහැකි විය.

එක දිනක් රජෙකුගේ රැජිනක් ස්වර්ණ මයුරයාගේ රන්වන් පිහාටු ගැන අසා, ඔහුව අල්ලාගෙන එන ලෙස රජුට ඉල්ලා සිටියාය. රජු දඩයක්කරුවන් බොහෝ දෙනෙකු යැව්වත්, පිරිත් බලය නිසා ඔවුන් සියල්ලෝම අසාර්ථක වූහ.

අවසානයේ දඩයක්කරු කපටි උපක්‍රමයක් යොදා ගත්තේය. ලස්සන මයුරියක් යොදාගෙන ස්වර්ණ මයුරයාගේ සිත ඇදගත්තේය. ඒ දිනයේ ඔහු පිරිත් කියා නොසිටි බැවින්, ආරක්ෂාව අහිමි වී උගුලට හසු විය.

දඩයක්කරු ඔහුව රජු වෙත ගෙන ගිය විට, ස්වර්ණ මයුරයා ධර්මය හා සත්‍යය ගැන බුද්ධිමත් ලෙස කතා කළේය. ඔහුගේ කරුණාවන්ත වචන අසා රජුගේ සිත වෙනස් වී, ඔහුව නිදහස් කළේය. රජුද ධර්මයට ගරු කරන යහපත් පාලකයෙකු බවට පත් විය.

කථාවේ ආදර්ශය
සීලය හා පිරිත් බලය ජීවිතය ආරක්ෂා කරයි.
කාම ආශාව සහ අවධානය අහිමි වීම විනාශයට හේතු විය හැක.
ධර්මය සහ කරුණාවෙන් අන් අයගේ සිත් වෙනස් කළ හැක.'`
            }
          </div>
        </div>
      </section>


      {/* ── CREDITS SECTION ── */}
      <footer style={{
        background: '#000',
        borderTop: '1px solid rgba(184,134,11,0.3)',
        padding: '3rem 2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        color: 'rgba(255,255,255,0.5)',
      }}>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Designed & Developed by </span>
              <span style={{ color: '#fff', fontWeight: 600 }}>Maneesh Amindu</span>

            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Department of </span>
              <span style={{ color: '#fff' }}>Information Technology</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)' }}>SLIATE Kurunegala</div>
          </div>

          <div className="footer-socials">
            <a href="https://github.com/manee235" target="_blank" rel="noopener noreferrer" className="social-icon">
              <Icon icon="mdi:github" />
            </a>
            <a href="https://facebook.com/maneesh.ganegoda.2025/" target="_blank" rel="noopener noreferrer" className="social-icon">
              <Icon icon="mdi:facebook" />
            </a>
            <a href="https://www.instagram.com/only.maneesh/" target="_blank" rel="noopener noreferrer" className="social-icon">
              <Icon icon="mdi:instagram" />
            </a>
            <a href="https://www.linkedin.com/in/maneesh-amindu-05095b281/" target="_blank" rel="noopener noreferrer" className="social-icon">
              <Icon icon="mdi:linkedin" />
            </a>
          </div>

        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          Digital Vesak Thorana · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};
