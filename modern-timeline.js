// Modern Timeline JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Modern Timeline: Ready for initialization');

    // IMMEDIATE CLEANUP: Remove any rogue owl elements that shouldn't be there
    // This handles cases where the owl was left from a previous session
    // But don't remove the intentional landing-owl
    const rogueOwls = document.querySelectorAll('body > .wisr-showcase-center');
    rogueOwls.forEach(owl => {
        // Only remove if it's not part of the landing-owl
        if (!owl.closest('.landing-owl') && !owl.closest('#shader-container')) {
            console.log('Found and removing rogue owl from body');
            owl.remove();
        }
    });

    // Timeline will be initialized after intro completes
    // The intro-animation.js will call these functions
});

// 3D Carousel Gallery Configuration - LOCKED POSITIONS
// DO NOT MODIFY WITHOUT UPDATING CSS POSITIONS
const galleryConfig = {
    radius: 380,  // LOCKED - Critical for card spacing with 12 items
    autoRotateSpeed: 0.125,  // Rotation speed reduced by 50% - half the original speed
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

    // Initialize carousel container transform since CSS no longer has it
    const carouselContainer = document.querySelector('.circular-gallery-container');
    if (carouselContainer && !carouselContainer.style.transform) {
        carouselContainer.style.transform = 'translate(-50%, -50%)';
        console.log('Initialized carousel container transform');
    }

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

        // Click handler is now managed by setupMouseDragRotation
        // which distinguishes between click and drag
    });

    // Removed scroll-based rotation - carousel should not be triggered by page scroll
    // setupScrollRotation(galleryTrack, cards);

    // Setup mouse drag rotation
    setupMouseDragRotation(galleryTrack, cards);

    // Force initial render
    galleryTrack.style.transform = `rotateY(0deg)`;

    // Use requestAnimationFrame to ensure DOM is fully laid out before calculating glow
    requestAnimationFrame(() => {
        // Calculate initial opacity and glow for all cards after layout is complete
        updateAllCardOpacities(cards);
    });

    // Start auto-rotation
    startAutoRotation(galleryTrack, cards);
}


// Setup mouse drag rotation control
function setupMouseDragRotation(galleryTrack, cards) {
    const carouselContainer = document.querySelector('.circular-gallery-container');
    if (!carouselContainer) return;

    let isDragging = false;
    let startX = 0;
    let startRotation = 0;
    let dragDistance = 0;
    let clickedCard = null;
    const dragSensitivity = 0.5; // Degrees per pixel
    const clickThreshold = 5; // Pixels - if drag is less than this, treat as click

    function handleMouseDown(e) {
        isDragging = true;
        startX = e.clientX;
        startRotation = galleryConfig.currentRotation;
        dragDistance = 0;

        // Track which card was clicked (if any)
        clickedCard = e.target.closest('.gallery-card');

        // Pause auto-rotation while dragging
        galleryConfig.isAutoRotating = false;

        // Change cursor
        carouselContainer.style.cursor = 'grabbing';

        e.preventDefault();
    }

    function handleMouseMove(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        dragDistance = Math.abs(deltaX);

        // Update rotation based on drag distance
        galleryConfig.currentRotation = startRotation + (deltaX * dragSensitivity);

        // Apply rotation to gallery
        galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;

        // Update card opacities
        updateAllCardOpacities(cards);
    }

    function handleMouseUp(e) {
        if (!isDragging) return;

        isDragging = false;

        // Reset cursor
        carouselContainer.style.cursor = 'grab';

        // If drag distance is very small and we clicked on a card, treat as a click
        if (dragDistance < clickThreshold && clickedCard) {
            // Find the card index
            const cardIndex = Array.from(cards).indexOf(clickedCard);
            if (cardIndex !== -1) {
                const milestoneId = getMilestoneIdByIndex(cardIndex);
                if (milestoneId) {
                    openModal(milestoneId);
                }
            }
        }

        clickedCard = null;

        // Resume auto-rotation after a short delay
        setTimeout(() => {
            galleryConfig.isAutoRotating = true;
        }, 500);
    }

    // Touch support for mobile
    function handleTouchStart(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startRotation = galleryConfig.currentRotation;
        dragDistance = 0;

        // Track which card was touched (if any)
        clickedCard = e.target.closest('.gallery-card');

        galleryConfig.isAutoRotating = false;
        e.preventDefault();
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        const deltaX = e.touches[0].clientX - startX;
        dragDistance = Math.abs(deltaX);

        galleryConfig.currentRotation = startRotation + (deltaX * dragSensitivity);
        galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;
        updateAllCardOpacities(cards);

        e.preventDefault();
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;

        isDragging = false;

        // If drag distance is very small and we touched a card, treat as a tap
        if (dragDistance < clickThreshold && clickedCard) {
            const cardIndex = Array.from(cards).indexOf(clickedCard);
            if (cardIndex !== -1) {
                const milestoneId = getMilestoneIdByIndex(cardIndex);
                if (milestoneId) {
                    openModal(milestoneId);
                }
            }
        }

        clickedCard = null;

        setTimeout(() => {
            galleryConfig.isAutoRotating = true;
        }, 500);
    }

    // Add event listeners
    carouselContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    carouselContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Set initial cursor
    carouselContainer.style.cursor = 'grab';

    console.log('Mouse drag rotation enabled - cards are draggable');
}

