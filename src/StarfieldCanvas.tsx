import { useEffect, useRef } from 'react';
import { HandState } from './types';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number; // Previous Z for depth trail
  hue: number;
  sat: number;
  lightness: number;
  sizeMultiplier: number;
}

interface GiantStar {
  x: number;
  y: number;
  z: number;
  pz: number;
  color: string;
  glowColor: string;
  size: number;
}

interface Planet {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  hue: number;
  hasRing: boolean;
  ringAngle: number;
  rotSpeed: number;
  rotAngle: number;
}

interface Meteor {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  length: number;
  width: number;
  opacity: number;
  hue: number;
  active: boolean;
}

interface Nebula {
  angle: number;
  rotSpeed: number;
  color: string;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export default function StarfieldCanvas({ handState }: { handState: HandState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use a ref to store latest hand values for the animation loop
  const physicsRef = useRef({
    targetVanishX: window.innerWidth / 2,
    targetVanishY: window.innerHeight / 2,
    targetSpeed: 4
  });

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    if (!handState.active) {
      physicsRef.current.targetVanishX = width / 2;
      physicsRef.current.targetVanishY = height / 2;
      physicsRef.current.targetSpeed = 4;
      return;
    }

    // Map hand position to steering (vanishing point)
    physicsRef.current.targetVanishX = handState.x * width;
    physicsRef.current.targetVanishY = handState.y * height;

    // Map pinch distance to speed (warp drive effect)
    const clampedPinch = Math.max(0, Math.min(0.4, handState.pinchDistance));
    // speed from 1 to 75
    physicsRef.current.targetSpeed = 1 + (clampedPinch / 0.4) * 74;
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
    let giantStars: GiantStar[] = [];
    let planets: Planet[] = [];
    let meteors: Meteor[] = [];
    
    const NUM_STARS = 1600;
    let vanishX = width / 2;
    let vanishY = height / 2;
    let currentSpeed = 4;

    // Initialize swirling galaxy nebulae clouds
    const nebulae: Nebula[] = [
      { angle: 0, rotSpeed: 0.0006, color: 'rgba(110, 30, 200, 0.06)', scale: 1.3, offsetX: -120, offsetY: -60 },
      { angle: Math.PI / 3, rotSpeed: -0.0004, color: 'rgba(20, 120, 220, 0.06)', scale: 1.6, offsetX: 140, offsetY: 90 },
      { angle: Math.PI * 2 / 3, rotSpeed: 0.0003, color: 'rgba(230, 30, 130, 0.05)', scale: 1.1, offsetX: -60, offsetY: 130 },
      { angle: Math.PI, rotSpeed: -0.0008, color: 'rgba(240, 140, 30, 0.04)', scale: 1.4, offsetX: 90, offsetY: -110 }
    ];

    // Helper to get beautiful, high-fidelity color presets for celestial bodies
    const getColorPalette = (): { hue: number; sat: number; lightness: number } => {
      const r = Math.random();
      if (r < 0.35) {
        // Futuristic cosmic neon cyan
        return { hue: Math.floor(Math.random() * 25) + 180, sat: 95, lightness: 70 };
      } else if (r < 0.65) {
        // Majestic galactic purple / radiant pink
        return { hue: Math.floor(Math.random() * 45) + 275, sat: 100, lightness: 68 };
      } else if (r < 0.8) {
        // Solar warm flare golden-orange
        return { hue: Math.floor(Math.random() * 20) + 32, sat: 95, lightness: 62 };
      } else {
        // Bright pearly starlight white/blue
        return { hue: 205, sat: 15, lightness: 94 };
      }
    };

    // Helper to map star birth coordinates with dual-arm logarithmic spirals
    const createStarCoords = (w: number, h: number, z: number) => {
      // 80% follow the beautiful galaxy spiral layout, 20% completely uniform for space depth
      if (Math.random() < 0.8) {
        const isArmA = Math.random() < 0.5;
        const armOffset = isArmA ? 0 : Math.PI;
        
        // Logarithmic spiral geometry
        const dist = Math.pow(Math.random(), 1.3) * w * 1.6;
        const baseAngle = Math.random() * 0.4;
        const spiralTightness = 0.0016; 
        const totalAngle = dist * spiralTightness + armOffset + baseAngle;
        
        return {
          x: Math.cos(totalAngle) * dist,
          y: Math.sin(totalAngle) * dist,
          z: z
        };
      } else {
        return {
          x: (Math.random() - 0.5) * w * 3,
          y: (Math.random() - 0.5) * h * 3,
          z: z
        };
      }
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < NUM_STARS; i++) {
        const coords = createStarCoords(width, height, Math.random() * width);
        const palette = getColorPalette();
        stars.push({
          x: coords.x,
          y: coords.y,
          z: coords.z,
          pz: coords.z,
          hue: palette.hue,
          sat: palette.sat,
          lightness: palette.lightness,
          sizeMultiplier: Math.random() * 1.5 + 0.5
        });
      }

      // Initialize Prominent Suns / Giant Stars
      giantStars = [];
      for (let i = 0; i < 18; i++) {
        const coords = createStarCoords(width, height, Math.random() * width);
        const palette = getColorPalette();
        giantStars.push({
          x: coords.x,
          y: coords.y,
          z: coords.z,
          pz: coords.z,
          color: `hsla(${palette.hue}, ${palette.sat}%, ${palette.lightness}%, `,
          glowColor: `hsla(${palette.hue}, ${palette.sat}%, ${palette.lightness}%, 0.18)`,
          size: Math.random() * 10 + 6
        });
      }

      // Initialize Orbiting Planets / Satellites
      planets = [];
      for (let i = 0; i < 10; i++) {
        const coords = createStarCoords(width, height, Math.random() * width);
        planets.push({
          x: coords.x,
          y: coords.y,
          z: coords.z,
          pz: coords.z,
          size: Math.random() * 16 + 10,
          hue: Math.random() * 360,
          hasRing: Math.random() < 0.65,
          ringAngle: (Math.random() - 0.5) * 0.7,
          rotSpeed: (Math.random() - 0.5) * 0.015,
          rotAngle: Math.random() * Math.PI
        });
      }

      // Initialize Meteors Active Pool
      meteors = [];
      for (let i = 0; i < 5; i++) {
        meteors.push({
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          speed: 0,
          length: 0,
          width: 0,
          opacity: 0,
          hue: 0,
          active: false
        });
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
      currentSpeed += (targetSpeed - currentSpeed) * 0.08;

      // Draw background space sky
      ctx.fillStyle = '#020204';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Nebulae Clouds in background with 'screen' blending
      ctx.globalCompositeOperation = 'screen';
      nebulae.forEach((neb) => {
        neb.angle += neb.rotSpeed;
        
        // Parallax offset matching coordinate system shift
        const shiftX = (vanishX - width / 2) * 0.12;
        const shiftY = (vanishY - height / 2) * 0.12;
        
        // Circular revolving motion
        const rotX = Math.cos(neb.angle) * 35;
        const rotY = Math.sin(neb.angle) * 35;
        
        const cx = width / 2 + neb.offsetX + shiftX + rotX;
        const cy = height / 2 + neb.offsetY + shiftY + rotY;
        const radius = Math.min(width, height) * 0.45 * neb.scale;
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(0.4, neb.color.replace('0.06', '0.015').replace('0.05', '0.012'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';

      // 2. Draw colorful background stars with streaks
      stars.forEach((star) => {
        star.z -= currentSpeed;

        if (star.z < 1) {
          const coords = createStarCoords(width, height, width);
          star.x = coords.x;
          star.y = coords.y;
          star.z = width;
          star.pz = star.z;
          const palette = getColorPalette();
          star.hue = palette.hue;
          star.sat = palette.sat;
          star.lightness = palette.lightness;
        }

        const sx = star.x / (star.z / 100) + vanishX;
        const sy = star.y / (star.z / 100) + vanishY;
        
        const pzClamp = Math.max(1, star.pz);
        const px = star.x / (pzClamp / 100) + vanishX;
        const py = star.y / (pzClamp / 100) + vanishY;

        star.pz = star.z;

        const t = Math.max(0, Math.min(1, 1 - (star.z / width)));
        
        ctx.beginPath();
        if (currentSpeed < 1.5) {
          ctx.fillStyle = `hsla(${star.hue}, ${star.sat}%, ${star.lightness}%, ${t})`;
          ctx.arc(sx, sy, Math.max(0.5, t * 1.8 * star.sizeMultiplier), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = `hsla(${star.hue}, ${star.sat}%, ${star.lightness}%, ${t})`;
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.lineWidth = Math.max(0.4, t * 2.2 * star.sizeMultiplier);
          ctx.stroke();
        }
      });

      // 3. Draw Planets / Satellites
      planets.forEach((planet) => {
        planet.z -= currentSpeed;
        planet.rotAngle += planet.rotSpeed;

        if (planet.z < 1) {
          const coords = createStarCoords(width, height, width);
          planet.x = coords.x;
          planet.y = coords.y;
          planet.z = width;
          planet.pz = planet.z;
          planet.size = Math.random() * 16 + 10;
          planet.hue = Math.random() * 360;
        }

        const sx = planet.x / (planet.z / 100) + vanishX;
        const sy = planet.y / (planet.z / 100) + vanishY;
        const size2d = planet.size / (planet.z / 100);

        planet.pz = planet.z;

        // Draw planet only if inside boundaries
        if (sx > -size2d * 3 && sx < width + size2d * 3 && sy > -size2d * 3 && sy < height + size2d * 3 && planet.z > 5) {
          const t = Math.max(0, Math.min(1, 1 - (planet.z / width)));

          // Planets with back rings, orb body, front rings design
          ctx.save();
          
          if (planet.hasRing) {
            // BACK HALF RING (Draw first for occlusion)
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(planet.ringAngle);
            ctx.beginPath();
            ctx.ellipse(0, 0, size2d * 2.1, size2d * 0.35, 0, Math.PI, Math.PI * 2); // only back half
            ctx.strokeStyle = `hsla(${(planet.hue + 45) % 360}, 60%, 75%, ${t * 0.75})`;
            ctx.lineWidth = size2d * 0.16;
            ctx.stroke();
            ctx.restore();
          }

          // PLANET BODY SHADED
          const planetGrad = ctx.createRadialGradient(
            sx - size2d * 0.3, sy - size2d * 0.3, size2d * 0.1,
            sx, sy, size2d
          );
          planetGrad.addColorStop(0, `hsla(${planet.hue}, 85%, 65%, ${t})`);
          planetGrad.addColorStop(0.6, `hsla(${planet.hue}, 90%, 40%, ${t})`);
          planetGrad.addColorStop(1, `rgba(5, 2, 10, ${t})`);

          ctx.beginPath();
          ctx.arc(sx, sy, size2d, 0, Math.PI * 2);
          ctx.fillStyle = planetGrad;
          ctx.fill();

          if (planet.hasRing) {
            // FRONT HALF RING (Draw on top for occlusion)
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(planet.ringAngle);
            ctx.beginPath();
            ctx.ellipse(0, 0, size2d * 2.1, size2d * 0.35, 0, 0, Math.PI); // only front half
            ctx.strokeStyle = `hsla(${(planet.hue + 45) % 360}, 60%, 75%, ${t * 0.75})`;
            ctx.lineWidth = size2d * 0.16;
            ctx.stroke();
            ctx.restore();
          }

          ctx.restore();
        }
      });

      // 4. Draw Giant Suns / Stars (恒星)
      giantStars.forEach((gs) => {
        gs.z -= currentSpeed;

        if (gs.z < 1) {
          const coords = createStarCoords(width, height, width);
          gs.x = coords.x;
          gs.y = coords.y;
          gs.z = width;
          gs.pz = gs.z;
        }

        const sx = gs.x / (gs.z / 100) + vanishX;
        const sy = gs.y / (gs.z / 100) + vanishY;
        const size2d = gs.size / (gs.z / 100);

        gs.pz = gs.z;

        if (sx > -size2d * 2 && sx < width + size2d * 2 && sy > -size2d * 2 && sy < height + size2d * 2 && gs.z > 5) {
          const t = Math.max(0, Math.min(1, 1 - (gs.z / width)));

          // Glowing Halo Gradient
          const starGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size2d * 3.5);
          starGlow.addColorStop(0, gs.color + `${t})`);
          starGlow.addColorStop(0.2, gs.color + `${t * 0.4})`);
          starGlow.addColorStop(0.5, gs.glowColor);
          starGlow.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.beginPath();
          ctx.arc(sx, sy, size2d * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = starGlow;
          ctx.fill();

          // Bright inner sun core
          ctx.beginPath();
          ctx.arc(sx, sy, size2d, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${t})`;
          ctx.fill();

          // Elegant Cross diffraction spikes / lens flares for high luminosity effect
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${t * 0.6})`;
          ctx.lineWidth = Math.max(1, size2d * 0.15);
          ctx.moveTo(sx - size2d * 4, sy);
          ctx.lineTo(sx + size2d * 4, sy);
          ctx.moveTo(sx, sy - size2d * 4);
          ctx.lineTo(sx, sy + size2d * 4);
          ctx.stroke();
        }
      });

      // 5. Spawn & Draw Meteors (流星)
      meteors.forEach((m) => {
        if (!m.active) {
          // Spawn shooting stars based on hand warp Speed
          const baseChance = 0.003;
          const speedMultiplier = (currentSpeed / 75) * 0.015;
          if (Math.random() < (baseChance + speedMultiplier)) {
            m.active = true;
            m.x = Math.random() * width;
            m.y = Math.random() * (height * 0.3); // Spawn in upper skies
            
            // Random slant angles
            const angle = Math.PI / 6 + Math.random() * (Math.PI / 5); // Diagonal downwards
            m.speed = Math.random() * 22 + 18;
            const dist = Math.random() * 280 + 200;
            m.targetX = m.x + Math.cos(angle) * dist;
            m.targetY = m.y + Math.sin(angle) * dist;
            m.length = Math.random() * 120 + 70;
            m.width = Math.random() * 2.2 + 1.2;
            m.opacity = 1;
            m.hue = Math.random() < 0.55 ? 315 : 195; // Magenta or bright Cyan
          }
        } else {
          const dx = m.targetX - m.x;
          const dy = m.targetY - m.y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < m.speed) {
            m.active = false;
          } else {
            // Trace movement
            const ratio = m.speed / d;
            m.x += dx * ratio;
            m.y += dy * ratio;
            m.opacity -= 0.014;
            if (m.opacity <= 0) m.active = false;
          }

          // Draw the beautiful glowing meteor stream
          if (m.active) {
            const angle = Math.atan2(m.targetY - m.y, m.targetX - m.x);
            const tailX = m.x - Math.cos(angle) * m.length;
            const tailY = m.y - Math.sin(angle) * m.length;

            const meteorGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
            meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            meteorGrad.addColorStop(0.35, `hsla(${m.hue}, 95%, 72%, ${m.opacity * 0.4})`);
            meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${m.opacity})`);

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = meteorGrad;
            ctx.lineWidth = m.width;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-[#020204]" />;
}
