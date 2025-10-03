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

        // Calculate initial opacity based on angle
        updateCardOpacity(card, angle - galleryConfig.currentRotation);

        // Click handler is now managed by setupMouseDragRotation
        // which distinguishes between click and drag
    });

    // Removed scroll-based rotation - carousel should not be triggered by page scroll
    // setupScrollRotation(galleryTrack, cards);

    // Setup mouse drag rotation
    setupMouseDragRotation(galleryTrack, cards);

    // Start auto-rotation
    startAutoRotation(galleryTrack, cards);

    // Force initial render
    galleryTrack.style.transform = `rotateY(0deg)`;
}

// Setup scroll-based rotation control
function setupScrollRotation(galleryTrack, cards) {
    // Throttled scroll handler using requestAnimationFrame
    let scrollTicking = false;
    let lastScrollRotation = -1;

    function handleScroll() {
        // Stop auto-rotation when scrolling
        galleryConfig.isAutoRotating = false;
        clearTimeout(galleryConfig.scrollTimeout);

        // Calculate rotation based on scroll progress (like React component)
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        galleryConfig.currentRotation = scrollProgress * 360;

        // Apply rotation to gallery
        galleryTrack.style.transform = `rotateY(${galleryConfig.currentRotation}deg)`;

        // Counter-rotate the owl to keep it stationary
        const landingOwl = document.querySelector('.gallery-track .landing-owl');
        if (landingOwl) {
            landingOwl.style.transform = `rotateY(${-galleryConfig.currentRotation}deg) translate(-50%, -50%)`;
        }

        // Only update opacities if rotation changed significantly (more than 5 degrees)
        const currentRotationInt = Math.floor(galleryConfig.currentRotation / 5);
        if (currentRotationInt !== lastScrollRotation) {
            lastScrollRotation = currentRotationInt;
            updateAllCardOpacities(cards);
        }

        scrollTicking = false;
    }

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(handleScroll);
            scrollTicking = true;
        }

        // Resume auto-rotation after scrolling stops
        galleryConfig.scrollTimeout = setTimeout(() => {
            galleryConfig.isAutoRotating = true;
        }, 150);  // Match React's 150ms timeout
    });
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

    // Proximity-based gold glow effect
    // Glow activates when card is approaching the owl (within 45 degrees)
    // Strongest at 0 degrees (directly in front), fades as card moves away
    const glowThreshold = 45; // Degrees from center where glow starts

    if (absAngle <= glowThreshold) {
        // Calculate glow intensity (1.0 at center, 0.0 at threshold)
        const glowIntensity = 1 - (absAngle / glowThreshold);

        // Apply gold glow border and shadow based on proximity
        const glowStrength = glowIntensity * 0.8; // Max opacity 0.8
        const shadowSpread = 10 + (glowIntensity * 25); // 10px to 35px

        card.style.setProperty('border-color', `rgba(255, 215, 0, ${glowStrength})`, 'important');
        card.style.setProperty('box-shadow', `0 0 ${shadowSpread}px rgba(255, 215, 0, ${glowStrength * 0.6})`, 'important');
    } else {
        // No glow - reset to default
        card.style.setProperty('border-color', 'rgba(255, 255, 255, 0.2)', 'important');
        card.style.setProperty('box-shadow', 'none', 'important');
    }

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

