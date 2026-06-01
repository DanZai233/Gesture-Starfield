import { useState, useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandState } from '../types';

export function useHandTracking(enabled: boolean = true) {
  const [handState, setHandState] = useState<HandState>({
    active: false,
    x: 0.5,
    y: 0.5,
    pinchDistance: 0.2
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!enabled) return;
    
    setIsInitializing(true);
    let landmarker: HandLandmarker | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let mounted = true;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (!mounted) return;

        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        
        const video = videoRef.current;
        if (video && mounted) {
          video.srcObject = stream;
          video.onloadeddata = () => {
             video.play().catch(e => console.error("Video play failed:", e));
             setIsInitializing(false);
             detectFrame();
          }
        } else {
          // If video element is not yet attached to the DOM, poll for it
          let attempts = 0;
          const checkVideo = setInterval(() => {
            attempts++;
            const v = videoRef.current;
            if (v && mounted) {
              clearInterval(checkVideo);
              v.srcObject = stream;
              v.onloadeddata = () => {
                 v.play().catch(e => console.error("Video play failed:", e));
                 setIsInitializing(false);
                 detectFrame();
              }
            } else if (attempts > 50 || !mounted) {
              clearInterval(checkVideo);
              setError("Unable to find video display element.");
              setIsInitializing(false);
            }
          }, 100);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) {
          setError(err.message || 'Failed to initialize camera or MediaPipe.');
          setIsInitializing(false);
        }
      }
    }

    let lastVideoTime = -1;
    function detectFrame() {
      const video = videoRef.current;
      if (!video || !landmarker || !mounted) return;
      
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        
        if (result.landmarks && result.landmarks.length > 0) {
          const hand = result.landmarks[0];
          // Index finger tip
          const indexTip = hand[8];
          // Thumb tip
          const thumbTip = hand[4];
          
          // Compute distance between thumb and index
          const dx = indexTip.x - thumbTip.x;
          const dy = indexTip.y - thumbTip.y;
          const dz = indexTip.z - thumbTip.z;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          // Calculate center of interaction (average of thumb and index)
          const centerX = (indexTip.x + thumbTip.x) / 2;
          const centerY = (indexTip.y + thumbTip.y) / 2;

          setHandState({
            active: true,
            // Mirror X because camera is usually user-facing
            x: 1 - centerX,
            y: centerY,
            pinchDistance: dist
          });
        } else {
          setHandState(prev => ({ ...prev, active: false }));
        }
      }
      animationFrameId = requestAnimationFrame(detectFrame);
    }

    init();

    return () => {
      mounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (landmarker) landmarker.close();
    };
  }, [enabled]);

  return { videoRef, isInitializing, error, handState };
}
