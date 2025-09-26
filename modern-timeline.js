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

