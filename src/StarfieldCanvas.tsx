import { useEffect, useRef } from 'react';
import { HandState } from './types';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number; // Previous Z for streak rendering
}

export default function StarfieldCanvas({ handState }: { handState: HandState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use a ref to store latest hand values for the animation loop
  const physicsRef = useRef({
    targetVanishX: window.innerWidth / 2,
    targetVanishY: window.innerHeight / 2,
    targetSpeed: 5
  });

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Default mode: center and slow flow
    if (!handState.active) {
      physicsRef.current.targetVanishX = width / 2;
      physicsRef.current.targetVanishY = height / 2;
      physicsRef.current.targetSpeed = 2;
      return;
    }

    // Map hand position to steering (vanishing point)
    physicsRef.current.targetVanishX = handState.x * width;
    physicsRef.current.targetVanishY = handState.y * height;

    // Map pinch distance to speed (warp drive effect)
    // normal pinchDistance: ~0.05 (pinched) to 0.4 (open palm)
    // Fast speed when hand is very wide open, slow down to a stop when pinched.
    const clampedPinch = Math.max(0, Math.min(0.4, handState.pinchDistance));
    // speed from 0 to 60
    physicsRef.current.targetSpeed = (clampedPinch / 0.4) * 60;
  }, [handState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let animationFrameId: number;
    let stars: Star[] = [];
    const NUM_STARS = 1500;
    
    let vanishX = width / 2;
    let vanishY = height / 2;
    let currentSpeed = 5;

    const initStars = () => {

      stars = [];
      for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
          x: (Math.random() - 0.5) * width * 3,
          y: (Math.random() - 0.5) * height * 3,
          z: Math.random() * width,
          pz: 0
        });
        stars[i].pz = stars[i].z;
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    window.addEventListener('resize', handleResize);
    initStars();

    const loop = () => {
      const { targetVanishX, targetVanishY, targetSpeed } = physicsRef.current;
    
      // Smoothly interpolate vanishing point to hand target
      vanishX += (targetVanishX - vanishX) * 0.05;
      vanishY += (targetVanishY - vanishY) * 0.05;
      
      // Smoothly interpolate speed
      currentSpeed += (targetSpeed - currentSpeed) * 0.1;

      // Draw background with slight trail effect (alpha trail can be expensive, we'll clear black for pure streaks)
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      
      stars.forEach((star) => {
        // Move star closer
        star.z -= currentSpeed;

        // Reset if went behind camera
        if (star.z < 1) {
          star.z = width;
          star.pz = star.z;
          star.x = (Math.random() - 0.5) * width * 3;
          star.y = (Math.random() - 0.5) * height * 3;
        }

        // Calculate 2D position
        const sx = star.x / (star.z / 100) + vanishX;
        const sy = star.y / (star.z / 100) + vanishY;
        
        // Calculate previous 2D position for streaks
        const pzClamp = Math.max(1, star.pz);
        const px = star.x / (pzClamp / 100) + vanishX;
        const py = star.y / (pzClamp / 100) + vanishY;

        star.pz = star.z; // update previous z

        // Opacity based on distance
        const t = 1 - (star.z / width);
        ctx.strokeStyle = `rgba(255, 255, 255, ${t})`;
        
        ctx.beginPath();
        // If speed is very low, draw a dot
        if (currentSpeed < 1) {
            ctx.fillStyle = `rgba(255, 255, 255, ${t})`;
            ctx.arc(sx, sy, Math.max(0.5, t * 2), 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw streak
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            // Thick streaks for closer stars
            ctx.lineWidth = Math.max(0.5, t * 3);
            ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10 bg-black" />;
}