// Auto-rotation animation
function startAutoRotation(galleryTrack, cards) {
    if (galleryConfig.animationFrame) {
        cancelAnimationFrame(galleryConfig.animationFrame);
    }

    let frameCount = 0;
    function rotate() {
        if (galleryConfig.isAutoRotating) {
            galleryConfig.currentRotation += galleryConfig.autoRotateSpeed;
            galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;

            // Owl is now outside gallery-track, no need to update during rotation

            // Update opacities every 3 frames for smoother transitions
            frameCount++;
            if (frameCount % 3 === 0) {
                updateAllCardOpacities(cards);
            }
        }

        galleryConfig.animationFrame = requestAnimationFrame(rotate);
    }

    // Start rotation loop (will begin on next animation frame, not synchronously)
    galleryConfig.animationFrame = requestAnimationFrame(rotate);
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

function updateCardOpacity(card, angle) {
    // Normalize angle to -180 to 180
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;

    // Calculate opacity (1 when facing viewer, 0.5 when at back)
    const absAngle = Math.abs(angle);
    let opacity = 1;

    // Keep cards fully opaque until they're well past the viewer (120°)
    if (absAngle > 120) {
        opacity = Math.max(0.5, 1 - ((absAngle - 120) / 60) * 0.5);
    }

    card.style.opacity = opacity;

    // Dynamic z-index based on position relative to owl
    // Cards in front (angle -90 to 90) get higher z-index
    // Cards in back (angle 90 to 180 or -90 to -180) get lower z-index
    if (absAngle <= 90) {
        // Front-facing cards - above owl
        card.style.zIndex = 1000 + (90 - absAngle);
    } else {
        // Back-facing cards - below owl
        card.style.zIndex = 100 + (180 - absAngle);
    }

    // Glow effect removed - keep default card styling
    card.style.setProperty('border-color', 'rgba(255, 255, 255, 0.2)', 'important');
    card.style.setProperty('box-shadow', 'none', 'important');

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
    const milestoneIds = ['inception', 'location', 'licensing', 'pos', 'team', 'marketing', 'mission-control', 'wisr', 'integrations', 'google-sponsor', 'underwriting', 'onboarding'];
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

            // Get milestone ID for better mapping
            const milestoneId = milestone.dataset.milestone;

            // Map timeline milestones to carousel cards (now with inception as first card)
            const cardMapping = {
                'inception': { cardIndex: 0, dataId: 'inception' },    // Inception/About Us card
                'headquarters': { cardIndex: 1, dataId: 'location' },  // Headquarters card
                'location': { cardIndex: 1, dataId: 'location' },      // Headquarters card (alias)
                'licensing': { cardIndex: 2, dataId: 'licensing' },    // Licensing card (index 2)
                'dre': { cardIndex: 2, dataId: 'licensing' },          // Maps to Licensing card
                'wisr': { cardIndex: 7, dataId: 'wisr' },               // WISR AI card (index 7)
                'integrations': { cardIndex: 8, dataId: 'integrations' }, // Integrations card (index 8)
                'staff': { cardIndex: 4, dataId: 'team' },              // The Team card
                'los': { cardIndex: 3, dataId: 'encompass' },          // Encompass card (index 3)
                'website': { cardIndex: 6, dataId: 'website' },        // Mission CRM card (index 6)
                'optimal': { cardIndex: 3, dataId: 'optimalblue' },    // Encompass card
                'analytics': { cardIndex: 10, dataId: 'analytics' },     // Analytics card (index 10)
                'google-sponsor': { cardIndex: 9, dataId: 'google-sponsor' }, // Google Sponsorship card (index 9)
                'nationwide': { cardIndex: 11, dataId: 'nationwide' }  // Nationwide Expansion card (index 11)
            };

            const mapping = cardMapping[milestoneId] || cardMapping[milestoneIndex];
            if (mapping) {
                const targetCardIndex = mapping.cardIndex;
                const dataId = mapping.dataId;
                // Calculate rotation to bring target card to front
                const anglePerCard = 360 / cards.length;
                const targetRotation = -targetCardIndex * anglePerCard;

                // Stop auto-rotation
                galleryConfig.isAutoRotating = false;

                // Animate rotation to target card
                galleryConfig.currentRotation = targetRotation;
                galleryTrack.style.transition = 'transform 0.8s ease-in-out';
                galleryTrack.style.transform = `rotateY(${targetRotation}deg)`;

                // Owl is now outside gallery-track, no need to update

                // Update card opacities
                updateAllCardOpacities(cards);

                // After rotation completes, handle the interaction
                setTimeout(() => {
                    // Get milestone data
                    const milestoneId = milestone.dataset.milestone;
                    const targetCard = document.querySelector(`.gallery-card[data-id="${dataId}"]`);

                    // Add glow effect to the card with proper transform preservation
                    if (targetCard) {
                        // Get the current rotation angle
                        const currentTransform = targetCard.style.transform || targetCard.dataset.baseTransform;
                        const rotationMatch = currentTransform.match(/rotateY\(([-\d.]+)deg\)/);
                        const currentRotation = rotationMatch ? rotationMatch[1] : '0';

                        // Store the original transform
                        targetCard.dataset.originalTransform = currentTransform;
                        targetCard.dataset.currentRotation = currentRotation;

                        // Apply the glow with the current rotation maintained
                        targetCard.style.setProperty('--card-rotation', `${currentRotation}deg`);
                        targetCard.classList.add('selected-glow');
                    }

                    // Open modal after glow animation completes
                    setTimeout(() => {
                        if (milestoneId && milestoneData[milestoneId]) {
                            openModal(milestoneId);
                        }
                    }, 600);
                }, 1200);

                // Resume auto-rotation after animation
                setTimeout(() => {
                    galleryTrack.style.transition = '';
                    galleryConfig.isAutoRotating = true;
                }, 2000);

                // Visual feedback removed - no animation needed
            }
        });
    });
}

