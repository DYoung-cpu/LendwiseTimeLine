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

        // Add click handler for modal
        card.addEventListener('click', () => {
            const milestoneId = getMilestoneIdByIndex(index);
            if (milestoneId) openModal(milestoneId);
        });
    });

    // Removed scroll-based rotation - carousel should not be triggered by page scroll
    // setupScrollRotation(galleryTrack, cards);

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

// Position controls removed - clear any existing controls
document.addEventListener('DOMContentLoaded', function() {
    const existingControls = document.getElementById('position-controls');
    if (existingControls) {
        existingControls.remove();
    }
    localStorage.removeItem('lendwisePositions');
});

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

}

// ========================================
// FILTER CONTAINER FUNCTIONALITY
// ========================================

// Setup filter container functionality
function setupFilterContainer() {
    console.log('🔍 Setting up filter container...');

    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) {
        console.error('❌ Filter container not found in DOM');
        return;
    }

    const mainFilterBtn = filterContainer.querySelector('.filter-main');
    const filterButtons = filterContainer.querySelectorAll('.filter-btn:not(.filter-main)');

    if (!mainFilterBtn) {
        console.error('❌ Main filter button not found');
        return;
    }

    console.log('✅ Filter container found, showing it now...');

    // Get the filter dropdown container
    const filterDropdown = filterContainer.querySelector('.filter-dropdown');
    if (filterDropdown) {
        // Initially hide the dropdown using a class instead of inline styles
        filterDropdown.classList.add('collapsed');
    }

    // Check if there's a saved position
    const savedPosition = localStorage.getItem('filterPosition');
    let initialTop = 100;
    let initialLeft = '50%';
    let transform = 'translateX(-50%)';

    if (savedPosition) {
        try {
            const pos = JSON.parse(savedPosition);
            initialTop = pos.top || 100;
            initialLeft = pos.left + 'px';
            transform = 'none'; // No transform when using absolute positioning
            console.log('Loading saved filter position:', pos);
        } catch (e) {
            console.log('Using default filter position');
        }
    }

    // Apply styles with saved or default position
    filterContainer.style.cssText = `
        position: absolute !important;
        top: ${initialTop}px !important;
        left: ${initialLeft} !important;
        transform: ${transform} !important;
        z-index: 99999 !important;
        display: flex !important;
        flex-direction: column !important;
        opacity: 1 !important;
        visibility: visible !important;
        align-items: stretch !important;
        gap: 0 !important;
        padding: 0 !important;
        width: auto !important;
        height: auto !important;
    `;

    filterContainer.classList.add('visible');

    // Log element details for debugging
    const rect = filterContainer.getBoundingClientRect();
    console.log('Filter container position:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        display: window.getComputedStyle(filterContainer).display,
        visibility: window.getComputedStyle(filterContainer).visibility,
        parent: filterContainer.parentElement ? filterContainer.parentElement.tagName : 'none',
        inDOM: document.body.contains(filterContainer)
    });

    // Also check if filter buttons are visible
    const mainBtn = filterContainer.querySelector('.filter-main');
    if (mainBtn) {
        const btnRect = mainBtn.getBoundingClientRect();
        console.log('Main filter button size:', {
            width: btnRect.width,
            height: btnRect.height,
            text: mainBtn.textContent
        });
    }

    // Toggle expand/collapse
    mainFilterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = filterContainer.classList.contains('expanded');

        if (!isExpanded) {
            // Expanding
            filterContainer.classList.add('expanded');
            if (filterDropdown) {
                filterDropdown.classList.remove('collapsed');
                filterDropdown.classList.add('expanded');
            }
            console.log('Filter expanded');
        } else {
            // Collapsing
            filterContainer.classList.remove('expanded');
            if (filterDropdown) {
                filterDropdown.classList.remove('expanded');
                filterDropdown.classList.add('collapsed');
            }
            console.log('Filter collapsed');
        }
    });

    // Setup filter button clicks
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply filter
            const filter = btn.dataset.filter;
            applyFilter(filter);
        });
    });

    // Setup draggable functionality
    setupDraggable(filterContainer);

    console.log('✅ Filter container setup complete');
}

// Apply filter to timeline and gallery
function applyFilter(filter) {
    console.log('Applying filter:', filter);

    const milestones = document.querySelectorAll('.timeline-milestone');
    const galleryCards = document.querySelectorAll('.gallery-card');

    milestones.forEach(milestone => {
        const shouldShow = filter === 'all' ||
                          milestone.classList.contains(filter) ||
                          milestone.dataset.category === filter ||
                          milestone.dataset.status === filter;

        milestone.style.display = shouldShow ? 'block' : 'none';
    });

    galleryCards.forEach(card => {
        const shouldShow = filter === 'all' ||
                          card.classList.contains(filter) ||
                          card.dataset.category === filter ||
                          card.dataset.status === filter;

        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// Setup draggable functionality
function setupDraggable(element) {
    let isDragging = false;
    let startX, startY;
    let currentX, currentY;
    let initialX, initialY;

    const dragStart = (e) => {
        // Allow dragging from the main Filter button or container
        if (e.target.classList.contains('filter-btn') && !e.target.classList.contains('filter-main')) {
            // Don't drag for other filter buttons (technology, etc.)
            return;
        }

        isDragging = true;
        element.classList.add('dragging');

        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        const rect = element.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;

        e.preventDefault();
    };

    const drag = (e) => {
        if (!isDragging) return;

        e.preventDefault();

        currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        // Calculate new position accounting for scroll
        const newX = initialX + deltaX;
        const newY = initialY + deltaY + window.scrollY;

        // Apply position (absolute positioning relative to page)
        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
        element.style.transform = 'none'; // Remove centering transform
    };

    const dragEnd = () => {
        if (!isDragging) return;

        isDragging = false;
        element.classList.remove('dragging');

        // Save position
        saveFilterPosition();
    };

    // Mouse events
    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Touch events
    element.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);
}

// Save filter position to localStorage
function saveFilterPosition() {
    const filterContainer = document.getElementById('filter-container');
    const rect = filterContainer.getBoundingClientRect();

    const position = {
        left: rect.left,
        top: rect.top
    };

    localStorage.setItem('filterPosition', JSON.stringify(position));
}

// Load saved filter position
function loadFilterPosition() {
    const saved = localStorage.getItem('filterPosition');
    if (!saved) return;

    try {
        const position = JSON.parse(saved);
        const filterContainer = document.getElementById('filter-container');

        filterContainer.style.left = position.left + 'px';
        filterContainer.style.top = position.top + 'px';
        filterContainer.style.transform = 'none'; // Remove centering transform
    } catch (e) {
        console.error('Error loading filter position:', e);
    }
}

// Filter container is now initialized from intro-animation.js after the 3-second intro
