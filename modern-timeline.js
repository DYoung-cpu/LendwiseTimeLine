// Modern Timeline JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, waiting for intro...');

    // Wait for intro animation to complete (3.5 seconds to ensure intro fades out)
    setTimeout(() => {
        console.log('Intro complete, initializing carousel...');

        // Fade in main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.transition = 'opacity 0.5s ease-in';
            mainContent.style.opacity = '1';
        }

        // Initialize 3D carousel gallery
        initializeCarouselGallery();
        setupNavigationButtons();
        setupTimelineClicks();
        setupPositionControls();  // Add position controls
    }, 3500);
});

// 3D Carousel Gallery Configuration - LOCKED POSITIONS
// DO NOT MODIFY WITHOUT UPDATING CSS POSITIONS
const galleryConfig = {
    radius: 380,  // LOCKED - Critical for card spacing with 12 items
    autoRotateSpeed: 0.25,  // Rotation speed
    scrollSensitivity: 0.5,  // Scroll responsiveness
    currentRotation: 0,
    isAutoRotating: true,
    lastScrollTime: 0,
    scrollTimeout: null,
    animationFrame: null
};

// Initialize 3D Carousel Gallery
function initializeCarouselGallery() {
    const galleryTrack = document.getElementById('galleryTrack');
    const cards = document.querySelectorAll('.gallery-card');

    if (!galleryTrack) {
        console.error('Gallery track not found');
        return;
    }

    if (cards.length === 0) {
        console.error('No gallery cards found');
        return;
    }

    console.log(`Initializing carousel with ${cards.length} cards`);

    // Position cards in 3D circle
    const anglePerCard = 360 / cards.length;

    cards.forEach((card, index) => {
        const angle = index * anglePerCard;
        const transform = `rotateY(${angle}deg) translateZ(${galleryConfig.radius}px)`;
        card.style.transform = transform;
        // Store the base transform as a data attribute
        card.dataset.baseTransform = transform;
        console.log(`Card ${index}: ${transform}`);

        // Calculate initial opacity based on angle
        updateCardOpacity(card, angle - galleryConfig.currentRotation);

        // Add click handler for modal
        card.addEventListener('click', () => {
            const milestoneId = getMilestoneIdByIndex(index);
            if (milestoneId) openModal(milestoneId);
        });
    });

    // Setup scroll-based rotation
    setupScrollRotation(galleryTrack, cards);

    // Start auto-rotation
    startAutoRotation(galleryTrack, cards);

    // Force initial render
    galleryTrack.style.transform = `rotateY(0deg)`;
}

// Setup scroll-based rotation control
function setupScrollRotation(galleryTrack, cards) {
    window.addEventListener('scroll', () => {
        // Stop auto-rotation when scrolling
        galleryConfig.isAutoRotating = false;
        clearTimeout(galleryConfig.scrollTimeout);

        // Calculate rotation based on scroll progress (like React component)
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        galleryConfig.currentRotation = scrollProgress * 360;

        // Apply rotation to gallery
        galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;

        // Update card opacities
        updateAllCardOpacities(cards);

        // Resume auto-rotation after scrolling stops
        galleryConfig.scrollTimeout = setTimeout(() => {
            galleryConfig.isAutoRotating = true;
        }, 150);  // Match React's 150ms timeout
    });
}

// Auto-rotation animation
function startAutoRotation(galleryTrack, cards) {
    if (galleryConfig.animationFrame) {
        cancelAnimationFrame(galleryConfig.animationFrame);
    }

    function rotate() {
        if (galleryConfig.isAutoRotating) {
            galleryConfig.currentRotation += galleryConfig.autoRotateSpeed;
            galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;

            // Update card opacities during rotation
            updateAllCardOpacities(cards);
        }

        galleryConfig.animationFrame = requestAnimationFrame(rotate);
    }

    rotate();
}