// Open modal with milestone details
function openModal(id) {
    // Route special fullscreen modals to ModalManager
    // These modals don't need data from milestoneData
    if (id === 'inception' || id === 'marketing' || id === 'onboarding' || id === 'integrations') {
        modalManager.open(id);
        return;
    }

    // Get milestone data for data-driven modals
    const data = milestoneData[id];
    if (!data) return;

    // Map milestone IDs to their fullscreen modal IDs
    // Some milestone IDs open different modals
    const modalRoutes = {
        'licensing': 'licensing',
        'dre': 'licensing',
        'headquarters': 'headquarters',
        'location': 'headquarters',
        'staff': 'team',
        'team': 'team',
        'wisr': 'wisr'
    };

    // Check if this milestone uses a fullscreen modal
    const fullscreenModalId = modalRoutes[id];
    if (fullscreenModalId) {
        modalManager.open(fullscreenModalId, data);
        return;
    }

    // For standard timeline-modal, populate content first, then open
    const modal = document.getElementById('timeline-modal');

    // Add special styling for Google sponsor modal
    if (id === 'google-sponsor') {
        modal.setAttribute('data-sponsor', 'google');
    } else {
        modal.removeAttribute('data-sponsor');
    }

    const standardContent = document.getElementById('standard-content');
    const locationContent = document.getElementById('location-content');

    // Check if this uses location-specific content
    // NOTE: This seems redundant with 'headquarters' routing above
    // Keeping for safety - may need cleanup later
    if (id === 'location') {
        // Hide standard content, show location content
        standardContent.style.display = 'none';
        locationContent.style.display = 'block';

        // Setup location-specific content
        setupLocationModalContent(data);
    } else {
        // Show standard content, hide location content
        standardContent.style.display = 'block';
        locationContent.style.display = 'none';

        // Populate standard modal content
        populateStandardModalContent(modal, data);
    }

    // Let ModalManager handle showing the modal
    modalManager.open('timeline-modal', data);
}

