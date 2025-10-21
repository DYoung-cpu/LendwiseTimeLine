// LendWise Timeline Interactive JavaScript

// Three.js Shader Animation
function initShaderAnimation() {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        return;
    }

    const container = document.getElementById('shader-container');
    if (!container) {
        console.error('Shader container not found');
        return;
    }
    console.log('Initializing shader animation...');

    // Vertex shader
    const vertexShader = `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `;

    // Fragment shader - ORIGINAL CODE with owl origin adjustment
    const fragmentShader = `
        #define TWO_PI 6.2831853072
        #define PI 3.14159265359

        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            float t = time * 0.03;  // Slightly slower than original 0.05
            float lineWidth = 0.002;

            vec3 goldColor = vec3(1.0, 0.84, 0.0);  // Gold
            vec3 greenColor = vec3(0.0, 0.8, 0.2);  // Green

            float intensity = 0.0;

            // Owl radius offset - ripples start from owl edge
            float owlRadius = 0.13;

            for(int i=0; i < 5; i++){
                // Original formula with offset for owl
                float rippleExpansion = fract(t + float(i)*0.01)*5.0;
                float adjustedLength = length(uv) - owlRadius;  // Offset by owl radius
                intensity += lineWidth*float(i*i) / abs(rippleExpansion - adjustedLength + mod(uv.x+uv.y, 0.2));
            }

            // Fade out inside owl area
            float fadeFactor = smoothstep(0.0, owlRadius, length(uv));
            intensity *= fadeFactor;

            // Mix gold and green based on position and time - ORIGINAL
            float mixFactor = sin(uv.x * 3.0 + time * 0.1) * 0.5 + 0.5;
            vec3 color = mix(goldColor, greenColor, mixFactor) * intensity;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Initialize Three.js scene
    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
        time: { type: "f", value: 1.0 },
        resolution: { type: "v2", value: new THREE.Vector2() }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    // Insert canvas as first child of container
    container.insertBefore(renderer.domElement, container.firstChild);

    // Handle window resize
    function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        uniforms.resolution.value.x = renderer.domElement.width;
        uniforms.resolution.value.y = renderer.domElement.height;
    }

    // Initial resize
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        uniforms.time.value += 0.02;  // Slower animation for clearer ripples
        renderer.render(scene, camera);
    }

    // Start animation
    animate();
}

// Initialize counters
function initCounters() {
    // Calculate days since founding (August 1, 2024)
    const foundingDate = new Date('2024-08-01');
    const today = new Date();
    const daysDiff = Math.floor((today - foundingDate) / (1000 * 60 * 60 * 24));

    // Animate counters
    const counters = [
        { id: 'days-operating', target: daysDiff, duration: 2000 },
        { id: 'states-licensed', target: 7, duration: 1500 },
        { id: 'lender-partners', target: 12, duration: 1800 },
        { id: 'milestones-complete', target: 18, duration: 2000 }
    ];

    counters.forEach(counter => {
        animateCounter(counter.id, counter.target, counter.duration);
    });
}

// Animate counter from 0 to target
function animateCounter(id, target, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    let start = 0;
    const increment = target / (duration / 16);

    const updateCounter = () => {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    // Start animation when element is in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateCounter();
                observer.unobserve(entry.target);
            }
        });
    });

    observer.observe(element);
}

// Timeline scroll functionality
function scrollTimeline(direction) {
    const wrapper = document.querySelector('.timeline-wrapper');
    const scrollAmount = 400;

    if (direction === 'left') {
        wrapper.scrollLeft -= scrollAmount;
    } else {
        wrapper.scrollLeft += scrollAmount;
    }
}

// Timeline filtering
function initTimelineFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const timelineItems = document.querySelectorAll('.timeline-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            // Filter timeline items
            timelineItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    gsap.from(item, {
                        scale: 0.8,
                        opacity: 0,
                        duration: 0.3
                    });
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Timeline item click handlers
function initTimelineInteractions() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    const modal = document.getElementById('timeline-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalDetails = document.getElementById('modal-details');
    const closeModal = document.querySelector('.close-modal');

    timelineItems.forEach(item => {
        item.addEventListener('click', () => {
            const title = item.querySelector('h4').textContent;
            const description = item.querySelector('p').textContent;
            const date = item.querySelector('.timeline-date').textContent;
            const category = item.dataset.category;

            modalTitle.textContent = title;
            modalDescription.textContent = description;

            // Add additional details based on the milestone
            let details = `
                <div style="margin-top: 20px;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Category:</strong> ${category}</p>
                `;

            // Add specific details for certain milestones
            if (title.includes('NMLS')) {
                details += `
                    <p><strong>NMLS ID:</strong> #2581507</p>
                    <p><strong>Status:</strong> Active and in good standing</p>
                `;
            } else if (title.includes('Encompass')) {
                details += `
                    <p><strong>Integration Level:</strong> Full API access</p>
                    <p><strong>Features:</strong> Loan origination, automated underwriting, document management</p>
                `;
            } else if (title.includes('DSCR')) {
                details += `
                    <p><strong>Calculation Time:</strong> < 5 seconds</p>
                    <p><strong>Accuracy:</strong> 99.9%</p>
                    <p><strong>Properties Analyzed:</strong> 500+</p>
                `;
            }

            details += '</div>';
            modalDetails.innerHTML = details;

            modal.style.display = 'block';
            gsap.from('.modal-content', {
                y: -50,
                opacity: 0,
                duration: 0.3
            });
        });
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Smooth scroll for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animate elements on scroll
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Animate section headers
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            y: 30,
            opacity: 0,
            duration: 1,
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                once: true
            }
        });
    });

    // Animate cards
    gsap.utils.toArray('.about-card, .achievement-card, .project-card').forEach(card => {
        gsap.from(card, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true
            }
        });
    });

    // Animate progress bars
    gsap.utils.toArray('.progress-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';

        gsap.to(bar, {
            width: width,
            duration: 2,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: bar,
                start: 'top 85%',
                once: true
            }
        });
    });

    // Animate timeline items
    gsap.utils.toArray('.timeline-item').forEach((item, index) => {
        gsap.from(item, {
            x: index % 2 === 0 ? -50 : 50,
            opacity: 0,
            duration: 0.6,
            delay: index * 0.1,
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                once: true
            }
        });
    });
}

// State map interactions
function initStateMap() {
    const states = document.querySelectorAll('.state');

    states.forEach(state => {
        state.addEventListener('click', () => {
            const stateName = state.dataset.state;
            const status = state.classList.contains('licensed') ? 'Licensed' :
                          state.classList.contains('in-progress') ? 'In Progress' : 'Planned';

            // Show tooltip or modal with state details
            alert(`${stateName}: ${status}`);
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting animations...');

    // Initialize Three.js shader animation
    initShaderAnimation();


    // 3-Second Intro Animation Timing with Owl Transition
    const shaderContainer = document.getElementById('shader-container');
    const introOwl = document.querySelector('.wisr-showcase-center');
    const heroOwl = document.querySelector('.wisr-hero-center');

    // Start fade out at 2.5 seconds (only shader, not owl)
    setTimeout(() => {
        if (shaderContainer) {
            // Fade out only the canvas/shader background
            const canvas = shaderContainer.querySelector('canvas');
            if (canvas) {
                canvas.style.transition = 'opacity 0.5s ease-out';
                canvas.style.opacity = '0';
            }

            // Keep the owl visible during transition
            if (introOwl) {
                introOwl.style.transition = 'opacity 0.5s ease-out';
                // Owl stays visible
            }
        }
    }, 2500);

    // Complete transition at 3 seconds
    setTimeout(() => {
        if (shaderContainer) {
            shaderContainer.style.display = 'none';
        }

        // Initialize page interactions after intro
        // initCounters(); // Removed stats dashboard
        initTimelineFilters();
        initTimelineInteractions();
        initSmoothScroll();
        initScrollAnimations();
        initStateMap();
    }, 3000);

    // Remove parallax effect that was causing the issue
    // Keep shader animation fixed in place

    // Sticky navigation background
    const nav = document.querySelector('.main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(255, 255, 255, 0.98)';
            nav.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.95)';
            nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // Trigger entrance animations
    gsap.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 1.5,
        delay: 0.5,
        ease: 'power3.out'
    });

    gsap.from('.scroll-indicator', {
        y: -20,
        opacity: 0,
        duration: 1,
        delay: 1.5,
        ease: 'power2.out'
    });
});

// Position Adjustment Controls
window.toggleControls = function() {
    const controls = document.querySelector('.position-controls');
    const button = document.querySelector('button[onclick="toggleControls()"]');
    if (controls.style.display === 'none') {
        controls.style.display = 'block';
        button.style.display = 'none';
    } else {
        controls.style.display = 'none';
        button.style.display = 'block';
    }
};

// Adjust title position in real-time
document.addEventListener('DOMContentLoaded', () => {
    const leftSlider = document.getElementById('leftPos');
    const topSlider = document.getElementById('topPos');
    const leftVal = document.getElementById('leftVal');
    const topVal = document.getElementById('topVal');
    const heroTitle = document.querySelector('.hero-title');

    if (leftSlider && heroTitle) {
        leftSlider.addEventListener('input', (e) => {
            const offset = e.target.value;
            leftVal.textContent = offset;
            heroTitle.style.transform = `translateX(calc(-50% + ${offset}px))`;
        });

        topSlider.addEventListener('input', (e) => {
            const topValue = e.target.value;
            topVal.textContent = topValue;
            heroTitle.style.top = `${topValue}%`;
        });
    }
});