// Update opacity for all cards based on viewing angle
function updateAllCardOpacities(cards) {
    const anglePerCard = 360 / cards.length;

    cards.forEach((card, index) => {
        const cardAngle = index * anglePerCard;
        const relativeAngle = cardAngle - galleryConfig.currentRotation;
        updateCardOpacity(card, relativeAngle);
    });
}

// Update individual card opacity based on its angle relative to viewer
function updateCardOpacity(card, angle) {
    // Normalize angle to -180 to 180
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;

    // Calculate opacity (1 when facing viewer, 0.3 when at back)
    const absAngle = Math.abs(angle);
    let opacity = 1;

    if (absAngle > 90) {
        opacity = Math.max(0.3, 1 - ((absAngle - 90) / 90) * 0.7);
    }

    card.style.opacity = opacity;

    // Don't override transform here - keep the original transform
    // The transform should only be set during initialization

    // Add/remove active class for front-facing cards
    if (absAngle < 30) {
        card.classList.add('active');
    } else {
        card.classList.remove('active');
    }
}

// Setup navigation buttons
function setupNavigationButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const cards = document.querySelectorAll('.gallery-card');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.dataset.category;

            // Filter cards by category
            cards.forEach(card => {
                if (category === 'all') {
                    card.style.display = 'block';
                } else {
                    const cardCategory = card.dataset.category;
                    card.style.display = cardCategory === category ? 'block' : 'none';
                }
            });

            // Recalculate positions for visible cards
            const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
            if (visibleCards.length > 0) {
                const anglePerCard = 360 / visibleCards.length;
                visibleCards.forEach((card, index) => {
                    const angle = index * anglePerCard;
                    card.style.transform = `rotateY(${angle}deg) translateZ(${galleryConfig.radius}px)`;
                });
            }
        });
    });
}

// Get milestone ID by card index
function getMilestoneIdByIndex(index) {
    const milestoneIds = ['founded', 'nmls', 'dre', 'dfpi', 'encompass', 'dscr', 'multistate', 'crm', 'wisr', 'fhava', 'underwriting', 'nationwide'];
    return milestoneIds[index] || null;
}

// Setup timeline milestone clicks
function setupTimelineClicks() {
    const milestones = document.querySelectorAll('.timeline-milestone');
    const galleryTrack = document.getElementById('galleryTrack');
    const cards = document.querySelectorAll('.gallery-card');

    if (!galleryTrack || cards.length === 0) return;

    milestones.forEach((milestone) => {
        milestone.addEventListener('click', () => {
            const milestoneIndex = parseInt(milestone.dataset.index);

            // Map timeline milestones to carousel cards
            const cardMapping = {
                0: 2,  // DRE Approval -> DRE License card
                1: 0,  // Location found -> RI HQ card
                2: 0,  // Office Remodel -> RI HQ card
                3: 0,  // Staff Hires -> RI HQ card
                4: 3,  // Other licenses -> DFPI License card
                5: 4,  // LOS -> Encompass card
                6: 7,  // Optimal Blue -> Mission CRM card
                7: 11, // Google Analytics -> Nationwide card
                8: 11, // Website Creation -> Nationwide card
                9: 5   // AI Tool -> DSCR Tool card
            };

            const targetCardIndex = cardMapping[milestoneIndex];
            if (targetCardIndex !== undefined) {
                // Calculate rotation to bring target card to front
                const anglePerCard = 360 / cards.length;
                const targetRotation = -targetCardIndex * anglePerCard;

                // Stop auto-rotation
                galleryConfig.isAutoRotating = false;

                // Animate rotation to target card
                galleryConfig.currentRotation = targetRotation;
                galleryTrack.style.transition = 'transform 0.8s ease-in-out';
                galleryTrack.style.transform = `rotateY(${targetRotation}deg)`;

                // Update card opacities
                updateAllCardOpacities(cards);

                // Resume auto-rotation after animation
                setTimeout(() => {
                    galleryTrack.style.transition = '';
                    galleryConfig.isAutoRotating = true;
                }, 2000);

                // Visual feedback on milestone
                milestone.classList.add('pulse');
                setTimeout(() => {
                    milestone.classList.remove('pulse');
                }, 800);
            }
        });
    });
}