// Separated content population function (no modal show/hide logic)
function populateStandardModalContent(modal, data) {
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
}

// Setup enhanced location modal content (content-only, no show/hide logic)
function setupLocationModalContent(data) {
    const modal = document.getElementById('timeline-modal');

    // Set header info
    modal.querySelector('.modal-icon').textContent = data.icon;
    modal.querySelector('#modal-title').textContent = data.title;
    modal.querySelector('#modal-date-badge').textContent = data.date;
    modal.querySelector('#modal-category-badge').textContent = data.category;

    // Setup image gallery
    if (data.images && data.images.length > 0) {
        const mainImage = document.getElementById('main-image');
        const thumbsContainer = document.querySelector('.gallery-thumbs');
        const caption = document.querySelector('.image-caption');

        // Set first image as main
        mainImage.src = data.images[0];
        caption.textContent = 'Modern Office Exterior';

        // Create thumbnails
        thumbsContainer.innerHTML = '';
        const captions = [
            'Modern Office Exterior',
            'Open Workspace Area',
            'Executive Conference Room',
            'Employee Lounge & Kitchen'
        ];

        data.images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.alt = captions[index] || `Office view ${index + 1}`;
            thumb.classList.toggle('active', index === 0);

            thumb.addEventListener('click', () => {
                mainImage.src = img;
                caption.textContent = captions[index] || `Office view ${index + 1}`;

                // Update active state
                thumbsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });

            thumbsContainer.appendChild(thumb);
        });
    }

    // Set address and location details
    const addressElement = document.querySelector('.info-card .address');
    if (addressElement && data.address) {
        addressElement.textContent = data.address;
    }

    // Set location details
    const locationDetailsList = document.querySelector('.location-details');
    if (locationDetailsList && data.details) {
        locationDetailsList.innerHTML = Object.entries(data.details)
            .map(([key, value]) => `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</li>`)
            .join('');
    }

    // Set space list
    const spaceList = document.querySelector('.space-list');
    if (spaceList && data.spaces) {
        spaceList.innerHTML = data.spaces.map(space => `<li>${space}</li>`).join('');
    }

    // Set why we chose this location
    const benefitsList = document.querySelector('.benefits-list');
    if (benefitsList && data.whyThisLocation) {
        benefitsList.innerHTML = data.whyThisLocation.map(benefit => `<li>${benefit}</li>`).join('');
    }

    // Set amenities
    const amenitiesList = document.querySelector('.amenities-list');
    if (amenitiesList && data.amenities) {
        amenitiesList.innerHTML = data.amenities.map(amenity => `<li>${amenity}</li>`).join('');
    }

    // Set metrics
    const metricsList = document.querySelector('.metrics-list');
    if (metricsList && data.metrics) {
        metricsList.innerHTML = data.metrics.map(metric => `<li>${metric}</li>`).join('');
    }
}

// ========================================
// MODAL FUNCTIONS - Now managed by ModalManager
// ========================================
// All open/close functions have been consolidated into the ModalManager class
// See: js/modal-manager.js and timeline-dev.html (modal registrations)

