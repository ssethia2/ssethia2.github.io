/**
 * Interactive Particle Canvas System
 * Creates a beautiful connected node network representing mathematical/linguistic links.
 * Adapts to theme changes (colors from CSS variables) and mouse cursor movement.
 */

export function initCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // Create canvas element
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let animationFrameId;
  let particles = [];
  let width = 0;
  let height = 0;

  // Mouse positions
  const mouse = {
    x: null,
    y: null,
    radius: 180 // Connection range of the mouse spotlight
  };

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Dynamic colors based on active theme
  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      particleColor: isDark ? 'rgba(0, 242, 254, 0.4)' : 'rgba(79, 172, 254, 0.35)',
      linkColor: isDark ? 'rgba(0, 242, 254, 0.07)' : 'rgba(79, 172, 254, 0.08)',
      particleRadius: isDark ? 2.5 : 2.0,
      linkDistance: 130
    };
  }

  let theme = getThemeColors();

  // Handle color adjustments when theme changes
  const observer = new MutationObserver(() => {
    theme = getThemeColors();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initPhase = false) {
      this.x = Math.random() * width;
      this.y = initPhase ? Math.random() * height : -10;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() * 0.4) + 0.15; // Slow downward drift
      this.size = Math.random() * 1.5 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around boundary bounds
      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y > height) {
        this.reset(false);
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * theme.particleRadius, 0, Math.PI * 2);
      ctx.fillStyle = theme.particleColor;
      ctx.fill();
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    // Adjust particle density based on screen size
    const numParticles = Math.floor((width * height) / 11000);
    particles = [];
    for (let i = 0; i < Math.min(numParticles, 120); i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw lines between particles and particles/mouse
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.update();
      p1.draw();

      // Mouse interactive connection
      if (mouse.x !== null && mouse.y !== null) {
        const dx = p1.x - mouse.x;
        const dy = p1.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
          const alpha = (1 - dist / mouse.radius) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = theme.particleColor.replace('0.4', alpha).replace('0.35', alpha);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Inter-particle connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < theme.linkDistance) {
          const alpha = (1 - dist / theme.linkDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = theme.linkColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  
  // Initial setup
  resize();
  animate();

  // Return clean-up function in case needed
  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(animationFrameId);
    observer.disconnect();
  };
}
