'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import styles from './page.module.css';

// Updated to frame colors
const frameColors = [
  { name: 'White', color: '#ffffff' },
  { name: 'Black', color: '#000000' },
  { name: 'Gray', color: '#cccccc' },
  { name: 'Pink', color: '#ffc0cb' },
  { name: 'Blue', color: '#add8e6' },
  { name: 'Cream', color: '#f5f5dc' },
];

const filters = [
  { name: 'Normal', style: 'none' },
  { name: 'Classic B&W', style: 'grayscale(100%) contrast(1.1)' },
  { name: 'Vintage Sepia', style: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
  { name: 'Soft Focus', style: 'blur(1px) brightness(1.05)' },
  { name: 'High Contrast', style: 'contrast(1.5) saturate(1.1)' },
  { name: 'Faded', style: 'opacity(0.8) contrast(0.9)' },
];

export default function PhotoBoothPage() {
  const webcamRef = useRef<Webcam>(null);
  const collageRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedFrameColor, setSelectedFrameColor] = useState(frameColors[0].color); // Updated state
  const [selectedFilter, setSelectedFilter] = useState(filters[0].style);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const shutterSound = useRef<HTMLAudioElement | null>(null);
  const countdownSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    shutterSound.current = new Audio('/shutter.mp3');
    countdownSound.current = new Audio('/countdown.mp3');
  }, []);

  const playSound = (sound: HTMLAudioElement | null) => {
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch((error) => console.error('Audio error:', error));
    }
  };

  const capturePhoto = useCallback(async () => {
    if (photos.length >= 6) return;
    setIsCapturing(true);
    // Countdown from 3 with beeps
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      playSound(countdownSound.current);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setCountdown(0);
    playSound(shutterSound.current);
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhotos((prev) => [...prev, imageSrc]);
    }
    setIsCapturing(false);
  }, [photos]);

  // Auto-capture after the first photo until all 6 are taken.
  useEffect(() => {
    if (!isCapturing && photos.length > 0 && photos.length < 6) {
      const timer = setTimeout(() => {
        capturePhoto();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [photos, isCapturing, capturePhoto]);

  const startSession = () => {
    if (photos.length === 0) {
      capturePhoto();
    }
  };

  const resetSession = () => {
    setPhotos([]);
  };

  const handleDownload = async () => {
    if (!collageRef.current) return;
    const canvas = await html2canvas(collageRef.current, {
      useCORS: true,
      scale: 2, // Higher quality
      logging: false,
    });
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'photocard.png';
    link.click();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Charlie Booth</h1>
      
      <div className={styles.webcamContainer}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className={styles.webcam}
          mirrored={true} // Make webcam view mirrored
        />
        {(isCapturing || countdown > 0) && (
          <div className={styles.countdownOverlay}>
            <span className={styles.countdownNumber}>
              {countdown > 0 ? countdown : '📸'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button 
          onClick={startSession}
          disabled={isCapturing || photos.length >= 6}
          className={styles.captureButton}
        >
          {photos.length >= 6 
            ? 'Session Complete!' 
            : isCapturing ? 'Capturing...' : 'Start Photo Session'}
        </button>
        {photos.length >= 6 && (
          <>
            <button onClick={resetSession} className={styles.resetButton}>
              Reset Session
            </button>
            <button onClick={handleDownload} className={styles.downloadButton}>
              Download Photocard
            </button>
          </>
        )}
        <div className={styles.selectorContainer}>
          <div className={styles.selectorGroup}>
            {/* Updated Frame Selector to Frame Color Selector */}
            <span>Frame Color:</span>
            {frameColors.map((frame) => (
              <button
                key={frame.name}
                onClick={() => setSelectedFrameColor(frame.color)}
                className={`${styles.selectorButton} ${styles.colorButton} ${
                  selectedFrameColor === frame.color ? styles.activeSelector : ''
                }`}
                style={{ backgroundColor: frame.color, color: frame.color === '#000000' || frame.color === '#ffffff' ? (frame.color === '#000000' ? 'white' : 'black') : frame.color }}
              >
                {frame.name}
              </button>
            ))}
          </div>
          <div className={styles.selectorGroup}>
            <span>Filter:</span>
            {filters.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setSelectedFilter(filter.style)}
                className={`${styles.selectorButton} ${
                  selectedFilter === filter.style ? styles.activeSelector : ''
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={styles.collage}
        ref={collageRef}
        style={{ background: selectedFrameColor }}
      >
        <div className={styles.photostripBranding}>Photobooth</div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={styles.photoFrame}
            style={{}}
          >
            {photos[index] && (
              <img
                src={photos[index]}
                alt={`Photo ${index + 1}`}
                className={styles.photo} // Keep photo class for mirroring
                style={{ filter: selectedFilter }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
