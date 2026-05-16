import { useProgress } from '@react-three/drei';
import { useEffect, useState, useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoaderProps {
  onEnter: () => void;
}

const FireflyEffect = () => {
  const fireflies = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      drift: `${(Math.random() - 0.5) * 200}px`,
      size: `${2 + Math.random() * 3}px`
    }));
  }, []);

  return (
    <>
      {fireflies.map((f, i) => (
        <div 
          key={i} 
          className="loader-firefly" 
          style={{ 
            left: f.left, 
            animationDelay: f.delay,
            width: f.size,
            height: f.size,
            // @ts-ignore
            '--drift': f.drift 
          }} 
        />
      ))}
    </>
  );
};

export const Loader = ({ onEnter }: LoaderProps) => {
  const { progress } = useProgress();
  const [shown, setShown] = useState(true);
  const [stage, setStage] = useState(0); // 0: Title, 1: Progress, 2: Button
  const [visualProgress, setVisualProgress] = useState(0);

  useEffect(() => {
    // Phase 1: Show title first, then show progress bar after 1.5s
    const timer = setTimeout(() => {
      setStage(1);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Phase 2: Handle progress bar increments
    if (stage === 1) {
      const interval = setInterval(() => {
        setVisualProgress((prev) => {
          if (prev < 100) {
            // Move at least 1-2% every 50ms (fake progress)
            // But if actual progress is ahead, jump to it
            const nextFake = prev + (Math.random() * 1.5 + 0.5);
            const actual = progress;
            return Math.max(nextFake, actual);
          }
          return 100;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [stage, progress]);

  useEffect(() => {
    // Phase 3: Transition to button stage
    // Transition only when BOTH actual loading is done AND visual progress hits 100%
    if (stage === 1 && visualProgress >= 100 && progress === 100) {
      const timer = setTimeout(() => {
        setStage(2);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visualProgress, progress, stage]);

  const handleEnter = () => {
    setShown(false);
    setTimeout(() => {
      onEnter();
    }, 800);
  };

  const currentDisplayProgress = Math.round(visualProgress);

  return (
    <div className={`loading-screen ${!shown ? 'finished' : ''}`} style={{ overflow: 'hidden' }}>
      {stage === 2 && <FireflyEffect />}
      <div className="loading-content" style={{ zIndex: 2 }}>
        <div className="load-title">
          <h1 className="title">Digital Vesak Thorana</h1>
          <p className="subtitle">
            Department of Information Technology <span className="mobile-break" /> SLIATE
          </p>
        </div>

        <div className="loading-progress-container" style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {stage === 1 && (
            <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${currentDisplayProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{currentDisplayProgress}% LOADED</span>
            </div>
          )}

          {stage === 2 && (
            <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <button className="enter-button" onClick={handleEnter}>
                Experience the Thorana
              </button>
              <div className="view-360-msg" style={{ opacity: 0.8 }}>
                <DotLottieReact
                  src="https://lottie.host/ee03a083-4c71-4c0b-a41a-328f711d3d58/mFARL9xdeQ.lottie"
                  autoplay
                  loop
                  style={{ height: '40px', width: '40px' }}
                />
                <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em' }}>360° INTERACTIVE VIEW ENABLED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