// Change HQ Gallery Image
function changeHQImage(imageSrc, imageTitle, thumbElement) {
    // Update main image
    const mainImg = document.getElementById('hq-main-img');
    const titleElement = document.getElementById('hq-image-title');

    if (mainImg && titleElement) {
        // Fade out effect
        mainImg.style.opacity = '0';

        setTimeout(() => {
            mainImg.src = imageSrc;
            titleElement.textContent = `LendWise Headquarters - ${imageTitle}`;

            // Fade in effect
            mainImg.style.opacity = '1';
        }, 300);
    }

    // Update active thumbnail
    document.querySelectorAll('.hq-gallery-thumbs .thumb-item').forEach(thumb => {
        thumb.classList.remove('active');
    });
    if (thumbElement) {
        thumbElement.classList.add('active');
    }
}

// Setup modal event handlers

// Setup Timeline Horizontal Navigation with Drag Support
function setupTimelineNavigation() {
    const timelineContainer = document.querySelector('.timeline-line-container');
    const leftArrow = document.getElementById('timeline-left');
    const rightArrow = document.getElementById('timeline-right');
    const milestones = document.querySelectorAll('.timeline-milestone');
    const viewport = document.querySelector('.timeline-viewport');

    if (!timelineContainer || !leftArrow || !rightArrow || milestones.length === 0) {
        console.warn('Timeline navigation elements not found');
        return;
    }

    let currentPosition = 0;
    const scrollAmount = 20; // Percentage to scroll each time

    // Calculate actual content width to determine max scroll
    const calculateMaxScroll = () => {
        const lastMilestone = milestones[milestones.length - 1];
        const containerWidth = viewport ? viewport.offsetWidth : timelineContainer.parentElement.offsetWidth;
        const contentWidth = timelineContainer.scrollWidth;
        const maxScrollPixels = Math.max(0, contentWidth - containerWidth);
        return (maxScrollPixels / containerWidth) * 100;
    };

    let maxScroll = calculateMaxScroll();

    // Drag functionality variables
    let isDragging = false;
    let startX = 0;
    let startPosition = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let animationId = null;

    // Function to update timeline position with bounds checking
    function updateTimelinePosition(smooth = true) {
        // Clamp position between 0 and -maxScroll
        currentPosition = Math.max(-maxScroll, Math.min(0, currentPosition));

        if (smooth && !isDragging) {
            timelineContainer.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            timelineContainer.style.transition = 'none';
        }

        timelineContainer.style.transform = `translateX(${currentPosition}%)`;

        // Update button states
        leftArrow.disabled = currentPosition >= 0;
        rightArrow.disabled = currentPosition <= -maxScroll;

        // Update visual indicators
        updateScrollIndicators();
    }

    // Update scroll position indicators
    function updateScrollIndicators() {
        // Show/hide edge masks based on scroll position
        const leftMask = document.querySelector('.timeline-edge-mask-left');
        const rightMask = document.querySelector('.timeline-edge-mask-right');

        // Only show masks when timeline is scrollable
        if (maxScroll > 0) {
            if (leftMask) {
                leftMask.style.display = currentPosition < 0 ? 'block' : 'none';
            }
            if (rightMask) {
                rightMask.style.display = currentPosition > -maxScroll ? 'block' : 'none';
            }
        } else {
            // Hide masks when timeline fits in viewport
            if (leftMask) leftMask.style.display = 'none';
            if (rightMask) rightMask.style.display = 'none';
        }
    }

    // Mouse drag handlers
    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left mouse button

        isDragging = true;
        startX = e.clientX;
        startPosition = currentPosition;
        lastX = e.clientX;
        lastTime = Date.now();
        velocity = 0;

        timelineContainer.classList.add('dragging');
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const currentX = e.clientX;
        const deltaX = currentX - startX;
        const containerWidth = viewport ? viewport.offsetWidth : timelineContainer.parentElement.offsetWidth;
        const percentMove = (deltaX / containerWidth) * 100;

        // Calculate velocity for momentum
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        if (deltaTime > 0) {
            velocity = (currentX - lastX) / deltaTime;
        }

        lastX = currentX;
        lastTime = currentTime;

        currentPosition = startPosition + percentMove;
        updateTimelinePosition(false);

        e.preventDefault();
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;

        isDragging = false;
        timelineContainer.classList.remove('dragging');

        // Apply momentum if velocity is significant
        if (Math.abs(velocity) > 0.2) {
            applyMomentum();
        } else {
            updateTimelinePosition(true);
        }
    };

    // Touch handlers for mobile
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        isDragging = true;
        startX = touch.clientX;
        startPosition = currentPosition;
        lastX = touch.clientX;
        lastTime = Date.now();
        velocity = 0;

        timelineContainer.classList.add('dragging');
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        const currentX = touch.clientX;
        const deltaX = currentX - startX;
        const containerWidth = viewport ? viewport.offsetWidth : timelineContainer.parentElement.offsetWidth;
        const percentMove = (deltaX / containerWidth) * 100;

        // Calculate velocity
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        if (deltaTime > 0) {
            velocity = (currentX - lastX) / deltaTime;
        }

        lastX = currentX;
        lastTime = currentTime;

        currentPosition = startPosition + percentMove;
        updateTimelinePosition(false);

        e.preventDefault();
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;

        isDragging = false;
        timelineContainer.classList.remove('dragging');

        // Apply momentum
        if (Math.abs(velocity) > 0.2) {
            applyMomentum();
        } else {
            updateTimelinePosition(true);
        }
    };

    // Apply momentum scrolling
    function applyMomentum() {
        const friction = 0.95;
        const minVelocity = 0.01;

        const animate = () => {
            velocity *= friction;

            if (Math.abs(velocity) > minVelocity) {
                const containerWidth = viewport ? viewport.offsetWidth : timelineContainer.parentElement.offsetWidth;
                currentPosition += (velocity * 50) / containerWidth * 100;
                updateTimelinePosition(false);
                animationId = requestAnimationFrame(animate);
            } else {
                updateTimelinePosition(true);
            }
        };

        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        animationId = requestAnimationFrame(animate);
    }

    // Add drag event listeners
    timelineContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);

    // Add touch event listeners for mobile
    timelineContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    timelineContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    timelineContainer.addEventListener('touchend', handleTouchEnd);
    timelineContainer.addEventListener('touchcancel', handleTouchEnd);

    // Arrow click handlers
    leftArrow.addEventListener('click', () => {
        if (currentPosition < 0) {
            currentPosition = Math.min(currentPosition + scrollAmount, 0);
            updateTimelinePosition();
        }
    });

    rightArrow.addEventListener('click', () => {
        if (currentPosition > -maxScroll) {
            currentPosition = Math.max(currentPosition - scrollAmount, -maxScroll);
            updateTimelinePosition();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft') {
            leftArrow.click();
        } else if (e.key === 'ArrowRight') {
            rightArrow.click();
        }
    });

    // Recalculate max scroll on window resize
    window.addEventListener('resize', () => {
        maxScroll = calculateMaxScroll();
        updateTimelinePosition();
    });

    // Initialize
    updateTimelinePosition();
    console.log('✅ Timeline navigation with drag support initialized');
}

