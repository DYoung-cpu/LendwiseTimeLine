// Timeline Star Particle System
// Subtle star field with scroll interaction and twinkling

class TimelineStars {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.container = this.canvas.closest('.timeline-border-container');
        this.viewport = document.querySelector('.timeline-viewport');

        // Configuration
        this.particleCount = options.particleCount || 40;
        this.colors = options.colors || [
            { color: '#ffffff', weight: 0.7 },  // White 70%
            { color: '#ffd700', weight: 0.2 },  // Gold 20%
            { color: '#00c8ff', weight: 0.1 }   // Cyan 10%
        ];

        this.particles = [];
        this.mouse = { x: null, y: null, isOver: false };
        this.scrollVelocity = 0;
        this.lastScrollLeft = 0;
        this.animationId = null;

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        // Handle retina displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;
    }

    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.particleCount; i++) {
            // Weighted random color selection
            let random = Math.random();
            let cumulative = 0;
            let selectedColor = this.colors[0].color;

            for (let colorObj of this.colors) {
                cumulative += colorObj.weight;
                if (random <= cumulative) {
                    selectedColor = colorObj.color;
                    break;
                }
            }

            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1 + 0.5, // 0.5-1.5px (smaller sparkles)
                baseOpacity: Math.random() * 0.4 + 0.4, // 0.4-0.8
                opacity: Math.random() * 0.4 + 0.4,
                twinkleSpeed: Math.random() * 0.02 + 0.01, // 0.01-0.03
                twinklePhase: Math.random() * Math.PI * 2,
                vx: (Math.random() - 0.5) * 0.2, // Slow drift
                vy: (Math.random() - 0.5) * 0.2,
                color: selectedColor,
                scrollVx: 0, // Velocity from scroll
                rotation: Math.random() * Math.PI // Random rotation for sparkle
            });
        }
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles(); // Recreate particles for new dimensions
        });

        // Mouse movement (cursor interaction)
        this.container.addEventListener('mouseenter', () => {
            this.mouse.isOver = true;
        });

        this.container.addEventListener('mouseleave', () => {
            this.mouse.isOver = false;
            this.mouse.x = null;
            this.mouse.y = null;
        });

        this.container.addEventListener('mousemove', (e) => {
            if (!this.mouse.isOver) return;

            const rect = this.container.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        // Scroll interaction
        if (this.viewport) {
            this.viewport.addEventListener('scroll', () => {
                const currentScrollLeft = this.viewport.scrollLeft;
                this.scrollVelocity = (currentScrollLeft - this.lastScrollLeft) * 0.1;
                this.lastScrollLeft = currentScrollLeft;
            });
        }

        // Pause animation when tab not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    updateParticles() {
        // Decay scroll velocity
        this.scrollVelocity *= 0.95;

        this.particles.forEach(particle => {
            // Twinkling effect
            particle.twinklePhase += particle.twinkleSpeed;
            particle.opacity = particle.baseOpacity + Math.sin(particle.twinklePhase) * 0.2;

            // Base drift movement
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Scroll interaction - particles drift opposite to scroll
            particle.scrollVx = -this.scrollVelocity;
            particle.x += particle.scrollVx;

            // Cursor interaction (subtle)
            if (this.mouse.isOver && this.mouse.x !== null && this.mouse.y !== null) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 100;

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    const angle = Math.atan2(dy, dx);
                    // Very subtle push away from cursor
                    particle.x += Math.cos(angle) * force * 0.5;
                    particle.y += Math.sin(angle) * force * 0.5;
                }
            }

            // Wrap around edges
            if (particle.x < -10) particle.x = this.width + 10;
            if (particle.x > this.width + 10) particle.x = -10;
            if (particle.y < -10) particle.y = this.height + 10;
            if (particle.y > this.height + 10) particle.y = -10;
        });
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.particles.forEach(particle => {
            this.drawSparkle(particle);
        });
    }

    drawSparkle(particle) {
        const { x, y, size, color, opacity, rotation } = particle;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Draw a 4-ray sparkle (cross pattern)
        const rayLength = size * 3; // Rays extend 3x the base size
        const rayWidth = size * 0.3; // Thin rays

        this.ctx.fillStyle = this.hexToRgba(color, opacity);

        // Horizontal ray
        this.ctx.beginPath();
        this.ctx.moveTo(-rayLength, 0);
        this.ctx.lineTo(-rayWidth, -rayWidth);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(-rayWidth, rayWidth);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(rayLength, 0);
        this.ctx.lineTo(rayWidth, -rayWidth);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(rayWidth, rayWidth);
        this.ctx.closePath();
        this.ctx.fill();

        // Vertical ray
        this.ctx.beginPath();
        this.ctx.moveTo(0, -rayLength);
        this.ctx.lineTo(-rayWidth, -rayWidth);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(rayWidth, -rayWidth);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(0, rayLength);
        this.ctx.lineTo(-rayWidth, rayWidth);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(rayWidth, rayWidth);
        this.ctx.closePath();
        this.ctx.fill();

        // Center glow
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        this.ctx.fillStyle = this.hexToRgba(color, opacity * 1.2);
        this.ctx.fill();

        this.ctx.restore();
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume() {
        if (!this.animationId) {
            this.animate();
        }
    }

    destroy() {
        this.pause();
        window.removeEventListener('resize', this.resize);
        // Clean up event listeners
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure timeline is loaded
    setTimeout(() => {
        const stars = new TimelineStars('timeline-stars', {
            particleCount: 40,
            colors: [
                { color: '#ffffff', weight: 0.7 },  // White 70%
                { color: '#ffd700', weight: 0.2 },  // Gold 20%
                { color: '#00c8ff', weight: 0.1 }   // Cyan 10%
            ]
        });

        // Make accessible globally for debugging
        window.timelineStars = stars;
    }, 100);
});
