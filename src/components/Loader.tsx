import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LoaderProps {
  onEnter: () => void;
}

export const Loader = ({ onEnter }: LoaderProps) => {
  const { progress } = useProgress();
  const [shown, setShown] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);

  useEffect(() => {
    // Show progress bar after 1 second
    const timer = setTimeout(() => setShowProgress(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fake loading logic to ensure the bar is seen
  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setVisualProgress((prev) => {
          if (prev < 100) {
            // Increment fake progress slowly
            const next = prev + Math.random() * 2;
            return next > 100 ? 100 : next;
          }
          return 100;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showProgress]);

  useEffect(() => {
    // Only finish when BOTH actual assets are loaded AND visual progress hits 100%
    if (progress === 100 && visualProgress === 100) {
      const timer = setTimeout(() => setIsFinished(true), 800);
      return () => clearTimeout(timer);
    }
  }, [progress, visualProgress]);

  const handleEnter = () => {
    setShown(false);
    setTimeout(() => {
      onEnter();
    }, 800);
  };

  return (
    <div className={`loading-screen ${!shown ? 'finished' : ''}`}>
      <div className="loading-content">
        <div className="load-title">
          <h1 className="title">Digital Vesak Thorana</h1>
          <p className="subtitle">Department of Information Technology | SLIATE</p>
        </div>

        <div className="loading-progress-container" style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showProgress && (
            !isFinished ? (
              <div className="fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${visualProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{Math.round(visualProgress)}% LOADED</span>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <button className="enter-button" onClick={handleEnter}>
                  Experience the Thorana
                </button>
                <div className="view-360-msg" style={{ margin: 0, opacity: 0.8 }}>
                  <DotLottieReact
                    src="https://lottie.host/ee03a083-4c71-4c0b-a41a-328f711d3d58/mFARL9xdeQ.lottie"
                    autoplay
                    loop
                    style={{ height: '40px', width: '40px' }}
                  />
                  <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em' }}>360° INTERACTIVE VIEW ENABLED</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