// Apply saved element positions on page load
function applyElementPositions() {
    // Load saved positions from localStorage or use defaults
    const savedPositions = JSON.parse(localStorage.getItem('lendwisePositions') || '{}');
    const defaultPositions = {
        header: 0,
        timeline: -61,
        owl: 65,
        carousel: 162
    };
    const positions = { ...defaultPositions, ...savedPositions };

    // Get elements
    const headerElement = document.querySelector('.roadmap-header');
    const timelineElement = document.querySelector('.roadmap-timeline');
    const owlElement = document.getElementById('landingOwl');
    const carouselElement = document.querySelector('.circular-gallery-container');

    // Apply saved positions
    if (headerElement) {
        headerElement.style.transform = `translateY(${positions.header}px)`;
    }
    if (timelineElement) {
        timelineElement.style.transform = `translateY(${positions.timeline}px)`;
    }
    if (owlElement) {
        owlElement.style.transform = `translate(-50%, calc(-50% + ${positions.owl}px))`;
    }
    if (carouselElement) {
        carouselElement.style.transform = `translate(-50%, calc(-50% + ${positions.carousel}px))`;
    }

    console.log('✅ Element positions applied:', positions);
}

// ========================================
// FILTER CONTAINER FUNCTIONALITY
// ========================================

// Filter system is now inline in HTML - no setup needed
