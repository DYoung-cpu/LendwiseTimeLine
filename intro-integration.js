// Intro Integration JavaScript
// This file adds the looping intro animation and auth to modern-timeline.html

// Three.js Shader Animation - Modified for continuous loop
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
    console.log('Initializing continuous shader animation...');

    // Vertex shader
    const vertexShader = `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `;

    // Fragment shader - Original with reduced black screen time
    const fragmentShader = `
        #define TWO_PI 6.2831853072
        #define PI 3.14159265359

        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            float t = time * 0.045;  // Optimized cycle speed
            float lineWidth = 0.002;

            vec3 goldColor = vec3(1.0, 0.84, 0.0);  // Gold
            vec3 greenColor = vec3(0.0, 0.8, 0.2);  // Green

            float intensity = 0.0;

            // Owl radius offset - ripples start from owl edge
            float owlRadius = 0.13;

            for(int i=0; i < 5; i++){
                // Optimized to minimize black screen time
                float rippleExpansion = fract(t + float(i)*0.015)*2.2;  // Max 2.2 units, tighter spacing
                float adjustedLength = length(uv) - owlRadius;
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

    // Animation loop - CONTINUOUS
    function animate() {
        requestAnimationFrame(animate);
        uniforms.time.value += 0.024;  // 20% faster (0.02 * 1.20)
        renderer.render(scene, camera);
    }

    // Start animation
    animate();

    // Make uniforms globally accessible for debugging
    window.shaderUniforms = uniforms;
}

// Transition from intro to timeline
function transitionToTimeline() {
    const shaderContainer = document.getElementById('shader-container');
    const mainContent = document.querySelector('.main-content');

    if (shaderContainer && mainContent) {
        // Fade out intro
        shaderContainer.style.transition = 'opacity 0.5s ease-out';
        shaderContainer.style.opacity = '0';

        // Show and fade in timeline
        mainContent.style.transition = 'opacity 0.5s ease-in';
        mainContent.style.opacity = '1';

        // Initialize timeline components
        setTimeout(() => {
            if (typeof initializeCarouselGallery !== 'undefined') {
                initializeCarouselGallery();
                setupNavigationButtons();
                setupTimelineClicks();
                setupTimelineNavigation();
                setupPositionControls();
                setupModalHandlers();
                console.log('✅ Timeline initialized after auth');
            }
        }, 100);

        // Hide intro completely after fade
        setTimeout(() => {
            shaderContainer.style.display = 'none';
        }, 600);
    }
}

// Initialize intro on page load
document.addEventListener('DOMContentLoaded', () => {
    // Start shader animation
    initShaderAnimation();

    // Ensure shader container stays visible
    const shaderContainer = document.getElementById('shader-container');
    if (shaderContainer) {
        shaderContainer.style.display = 'block';
        shaderContainer.style.opacity = '1';
    }

    // Sign In Dropdown JavaScript
    const signInBtn = document.getElementById('signInBtn');
    const signInDropdown = document.getElementById('signInDropdown');
    const signInForm = document.getElementById('signInForm');
    const googleSignIn = document.getElementById('googleSignIn');
    const emailSignInBtn = document.getElementById('emailSignInBtn');
    const signUpBtn = document.getElementById('signUpBtn');

    // Step Management
    let currentStep = 1;
    let currentFlow = null;

    function showStep(stepNum, flow = null) {
        // Hide all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });

        // Show the target step
        const targetStep = document.getElementById(`step${stepNum}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        // Reset scroll position
        const stepContainer = document.querySelector('.step-container');
        if (stepContainer) {
            stepContainer.scrollTop = 0;
        }

        // Update dots based on flow
        const dots = document.querySelectorAll('.dot');
        if (flow === 'email') {
            dots[2].style.display = 'none';
            dots[3].style.display = 'none';
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index < stepNum);
            });
        } else if (flow === 'signup') {
            dots[2].style.display = 'inline-block';
            dots[3].style.display = 'none';
            const dotIndex = stepNum === 3 ? 1 : stepNum === 4 ? 2 : 0;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index <= dotIndex);
            });
        } else {
            dots[1].style.display = 'inline-block';
            dots[2].style.display = 'none';
            dots[3].style.display = 'none';
            dots[0].classList.add('active');
            dots[1].classList.remove('active');
            dots[2].classList.remove('active');
        }

        currentStep = stepNum;
        if (flow) currentFlow = flow;
    }

    // Toggle dropdown
    if (signInBtn && signInDropdown) {
        signInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            signInDropdown.classList.toggle('show');
            if (signInDropdown.classList.contains('show')) {
                showStep(1);
                currentFlow = null;
            }
        });
    }

    // Google sign in - Transition to timeline
    if (googleSignIn) {
        googleSignIn.addEventListener('click', async () => {
            googleSignIn.classList.add('loading');
            googleSignIn.disabled = true;

            // Simulate OAuth flow
            await new Promise(resolve => setTimeout(resolve, 1500));

            googleSignIn.classList.remove('loading');
            googleSignIn.disabled = false;

            // Close dropdown
            signInDropdown.classList.remove('show');

            // Transition to timeline
            transitionToTimeline();
        });
    }

    // Email Sign In Button
    if (emailSignInBtn) {
        emailSignInBtn.addEventListener('click', () => {
            showStep(2, 'email');
            setTimeout(() => {
                const emailField = document.getElementById('signInEmailInput');
                if (emailField) emailField.focus();
            }, 300);
        });
    }

    // Sign Up Button
    if (signUpBtn) {
        signUpBtn.addEventListener('click', () => {
            showStep(3, 'signup');
            setTimeout(() => {
                const firstNameField = document.getElementById('firstNameInput');
                if (firstNameField) firstNameField.focus();
            }, 300);
        });
    }

    // Sign Up Next Button
    const signUpNextBtn = document.getElementById('signUpNextBtn');
    if (signUpNextBtn) {
        signUpNextBtn.addEventListener('click', () => {
            const firstName = document.getElementById('firstNameInput').value;
            const lastName = document.getElementById('lastNameInput').value;
            const email = document.getElementById('emailInput').value;
            const errorMsg = document.getElementById('signUpErrorMessage1');

            if (!firstName || !lastName || !email) {
                showError('Please fill in all fields.', errorMsg);
                return;
            }

            if (!validateEmail(email)) {
                showError('Please enter a valid email address.', errorMsg);
                return;
            }

            if (errorMsg) errorMsg.style.display = 'none';
            showStep(4, 'signup');
            setTimeout(() => {
                const passwordField = document.getElementById('passwordInput');
                if (passwordField) passwordField.focus();
            }, 300);
        });
    }

    // Back Buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showStep(1);
            currentFlow = null;
            document.querySelectorAll('.error-message').forEach(msg => {
                msg.style.display = 'none';
            });
        });
    });

    // Sign Up Back Button
    const signUpBackBtn = document.getElementById('signUpBackBtn');
    if (signUpBackBtn) {
        signUpBackBtn.addEventListener('click', () => {
            showStep(3, 'signup');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!signInDropdown.contains(e.target) && e.target !== signInBtn) {
            signInDropdown.classList.remove('show');
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && signInDropdown.classList.contains('show')) {
            signInDropdown.classList.remove('show');
            if (signInForm) signInForm.reset();
        }
    });

    // Sign In Form submission
    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const email = document.getElementById('signInEmailInput').value;
            const password = document.getElementById('signInPasswordInput').value;
            const errorMsg = document.getElementById('signInErrorMessage');

            if (!email || !password) {
                showError('Please fill in all fields.', errorMsg);
                return;
            }

            if (!validateEmail(email)) {
                showError('Please enter a valid email address.', errorMsg);
                return;
            }

            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1500));

            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            if (errorMsg) errorMsg.style.display = 'none';
            signInDropdown.classList.remove('show');
            signInForm.reset();

            // Transition to timeline after successful sign-in
            transitionToTimeline();
        });
    }

    // Sign Up Submit
    const signUpSubmitBtn = document.getElementById('signUpSubmitBtn');
    if (signUpSubmitBtn) {
        signUpSubmitBtn.addEventListener('click', async () => {
            const password = document.getElementById('passwordInput').value;
            const confirmPassword = document.getElementById('confirmPasswordInput').value;
            const phone = document.getElementById('phoneInput').value;
            const errorMsg = document.getElementById('signUpErrorMessage2');

            if (!password || !confirmPassword || !phone) {
                showError('Please fill in all fields.', errorMsg);
                return;
            }

            if (password.length < 6) {
                showError('Password must be at least 6 characters.', errorMsg);
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match.', errorMsg);
                return;
            }

            signUpSubmitBtn.classList.add('loading');
            signUpSubmitBtn.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1500));

            signUpSubmitBtn.classList.remove('loading');
            signUpSubmitBtn.disabled = false;

            if (errorMsg) errorMsg.style.display = 'none';

            // Clear form
            document.getElementById('firstNameInput').value = '';
            document.getElementById('lastNameInput').value = '';
            document.getElementById('emailInput').value = '';
            document.getElementById('passwordInput').value = '';
            document.getElementById('confirmPasswordInput').value = '';
            document.getElementById('phoneInput').value = '';

            signInDropdown.classList.remove('show');
            setTimeout(() => {
                showStep(1);
                currentFlow = null;
            }, 300);

            // Transition to timeline after successful sign-up
            transitionToTimeline();
        });
    }

    // Email validation
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Show error
    function showError(message, errorElement) {
        if (!errorElement) {
            const activeStep = document.querySelector('.step.active');
            if (activeStep) {
                errorElement = activeStep.querySelector('.error-message');
            }
        }
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
});