// Open modal with milestone details
function openModal(id) {
    const data = milestoneData[id];
    if (!data) return;

    const modal = document.getElementById('timeline-modal');

    // Create modal content structure if it doesn't exist
    if (!modal.querySelector('.modal-content')) {
        modal.innerHTML = `
            <button class="modal-close">&times;</button>
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-icon"></span>
                    <h2 id="modal-title"></h2>
                </div>
                <div class="modal-badges">
                    <span id="modal-date-badge" class="badge"></span>
                    <span id="modal-category-badge" class="badge"></span>
                </div>
                <p id="modal-description" class="modal-description"></p>
                <div id="modal-details" class="modal-details"></div>
            </div>
        `;

        // Re-setup close button
        const modalClose = modal.querySelector('.modal-close');
        modalClose.addEventListener('click', closeModal);
    }

    const modalIcon = modal.querySelector('.modal-icon');
    const modalTitle = modal.querySelector('#modal-title');
    const modalDateBadge = modal.querySelector('#modal-date-badge');
    const modalCategoryBadge = modal.querySelector('#modal-category-badge');
    const modalDescription = modal.querySelector('#modal-description');
    const modalDetails = modal.querySelector('#modal-details');

    // Set modal content
    modalIcon.textContent = data.icon;
    modalTitle.textContent = data.title;
    modalDateBadge.textContent = data.date;
    modalCategoryBadge.textContent = data.category;
    modalDescription.textContent = data.description;

    // Build details HTML
    let detailsHTML = '';

    if (data.status) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Status</h4>
                <p>${data.status}</p>
            </div>
        `;
    }

    if (data.impact) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Impact</h4>
                <p>${data.impact}</p>
            </div>
        `;
    }

    if (data.metrics && data.metrics.length > 0) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Key Metrics</h4>
                <ul>
                    ${data.metrics.map(metric => `<li>${metric}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (data.team) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Team</h4>
                <p>${data.team}</p>
            </div>
        `;
    }

    if (data.challenges) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Challenges Overcome</h4>
                <p>${data.challenges}</p>
            </div>
        `;
    }

    if (data.outcome) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Outcome</h4>
                <p>${data.outcome}</p>
            </div>
        `;
    }

    modalDetails.innerHTML = detailsHTML;

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('timeline-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Setup Position Controls for Moving Assets
function setupPositionControls() {
    // Load saved positions from localStorage
    const savedPositions = JSON.parse(localStorage.getItem('lendwisePositions') || '{}');
    const defaultPositions = {
        header: 0,
        timeline: 0,
        owl: 0,
        carousel: 120
    };
    const positions = { ...defaultPositions, ...savedPositions };

    // Create control panel with sliders
    const controlPanel = document.createElement('div');
    controlPanel.id = 'position-controls';
    controlPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        z-index: 10000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        width: 280px;
    `;

    controlPanel.innerHTML = `
        <div style="margin-bottom: 20px; font-weight: bold; font-size: 16px; border-bottom: 2px solid rgba(255,215,0,0.5); padding-bottom: 10px;">
            🎯 Vertical Position Controls
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #ffd700;">
                📝 Header Text
                <span id="header-value" style="float: right;">${positions.header}px</span>
            </label>
            <input type="range" id="header-slider" min="-200" max="200" value="${positions.header}"
                style="width: 100%; cursor: pointer;">
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #00ff88;">
                ⏺️ Timeline Dots
                <span id="timeline-value" style="float: right;">${positions.timeline}px</span>
            </label>
            <input type="range" id="timeline-slider" min="-200" max="200" value="${positions.timeline}"
                style="width: 100%; cursor: pointer;">
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #ffaa00;">
                🦉 Owl
                <span id="owl-value" style="float: right;">${positions.owl}px</span>
            </label>
            <input type="range" id="owl-slider" min="-300" max="300" value="${positions.owl}"
                style="width: 100%; cursor: pointer;">
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: #00aaff;">
                🎠 Carousel
                <span id="carousel-value" style="float: right;">${positions.carousel}px</span>
            </label>
            <input type="range" id="carousel-slider" min="-100" max="400" value="${positions.carousel}"
                style="width: 100%; cursor: pointer;">
        </div>

        <button id="reset-positions" style="
            width: 100%;
            padding: 10px;
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid rgba(255, 0, 0, 0.5);
            color: white;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        ">↺ Reset All Positions</button>

        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; color: #888;">
            ✏️ Click any text to edit directly
        </div>
    `;
    document.body.appendChild(controlPanel);

    // Setup slider controls
    const headerSlider = document.getElementById('header-slider');
    const timelineSlider = document.getElementById('timeline-slider');
    const owlSlider = document.getElementById('owl-slider');
    const carouselSlider = document.getElementById('carousel-slider');

    // Get elements
    const headerElement = document.querySelector('.roadmap-header');
    const timelineElement = document.querySelector('.roadmap-timeline');
    const owlElement = document.querySelector('.gallery-center');
    const carouselElement = document.querySelector('.gallery-track');

    // Apply saved positions on load
    if (headerElement) headerElement.style.transform = `translateY(${positions.header}px)`;
    if (timelineElement) timelineElement.style.transform = `translateY(${positions.timeline}px)`;
    if (owlElement) owlElement.style.transform = `translate(-50%, calc(-50% + ${positions.owl}px))`;
    if (carouselElement) carouselElement.style.top = `${positions.carousel}px`;

    // Save positions function
    function savePositions() {
        localStorage.setItem('lendwisePositions', JSON.stringify(positions));
        console.log('Positions saved:', positions);
    }

    // Header Text Slider
    headerSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        positions.header = value;
        document.getElementById('header-value').textContent = `${value}px`;
        if (headerElement) {
            headerElement.style.transform = `translateY(${value}px)`;
        }
        savePositions();
    });

    // Timeline Dots Slider
    timelineSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        positions.timeline = value;
        document.getElementById('timeline-value').textContent = `${value}px`;
        if (timelineElement) {
            timelineElement.style.transform = `translateY(${value}px)`;
        }
        savePositions();
    });

    // Owl Slider
    owlSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        positions.owl = value;
        document.getElementById('owl-value').textContent = `${value}px`;
        if (owlElement) {
            owlElement.style.transform = `translate(-50%, calc(-50% + ${value}px))`;
        }
        savePositions();
    });

    // Carousel Slider
    carouselSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        positions.carousel = value;
        document.getElementById('carousel-value').textContent = `${value}px`;
        if (carouselElement) {
            carouselElement.style.top = `${value}px`;
        }
        savePositions();
    });

    // Reset Button
    document.getElementById('reset-positions').addEventListener('click', () => {
        // Reset positions object
        positions.header = 0;
        positions.timeline = 0;
        positions.owl = 0;
        positions.carousel = 120;

        // Reset all sliders
        headerSlider.value = 0;
        timelineSlider.value = 0;
        owlSlider.value = 0;
        carouselSlider.value = 120;

        // Update displays
        document.getElementById('header-value').textContent = '0px';
        document.getElementById('timeline-value').textContent = '0px';
        document.getElementById('owl-value').textContent = '0px';
        document.getElementById('carousel-value').textContent = '120px';

        // Reset element positions
        if (headerElement) headerElement.style.transform = 'translateY(0px)';
        if (timelineElement) timelineElement.style.transform = 'translateY(0px)';
        if (owlElement) owlElement.style.transform = 'translate(-50%, -50%)';
        if (carouselElement) carouselElement.style.top = '120px';

        // Clear localStorage
        localStorage.removeItem('lendwisePositions');
        console.log('All positions reset to defaults and cleared from storage');
    });

    // Make text editable
    setupEditableText();
}

// Setup Editable Text
function setupEditableText() {
    // Make all text elements editable on click
    const editableElements = [
        '.roadmap-title',
        '.roadmap-subtitle',
        '.milestone-label',
        '.milestone-date',
        '.milestone-quarter',
        '.card-content h3',
        '.card-date',
        '.card-description'
    ];

    editableElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            // Add editable styling on hover
            element.style.cursor = 'pointer';
            element.style.transition = 'all 0.2s';

            element.addEventListener('mouseenter', () => {
                if (!element.contentEditable || element.contentEditable === 'false') {
                    element.style.outline = '1px dashed rgba(255, 215, 0, 0.5)';
                    element.style.outlineOffset = '3px';
                }
            });

            element.addEventListener('mouseleave', () => {
                if (!element.contentEditable || element.contentEditable === 'false') {
                    element.style.outline = 'none';
                }
            });

            element.addEventListener('click', (e) => {
                e.stopPropagation();

                // If already editing, don't restart
                if (element.contentEditable === 'true') return;

                // Store original text
                const originalText = element.textContent;

                // Make editable
                element.contentEditable = true;
                element.style.outline = '2px solid rgba(255, 215, 0, 0.8)';
                element.style.outlineOffset = '3px';
                element.style.background = 'rgba(0, 0, 0, 0.3)';
                element.style.padding = '2px 5px';
                element.style.borderRadius = '3px';

                // Select all text
                const range = document.createRange();
                range.selectNodeContents(element);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);

                // Save on Enter, Cancel on Escape
                const handleKeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        element.blur();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        element.textContent = originalText;
                        element.blur();
                    }
                };

                // Handle blur (save changes)
                const handleBlur = () => {
                    element.contentEditable = false;
                    element.style.outline = 'none';
                    element.style.background = 'transparent';
                    element.style.padding = '0';

                    // Log the change
                    if (element.textContent !== originalText) {
                        console.log(`Text changed in ${selector}:`, {
                            from: originalText,
                            to: element.textContent
                        });
                    }

                    // Remove event listeners
                    element.removeEventListener('keydown', handleKeydown);
                    element.removeEventListener('blur', handleBlur);
                };

                element.addEventListener('keydown', handleKeydown);
                element.addEventListener('blur', handleBlur);
            });
        });
    });

    // Add save button to control panel
    const controlPanel = document.getElementById('position-controls');
    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 Log All Changes';
    saveButton.style.cssText = `
        margin-top: 10px;
        padding: 5px 10px;
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid rgba(255, 215, 0, 0.5);
        color: white;
        border-radius: 5px;
        cursor: pointer;
        width: 100%;
    `;

    saveButton.addEventListener('click', () => {
        const changes = {
            title: document.querySelector('.roadmap-title')?.textContent,
            subtitle: document.querySelector('.roadmap-subtitle')?.textContent,
            milestones: Array.from(document.querySelectorAll('.timeline-milestone')).map(m => ({
                label: m.querySelector('.milestone-label')?.textContent,
                date: m.querySelector('.milestone-date')?.textContent,
                quarter: m.querySelector('.milestone-quarter')?.textContent
            })),
            cards: Array.from(document.querySelectorAll('.gallery-card')).map(c => ({
                title: c.querySelector('h3')?.textContent,
                date: c.querySelector('.card-date')?.textContent,
                description: c.querySelector('.card-description')?.textContent
            }))
        };

        console.log('=== ALL TEXT CONTENT ===');
        console.log(JSON.stringify(changes, null, 2));
        console.log('========================');

        // Visual feedback
        saveButton.textContent = '✅ Logged to Console';
        setTimeout(() => {
            saveButton.textContent = '💾 Log All Changes';
        }, 2000);
    });

    controlPanel.appendChild(saveButton);
}

