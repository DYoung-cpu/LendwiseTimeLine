// ===== MARKETING GALLERY - INTERACTIVE BENTO GRID =====

class MarketingGallery {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mediaItems = [];
        this.currentVideo = null;
        this.observerInstances = new Map();

        this.init();
    }

    init() {
        this.loadMediaItems();
        this.renderGrid();
        this.setupIntersectionObservers();
        this.setupModalHandlers();
    }

    loadMediaItems() {
        // Media items data structure
        this.mediaItems = [
            {
                id: 1,
                type: 'video',
                title: 'LendWise Superhero',
                desc: 'AI-generated marketing video showcasing cutting-edge Veo 3 technology',
                url: 'timeline-assets/videos/lendwise-superhero.mp4',
                span: 'span-2x2' // Takes 2x2 grid space
            },
            {
                id: 2,
                type: 'video',
                title: 'Mission Control CRM',
                desc: 'Join our team and help build the future of mortgage technology',
                url: 'timeline-assets/videos/mission-control-recruitment.mp4',
                span: 'span-2x1' // Takes 2x1 grid space
            },
            // Additional items will be added here as user provides them
        ];
    }

    renderGrid() {
        const grid = document.getElementById('bentoGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.mediaItems.forEach(item => {
            const gridItem = this.createGridItem(item);
            grid.appendChild(gridItem);
        });
    }

    createGridItem(item) {
        const div = document.createElement('div');
        div.className = `bento-item ${item.span}`;
        div.setAttribute('data-id', item.id);

        if (item.type === 'video') {
            const video = document.createElement('video');
            video.src = item.url;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.setAttribute('data-video-id', item.id);

            const spinner = document.createElement('div');
            spinner.className = 'bento-item-spinner';

            const overlay = document.createElement('div');
            overlay.className = 'bento-item-overlay';
            overlay.innerHTML = `
                <div class="bento-item-title">${item.title}</div>
                <div class="bento-item-desc">${item.desc}</div>
            `;

            div.appendChild(video);
            div.appendChild(spinner);
            div.appendChild(overlay);

            // Click handler to open modal
            div.addEventListener('click', () => this.openVideoModal(item));

            // Hide spinner when video can play
            video.addEventListener('canplay', () => {
                spinner.style.display = 'none';
            });
        }

        return div;
    }

    setupIntersectionObservers() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const videos = this.container.querySelectorAll('video[data-video-id]');

        videos.forEach(video => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.playVideo(video);
                    } else {
                        this.pauseVideo(video);
                    }
                });
            }, options);

            observer.observe(video);
            this.observerInstances.set(video, observer);
        });
    }

    async playVideo(video) {
        if (!video) return;

        try {
            if (video.readyState >= 3) {
                await video.play();
            } else {
                await new Promise(resolve => {
                    video.addEventListener('canplay', resolve, { once: true });
                });
                await video.play();
            }
        } catch (error) {
            console.warn('Video playback failed:', error);
        }
    }

    pauseVideo(video) {
        if (video && !video.paused) {
            video.pause();
        }
    }

    openVideoModal(item) {
        const overlay = document.getElementById('videoModalOverlay');
        const modalVideo = document.getElementById('modalVideo');
        const title = document.getElementById('modalVideoTitle');
        const desc = document.getElementById('modalVideoDesc');

        if (!overlay || !modalVideo || !title || !desc) return;

        // Set video source and info
        modalVideo.src = item.url;
        title.textContent = item.title;
        desc.textContent = item.desc;

        // Show modal with animation
        overlay.style.display = 'flex';

        if (typeof gsap !== 'undefined') {
            gsap.from(overlay, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.out'
            });

            gsap.from('.video-modal-content', {
                scale: 0.95,
                y: 30,
                duration: 0.4,
                ease: 'back.out(1.2)'
            });
        } else {
            overlay.style.opacity = '1';
        }

        // Play video
        modalVideo.play();

        // Render dock thumbnails
        this.renderDock(item);

        // Make dock draggable
        this.setupDraggableDock();
    }

    renderDock(activeItem) {
        const dock = document.getElementById('videoDock');
        if (!dock) return;

        dock.innerHTML = '';

        this.mediaItems.forEach(item => {
            const thumb = document.createElement('div');
            thumb.className = 'dock-thumbnail';
            if (item.id === activeItem.id) thumb.classList.add('active');

            const video = document.createElement('video');
            video.src = item.url;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.play();

            thumb.appendChild(video);
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchModalVideo(item);
            });

            dock.appendChild(thumb);
        });
    }

    switchModalVideo(item) {
        const modalVideo = document.getElementById('modalVideo');
        const title = document.getElementById('modalVideoTitle');
        const desc = document.getElementById('modalVideoDesc');

        if (!modalVideo || !title || !desc) return;

        // Animate transition
        if (typeof gsap !== 'undefined') {
            gsap.to('.video-modal-player', {
                scale: 0.95,
                opacity: 0.7,
                duration: 0.15,
                onComplete: () => {
                    modalVideo.src = item.url;
                    title.textContent = item.title;
                    desc.textContent = item.desc;
                    modalVideo.play();

                    gsap.to('.video-modal-player', {
                        scale: 1,
                        opacity: 1,
                        duration: 0.2
                    });
                }
            });
        } else {
            modalVideo.src = item.url;
            title.textContent = item.title;
            desc.textContent = item.desc;
            modalVideo.play();
        }

        // Update active thumbnail
        document.querySelectorAll('.dock-thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }

    setupDraggableDock() {
        const dock = document.getElementById('videoDock');
        if (!dock) return;

        if (typeof Draggable !== 'undefined') {
            Draggable.create(dock, {
                type: 'x,y',
                edgeResistance: 0.65,
                bounds: window,
                inertia: true
            });
        }
    }

    setupModalHandlers() {
        const overlay = document.getElementById('videoModalOverlay');
        const closeBtn = document.querySelector('.video-modal-close');

        if (!overlay || !closeBtn) return;

        closeBtn.addEventListener('click', () => this.closeVideoModal());

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeVideoModal();
            }
        });
    }

    closeVideoModal() {
        const overlay = document.getElementById('videoModalOverlay');
        const modalVideo = document.getElementById('modalVideo');

        if (!overlay || !modalVideo) return;

        if (typeof gsap !== 'undefined') {
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    overlay.style.display = 'none';
                    modalVideo.pause();
                    modalVideo.src = '';
                }
            });
        } else {
            overlay.style.display = 'none';
            modalVideo.pause();
            modalVideo.src = '';
        }
    }
}

// Initialize gallery when marketing modal opens
function initializeMarketingGallery() {
    if (!window.marketingGalleryInstance) {
        window.marketingGalleryInstance = new MarketingGallery('social-media-content');
    }
}

// Call this when marketing modal becomes active
document.addEventListener('DOMContentLoaded', () => {
    const marketingModal = document.getElementById('marketing-modal');

    if (!marketingModal) return;

    // Watch for modal to become active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (marketingModal.classList.contains('active')) {
                    initializeMarketingGallery();
                }
            }
        });
    });

    observer.observe(marketingModal, { attributes: true });
});
