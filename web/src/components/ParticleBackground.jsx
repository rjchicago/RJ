import { useEffect, useRef } from 'react';

const ParticleBackground = ({ particleCount = 500, titleHover = false, getTitleBounds }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const animationRef = useRef(null);
  const titleHoverRef = useRef(titleHover);
  const prevTitleHoverRef = useRef(titleHover);
  const getTitleBoundsRef = useRef(getTitleBounds);

  // Update refs when props change
  useEffect(() => {
    // Detect transition from hover to not-hover (for explosion)
    if (prevTitleHoverRef.current && !titleHover) {
      // Trigger explosion with varied distances
      for (const particle of particlesRef.current) {
        const angle = Math.random() * Math.PI * 2;
        // Random force between 10 and 80 (will travel far before friction stops them)
        const force = 10 + Math.random() * 70;
        particle.vx = Math.cos(angle) * force;
        particle.vy = Math.sin(angle) * force;
      }
    }
    prevTitleHoverRef.current = titleHover;
    titleHoverRef.current = titleHover;
  }, [titleHover]);

  useEffect(() => {
    getTitleBoundsRef.current = getTitleBounds;
  }, [getTitleBounds]);

  // Ocean theme colors
  const colors = [
    '#00f5ff', '#00d4e6', '#0099cc', '#0077b3',
    '#00557a', '#40e0d0', '#48d1cc', '#20b2aa',
    '#5f9ea0', '#7fcdcd', '#00ced1', '#008b8b'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 1 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.4 + Math.random() * 0.6,
          baseAlpha: 0.4 + Math.random() * 0.6
        });
      }
    };

    initParticles();

    // Physics settings
    const repelStrength = 0.025;
    const repelRadius = 350;
    const attractStrength = 0.04;
    const maxSpeed = 25;
    const friction = 0.97;

    const animate = () => {
      // Semi-transparent clear for trails
      ctx.fillStyle = 'rgba(5, 5, 15, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const hasMouse = mouse.x !== null && mouse.y !== null;
      const isHoveringTitle = titleHoverRef.current;
      
      // Get title bounds for circular border
      let circleCenterX = 0, circleCenterY = 0, circleRadius = 0;
      if (isHoveringTitle && getTitleBoundsRef.current) {
        const bounds = getTitleBoundsRef.current();
        if (bounds) {
          circleCenterX = bounds.left + bounds.width / 2;
          circleCenterY = bounds.top + bounds.height / 2;
          // Radius is half the diagonal + some padding
          circleRadius = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height) / 2 + 30;
        }
      }

      for (const particle of particlesRef.current) {
        // Gentle floating movement + subtle jiggle
        particle.vx += (Math.random() - 0.5) * 0.08;
        particle.vy += (Math.random() - 0.5) * 0.08;
        // Occasional soft direction drift
        if (Math.random() < 0.005) {
          const angle = Math.random() * Math.PI * 2;
          particle.vx += Math.cos(angle) * 0.3;
          particle.vy += Math.sin(angle) * 0.3;
        }
        // Slow wave-like drift
        particle.vx += Math.sin(Date.now() * 0.0005 + particle.y * 0.005) * 0.015;
        particle.vy += Math.cos(Date.now() * 0.0005 + particle.x * 0.005) * 0.015;

        if (isHoveringTitle && circleRadius > 0) {
          // ATTRACT to circular border around RJ
          const dx = circleCenterX - particle.x;
          const dy = circleCenterY - particle.y;
          const distToCenter = Math.sqrt(dx * dx + dy * dy);
          
          // Target is on the circle edge
          const targetX = circleCenterX - (dx / distToCenter) * circleRadius;
          const targetY = circleCenterY - (dy / distToCenter) * circleRadius;
          
          const toTargetX = targetX - particle.x;
          const toTargetY = targetY - particle.y;
          const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);
          
          if (distToTarget > 5) {
            particle.vx += (toTargetX / distToTarget) * attractStrength * 2;
            particle.vy += (toTargetY / distToTarget) * attractStrength * 2;
          }
          
          // Add slight tangential motion for orbiting effect
          const tangentX = -dy / distToCenter;
          const tangentY = dx / distToCenter;
          particle.vx += tangentX * 0.02;
          particle.vy += tangentY * 0.02;
          
          particle.alpha = Math.min(1, particle.baseAlpha + 0.3);
        } else if (hasMouse) {
          // ATTRACT to cursor - gentle with distance decay
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const cursorRadius = 400;
          if (dist < cursorRadius && dist > 20) {
            // Quadratic falloff for smoother decay - weaker so particles escape easily
            const normalizedDist = dist / cursorRadius;
            const force = 0.0075 * Math.pow(1 - normalizedDist, 2);
            particle.vx += (dx / dist) * force * 3;
            particle.vy += (dy / dist) * force * 3;
            particle.alpha = Math.min(1, particle.baseAlpha + 0.15 * (1 - normalizedDist));
          } else {
            particle.alpha = particle.baseAlpha;
          }
        } else {
          particle.alpha = particle.baseAlpha;
        }

        // Apply friction
        particle.vx *= friction;
        particle.vy *= friction;

        // Clamp speed
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges with offscreen buffer
        const buffer = 200;
        if (particle.x < -buffer) particle.x = canvas.width + buffer;
        if (particle.x > canvas.width + buffer) particle.x = -buffer;
        if (particle.y < -buffer) particle.y = canvas.height + buffer;
        if (particle.y > canvas.height + buffer) particle.y = -buffer;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Mouse tracking
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
      }}
    />
  );
};

export default ParticleBackground;
