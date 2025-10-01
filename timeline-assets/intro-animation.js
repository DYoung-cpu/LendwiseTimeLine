// Intro Animation with Three.js Shader

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

// Initialize shader animation on page load
document.addEventListener('DOMContentLoaded', () => {
    initShaderAnimation();

    // Hide entire shader container and all its contents after 3 seconds
    setTimeout(() => {
        const shaderContainer = document.getElementById('shader-container');
        const mainContent = document.querySelector('.main-content');

        // Hide the shader container completely
        if (shaderContainer) {
            shaderContainer.style.transition = 'opacity 0.5s ease-out';
            shaderContainer.style.opacity = '0';
            setTimeout(() => {
                shaderContainer.style.display = 'none';
                shaderContainer.remove(); // Completely remove it from DOM
            }, 500);
        }

        // CRITICAL: Show the main content and initialize timeline
        if (mainContent) {
            mainContent.style.transition = 'opacity 0.5s ease-in';
            mainContent.style.opacity = '1';

            // Initialize timeline components after showing content
            setTimeout(() => {
                if (typeof initializeCarouselGallery !== 'undefined') {
                    initializeCarouselGallery();
                }
                if (typeof setupNavigationButtons !== 'undefined') {
                    setupNavigationButtons();
                }
                if (typeof setupTimelineClicks !== 'undefined') {
                    setupTimelineClicks();
                }
                if (typeof setupTimelineNavigation !== 'undefined') {
                    setupTimelineNavigation();
                }
                if (typeof setupModalHandlers !== 'undefined') {
                    setupModalHandlers();
                }
                console.log('Checking for setupFilterContainer:', typeof setupFilterContainer);
                if (typeof setupFilterContainer !== 'undefined') {
                    console.log('Calling setupFilterContainer...');
                    setupFilterContainer();
                } else {
                    console.error('❌ setupFilterContainer function not found!');
                }
                console.log('✅ Timeline initialized after 3-second intro');
            }, 100);
        }

        // CRITICAL: Find and remove ALL wisr-showcase-center elements, especially rogue ones
        // This handles any owl elements that might have been moved to body
        const allOwlElements = document.querySelectorAll('.wisr-showcase-center');
        allOwlElements.forEach(owl => {
            // Only remove if it's part of the intro, not the landing page owl
            const isLandingOwl = owl.closest('.landing-owl') || owl.classList.contains('landing-owl');
            if (!isLandingOwl) {
                console.log('Removing owl element:', owl.parentElement.tagName);
                owl.style.display = 'none';
                owl.remove(); // Completely remove from DOM
            }
        });

        // Also remove any stray video elements with owl video
        const owlVideos = document.querySelectorAll('video[src*="wisr-owl"]');
        owlVideos.forEach(video => {
            const parent = video.closest('.wisr-showcase-center, .wisr-video-circle');
            if (parent) {
                // Only remove if it's part of the intro, not the landing page owl
                const isLandingOwl = parent.closest('.landing-owl');
                if (!isLandingOwl) {
                    parent.remove();
                }
            }
        });

        // Extra cleanup for any elements with wisr classes that might be lingering
        // IMPORTANT: Don't remove the landing-owl which is intentionally on the page
        const wisrElements = document.querySelectorAll('[class*="wisr-showcase"], [class*="wisr-glow"], [class*="wisr-video"]');
        wisrElements.forEach(el => {
            // Only remove if it's part of the intro, not the landing page owl
            const isLandingOwl = el.closest('.landing-owl') || el.classList.contains('landing-owl');
            if (!isLandingOwl && (el.closest('#shader-container') || el.parentElement === document.body)) {
                el.remove();
            }
        });
    }, 3000);
});