// Get milestone-specific details for modal
function getMilestoneDetails(dataId) {
    const details = {
        'inception': `
            <h4>Company Foundation</h4>
            <p>March 2025 marks the beginning of our journey</p>
            <ul>
                <li>Founded by industry veterans</li>
                <li>Initial seed funding secured</li>
                <li>Core team assembled</li>
            </ul>
        `,
        'dre': `
            <h4>Digital Real Estate Platform</h4>
            <p>Revolutionary real estate technology</p>
            <ul>
                <li>AI-powered property matching</li>
                <li>Integrated transaction management</li>
                <li>Smart contract automation</li>
            </ul>
        `,
        'founded': `
            <h4>Technology Stack</h4>
            <p>Cutting-edge technology infrastructure</p>
            <ul>
                <li>Cloud-native architecture</li>
                <li>Machine learning integration</li>
                <li>Blockchain-ready systems</li>
            </ul>
        `,
        'integrations': `
            <h4>System Integrations</h4>
            <p>Seamless connectivity across platforms</p>
            <ul>
                <li>API-first approach</li>
                <li>Real-time data synchronization</li>
                <li>Third-party service integration</li>
            </ul>
        `,
        'nationwide': `
            <h4>Growth & Expansion</h4>
            <p>Scaling nationwide operations</p>
            <ul>
                <li>Multi-state licensing</li>
                <li>Regional partnerships</li>
                <li>24/7 support infrastructure</li>
            </ul>
        `
    };
    return details[dataId] || '<p>Details coming soon...</p>';
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
    const data = milestoneData[id];
    if (!data) return;

    // Check if this is the inception milestone
    if (id === 'inception') {
        // Open the fullscreen inception modal instead
        openInceptionModal();
        return;
    }

    // Get modal element once at the beginning
    const modal = document.getElementById('timeline-modal');

    // Add special styling for Google sponsor modal
    if (id === 'google-sponsor') {
        modal.setAttribute('data-sponsor', 'google');
    } else {
        modal.removeAttribute('data-sponsor');
    }

    // Check if this is the licensing milestone
    if (id === 'licensing' || id === 'dre') {
        // Open the fullscreen licensing modal instead
        openLicensingModal();
        return;
    }

    // Check if this is the headquarters/location milestone
    if (id === 'headquarters' || id === 'location') {
        // Open the fullscreen headquarters modal instead
        openHeadquartersModal();
        return;
    }

    // Check if this is the team/staff milestone
    if (id === 'staff' || id === 'team') {
        // Open the fullscreen team modal instead
        openTeamModal();
        return;
    }

    // Check if this is the WISR AI milestone
    if (id === 'wisr') {
        // Open the fullscreen WISR modal instead
        openWisrModal();
        return;
    }

    // Check if this is the Integrations milestone
    if (id === 'integrations') {
        // Open the fullscreen Integrations modal instead
        openIntegrationsModal();
        return;
    }

    const standardContent = document.getElementById('standard-content');
    const locationContent = document.getElementById('location-content');

    // Check if this is the location milestone
    if (id === 'location') {
        // Hide standard content, show location content
        standardContent.style.display = 'none';
        locationContent.style.display = 'block';

        // Setup location-specific content
        setupLocationModal(data);
    } else {
        // Show standard content, hide location content
        standardContent.style.display = 'block';
        locationContent.style.display = 'none';

        // Setup standard modal content
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

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Setup enhanced location modal content
function setupLocationModal(data) {
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

// Close modal
function closeModal() {
    const modal = document.getElementById('timeline-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Open Inception Modal
function openInceptionModal() {
    const modal = document.getElementById('inception-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove glow from cards after modal opens
    setTimeout(() => {
        document.querySelectorAll('.selected-glow').forEach(card => {
            card.classList.remove('selected-glow');
        });
    }, 1000);
}

// Close Inception Modal
function closeInceptionModal() {
    const modal = document.getElementById('inception-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Remove any remaining glow effects
    document.querySelectorAll('.selected-glow').forEach(card => {
        card.classList.remove('selected-glow');
    });
}

// Open Licensing Modal
function openLicensingModal() {
    const modal = document.getElementById('licensing-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove glow from cards after modal opens
    setTimeout(() => {
        document.querySelectorAll('.selected-glow').forEach(card => {
            card.classList.remove('selected-glow');
        });
    }, 1000);
}

// Close Licensing Modal
function closeLicensingModal() {
    const modal = document.getElementById('licensing-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Remove any remaining glow effects
    document.querySelectorAll('.selected-glow').forEach(card => {
        card.classList.remove('selected-glow');
    });
}

// Open WISR Modal
function openWisrModal() {
    const modal = document.getElementById('wisr-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove glow from cards after modal opens
    setTimeout(() => {
        document.querySelectorAll('.selected-glow').forEach(card => {
            card.classList.remove('selected-glow');
        });
    }, 1000);
}

// Close WISR Modal
function closeWisrModal() {
    const modal = document.getElementById('wisr-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Remove any remaining glow effects
    document.querySelectorAll('.selected-glow').forEach(card => {
        card.classList.remove('selected-glow');
    });
}

// Open Integrations Modal
function openIntegrationsModal() {
    const modal = document.getElementById('integrations-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove glow from cards after modal opens
    setTimeout(() => {
        document.querySelectorAll('.selected-glow').forEach(card => {
            card.classList.remove('selected-glow');
        });
    }, 1000);
}

// Close Integrations Modal
function closeIntegrationsModal() {
    const modal = document.getElementById('integrations-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Remove any remaining glow effects
    document.querySelectorAll('.selected-glow').forEach(card => {
        card.classList.remove('selected-glow');
    });
}

// Open Team Modal
function openTeamModal() {
    const modal = document.getElementById('team-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove glow from cards after modal opens
    setTimeout(() => {
        document.querySelectorAll('.selected-glow').forEach(card => {
            card.classList.remove('selected-glow');
        });
    }, 1000);
}

// Close Team Modal
function closeTeamModal() {
    const modal = document.getElementById('team-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Remove any remaining glow effects
    document.querySelectorAll('.selected-glow').forEach(card => {
        card.classList.remove('selected-glow');
    });
}

// Open Headquarters Modal
function openHeadquartersModal() {
    const modal = document.getElementById('headquarters-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Remove glow from cards after modal opens
    setTimeout(() => {
        document.querySelectorAll('.selected-glow').forEach(card => {
            card.classList.remove('selected-glow');
        });
    }, 1000);
}

// Close Headquarters Modal
function closeHeadquartersModal() {
    const modal = document.getElementById('headquarters-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Remove any remaining glow effects
    document.querySelectorAll('.selected-glow').forEach(card => {
        card.classList.remove('selected-glow');
    });
}

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
function setupModalHandlers() {
    const modal = document.getElementById('timeline-modal');
    const inceptionModal = document.getElementById('inception-modal');

    if (modal) {
        // Close button handler
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Setup inception modal handlers
    if (inceptionModal) {
        // Click outside to close
        inceptionModal.addEventListener('click', (e) => {
            if (e.target === inceptionModal) {
                closeInceptionModal();
            }
        });
    }

    // Also handle clicks outside licensing modal
    const licensingModal = document.getElementById('licensing-modal');
    if (licensingModal) {
        licensingModal.addEventListener('click', (e) => {
            if (e.target === licensingModal) {
                closeLicensingModal();
            }
        });
    }

    // Also handle clicks outside headquarters modal
    const headquartersModal = document.getElementById('headquarters-modal');
    if (headquartersModal) {
        headquartersModal.addEventListener('click', (e) => {
            if (e.target === headquartersModal) {
                closeHeadquartersModal();
            }
        });
    }

    // Also handle clicks outside team modal
    const teamModal = document.getElementById('team-modal');
    if (teamModal) {
        teamModal.addEventListener('click', (e) => {
            if (e.target === teamModal) {
                closeTeamModal();
            }
        });
    }

    // Also handle clicks outside WISR modal
    const wisrModal = document.getElementById('wisr-modal');
    if (wisrModal) {
        wisrModal.addEventListener('click', (e) => {
            if (e.target === wisrModal) {
                closeWisrModal();
            }
        });
        // Add close button handler for WISR modal
        const wisrCloseBtn = document.getElementById('wisr-modal-close');
        if (wisrCloseBtn) {
            wisrCloseBtn.addEventListener('click', closeWisrModal);
        }
    }

    // Add close button handlers for other fullscreen modals
    const inceptionCloseBtn = document.getElementById('inception-close');
    if (inceptionCloseBtn) {
        inceptionCloseBtn.addEventListener('click', closeInceptionModal);
    }

    const licensingCloseBtn = document.getElementById('licensing-modal-close');
    if (licensingCloseBtn) {
        licensingCloseBtn.addEventListener('click', closeLicensingModal);
    }

    const headquartersCloseBtn = document.getElementById('headquarters-modal-close');
    if (headquartersCloseBtn) {
        headquartersCloseBtn.addEventListener('click', closeHeadquartersModal);
    }

    const teamCloseBtn = document.getElementById('team-modal-close');
    if (teamCloseBtn) {
        teamCloseBtn.addEventListener('click', closeTeamModal);
    }

    // Add handlers for Integrations modal
    const integrationsModal = document.getElementById('integrations-modal');
    if (integrationsModal) {
        integrationsModal.addEventListener('click', (e) => {
            if (e.target === integrationsModal) {
                closeIntegrationsModal();
            }
        });
        // Add close button handler
        const integrationsCloseBtn = document.getElementById('integrations-modal-close');
        if (integrationsCloseBtn) {
            integrationsCloseBtn.addEventListener('click', closeIntegrationsModal);
        }
    }

    // Escape key to close any active modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('active')) {
                closeModal();
            }
            if (inceptionModal && inceptionModal.classList.contains('active')) {
                closeInceptionModal();
            }
            if (licensingModal && licensingModal.classList.contains('active')) {
                closeLicensingModal();
            }
            if (headquartersModal && headquartersModal.classList.contains('active')) {
                closeHeadquartersModal();
            }
            if (teamModal && teamModal.classList.contains('active')) {
                closeTeamModal();
            }
            if (wisrModal && wisrModal.classList.contains('active')) {
                closeWisrModal();
            }
            if (integrationsModal && integrationsModal.classList.contains('active')) {
                closeIntegrationsModal();
            }
        }
    });
}

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
        transition: all 0.3s ease;
    `;

    controlPanel.innerHTML = `
        <button id="controls-toggle" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(100, 200, 255, 0.2);
            border: 1px solid rgba(100, 200, 255, 0.5);
            border-radius: 5px;
            width: 30px;
            height: 30px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            color: rgba(100, 200, 255, 0.9);
            font-size: 20px;
        ">−</button>
        <div id="controls-content">
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
        </div>
    `;
    document.body.appendChild(controlPanel);

    // Setup toggle functionality
    const toggleBtn = document.getElementById('controls-toggle');
    const controlsContent = document.getElementById('controls-content');
    let isCollapsed = false;

    toggleBtn.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
            controlsContent.style.display = 'none';
            controlPanel.style.width = '50px';
            controlPanel.style.height = '50px';
            controlPanel.style.padding = '10px';
            toggleBtn.innerHTML = '☰';
            toggleBtn.style.fontSize = '16px';
        } else {
            controlsContent.style.display = 'block';
            controlPanel.style.width = '280px';
            controlPanel.style.height = 'auto';
            controlPanel.style.padding = '20px';
            toggleBtn.innerHTML = '−';
            toggleBtn.style.fontSize = '20px';
        }
    });

    // Setup slider controls
    const headerSlider = document.getElementById('header-slider');
    const timelineSlider = document.getElementById('timeline-slider');
    const owlSlider = document.getElementById('owl-slider');
    const carouselSlider = document.getElementById('carousel-slider');

    // Get elements
    const headerElement = document.querySelector('.roadmap-header');
    const timelineElement = document.querySelector('.roadmap-timeline');
    const owlElement = document.getElementById('landingOwl');
    // The carousel is the entire container
    const carouselElement = document.querySelector('.circular-gallery-container');

    // Debug: Check what elements were found
    console.log('=== POSITION CONTROLS ELEMENT CHECK ===');
    console.log('Owl element:', owlElement);
    console.log('Carousel container:', carouselElement);

    // Apply saved positions on load
    if (headerElement) headerElement.style.transform = `translateY(${positions.header}px)`;
    if (timelineElement) timelineElement.style.transform = `translateY(${positions.timeline}px)`;
    if (owlElement) {
        owlElement.style.transform = `translate(-50%, calc(-50% + ${positions.owl}px))`;
    }


    // Apply carousel position - MUST set initial transform since CSS doesn't have it
    if (carouselElement) {
        const transformValue = `translate(-50%, calc(-50% + ${positions.carousel}px))`;
        carouselElement.style.transform = transformValue;
        console.log('Initial carousel transform set to:', transformValue);
    } else {
        // Set default transform if carousel not positioned yet
        const defaultCarousel = document.querySelector('.circular-gallery-container');
        if (defaultCarousel) {
            defaultCarousel.style.transform = `translate(-50%, calc(-50% + 120px))`;
            console.log('Set default carousel transform');
        }
    }

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

    // Owl Slider - moves the center owl element independently
    // Owl Slider - moves the owl vertically while maintaining counter-rotation
    if (owlSlider) {
        owlSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            positions.owl = value;
            document.getElementById('owl-value').textContent = `${value}px`;

            // Get fresh reference to owl element
            const owl = document.getElementById('landingOwl');
            if (owl) {
                // Apply vertical offset to owl (now outside gallery-track)
                const transformValue = `translate(-50%, calc(-50% + ${value}px)) translateZ(0)`;
                owl.style.transform = transformValue;
                console.log('Moving owl to:', transformValue);
            } else {
                console.error('Owl element not found!');
            }
            savePositions();
        });
    }

    // Carousel Slider - moves the entire gallery container
    carouselSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        positions.carousel = value;
        document.getElementById('carousel-value').textContent = `${value}px`;

        // Always get fresh reference to carousel element
        const carousel = document.querySelector('.circular-gallery-container');
        if (carousel) {
            // Move the entire circular gallery container
            const transformValue = `translate(-50%, calc(-50% + ${value}px))`;
            carousel.style.transform = transformValue;
            console.log('Setting carousel transform to:', transformValue);
            console.log('Actual computed transform:', getComputedStyle(carousel).transform);
        } else {
            console.error('Carousel container not found!');
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

        // Reset owl position (simple 2D centering)
        const owl = document.querySelector('.landing-owl');
        if (owl) {
            owl.style.transform = 'translate(-50%, -50%)';
        }

        // Reset carousel position
        if (carouselElement) {
            carouselElement.style.transform = `translate(-50%, calc(-50% + 120px))`;
        }

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

// ========================================
// FILTER CONTAINER FUNCTIONALITY
// ========================================

// Filter system is now inline in HTML - no setup needed
function setupFilterContainer() {
    console.log('✅ New filter system loaded inline - no setup required');
    return;
}
