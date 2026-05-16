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

  useEffect(() => {
    if (progress === 100) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setIsFinished(true), 500);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  const handleEnter = () => {
    setShown(false);
    // Call the onEnter callback after the fade out transition
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

        <div className="loading-progress-container">
          {!isFinished ? (
            <>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(progress)}% LOADED</span>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
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
          )}
        </div>
      </div>
    </div>
  );
};
