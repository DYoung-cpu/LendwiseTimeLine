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
    }, 3500);
});

// 3D Carousel Gallery Configuration
const galleryConfig = {
    radius: 250,
    autoRotateSpeed: 0.5,
    scrollSensitivity: 0.002,
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
        card.style.transformOrigin = 'center';
        card.style.position = 'absolute';
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
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        // Stop auto-rotation when scrolling
        galleryConfig.isAutoRotating = false;
        clearTimeout(galleryConfig.scrollTimeout);

        // Calculate rotation based on scroll delta
        const scrollDelta = window.scrollY - lastScrollY;
        galleryConfig.currentRotation += scrollDelta * galleryConfig.scrollSensitivity;

        // Apply rotation to gallery
        galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;

        // Update card opacities
        updateAllCardOpacities(cards);

        lastScrollY = window.scrollY;

        // Resume auto-rotation after scrolling stops
        galleryConfig.scrollTimeout = setTimeout(() => {
            galleryConfig.isAutoRotating = true;
            startAutoRotation(galleryTrack, cards);
        }, 1500);
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
    const milestoneIds = ['founded', 'nmls', 'dre', 'encompass', 'dscr', 'multistate', 'crm', 'wisr', 'underwriting', 'nationwide'];
    return milestoneIds[index] || null;
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

