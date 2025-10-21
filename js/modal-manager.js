/**
 * ModalManager - Unified modal management system
 *
 * Consolidates all modal open/close logic into a single, memory-safe manager.
 * Eliminates duplicate code, prevents memory leaks, and provides centralized state management.
 *
 * Features:
 * - Centralized timer management (no memory leaks)
 * - Event delegation (minimal listener overhead)
 * - State tracking (knows which modal is active)
 * - Hook system (onOpen/onClose callbacks)
 * - Single responsibility (only manages modal visibility)
 *
 * @class ModalManager
 */
class ModalManager {
    constructor() {
        /**
         * Map of registered modals
         * @type {Map<string, ModalConfig>}
         */
        this.modals = new Map();

        /**
         * ID of currently active modal (null if none)
         * @type {string|null}
         */
        this.activeModal = null;

        /**
         * Timer ID for glow effect removal
         * Tracked centrally to prevent memory leaks
         * @type {number|null}
         */
        this.glowTimer = null;

        /**
         * Bound escape key handler for cleanup
         * @type {Function|null}
         */
        this.boundEscapeHandler = null;

        /**
         * Debug mode flag
         * @type {boolean}
         */
        this.debug = false;
    }

    /**
     * Register a modal configuration
     *
     * @param {string} id - Unique modal identifier
     * @param {ModalConfig} config - Modal configuration
     * @param {string} config.elementId - DOM element ID
     * @param {string} config.type - Modal type ('standard'|'fullscreen'|'location')
     * @param {string} [config.closeButtonId] - Close button element ID
     * @param {Function} [config.onOpen] - Callback before modal opens
     * @param {Function} [config.onClose] - Callback before modal closes
     */
    register(id, config) {
        const element = document.getElementById(config.elementId);

        if (!element && this.debug) {
            console.warn(`[ModalManager] Element not found: ${config.elementId}`);
        }

        this.modals.set(id, {
            element: element,
            type: config.type || 'fullscreen',
            onOpen: config.onOpen || null,
            onClose: config.onClose || null,
            closeButtonId: config.closeButtonId || null,
        });

        if (this.debug) {
            console.log(`[ModalManager] Registered modal: ${id}`, config);
        }
    }

    /**
     * Open a modal by ID
     *
     * Automatically closes any currently open modal first to prevent overlap.
     * Clears any pending timers to prevent memory leaks.
     *
     * @param {string} id - Modal ID to open
     * @param {*} data - Optional data to pass to onOpen hook
     * @returns {boolean} - True if modal was opened successfully
     */
    open(id, data = null) {
        const config = this.modals.get(id);

        if (!config) {
            if (this.debug) {
                console.warn(`[ModalManager] Modal not registered: ${id}`);
            }
            return false;
        }

        if (!config.element) {
            if (this.debug) {
                console.warn(`[ModalManager] Element not found for modal: ${id}`);
            }
            return false;
        }

        // Close any existing modal first (prevents overlap)
        if (this.activeModal && this.activeModal !== id) {
            this.close();
        }

        // Clear any pending glow timer (prevents memory leak)
        if (this.glowTimer) {
            clearTimeout(this.glowTimer);
            this.glowTimer = null;
        }

        // Execute pre-open hook
        if (config.onOpen) {
            try {
                config.onOpen(data);
            } catch (error) {
                console.error(`[ModalManager] Error in onOpen hook for ${id}:`, error);
            }
        }

        // Show modal
        config.element.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.activeModal = id;

        // Schedule glow cleanup with tracked timer
        // Glow effect is added by carousel when card is selected
        // We remove it after 1 second when modal is fully visible
        this.glowTimer = setTimeout(() => {
            this.removeGlow();
            this.glowTimer = null;
        }, 1000);

        if (this.debug) {
            console.log(`[ModalManager] Opened modal: ${id}`);
        }

        return true;
    }

    /**
     * Close the currently active modal
     *
     * Executes onClose hook, removes active class, restores body scroll,
     * and cleans up any pending timers.
     *
     * @returns {boolean} - True if a modal was closed
     */
    close() {
        if (!this.activeModal) {
            return false;
        }

        const config = this.modals.get(this.activeModal);

        if (!config || !config.element) {
            // Clean up state even if element is missing
            this.activeModal = null;
            return false;
        }

        const closedModalId = this.activeModal;

        // Execute pre-close hook
        if (config.onClose) {
            try {
                config.onClose();
            } catch (error) {
                console.error(`[ModalManager] Error in onClose hook for ${closedModalId}:`, error);
            }
        }

        // Hide modal
        config.element.classList.remove('active');
        document.body.style.overflow = 'auto';

        // Immediate glow cleanup on close
        this.removeGlow();

        // Clear tracked timer if still pending
        if (this.glowTimer) {
            clearTimeout(this.glowTimer);
            this.glowTimer = null;
        }

        this.activeModal = null;

        if (this.debug) {
            console.log(`[ModalManager] Closed modal: ${closedModalId}`);
        }

        return true;
    }

    /**
     * Remove glow effect from all elements
     *
     * The .selected-glow class is added by the carousel when a card is clicked.
     * We remove it when the modal opens or closes to clean up the visual state.
     */
    removeGlow() {
        document.querySelectorAll('.selected-glow').forEach(el => {
            el.classList.remove('selected-glow');
        });
    }

    /**
     * Setup event handlers for all registered modals
     *
     * Sets up:
     * - Global escape key handler (single listener for all modals)
     * - Click-outside-to-close for each modal
     * - Close button handlers for each modal
     *
     * Should be called once after all modals are registered.
     */
    setupHandlers() {
        // Global escape key handler (single listener)
        this.boundEscapeHandler = (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.boundEscapeHandler);

        // Setup handlers for each modal
        this.modals.forEach((config, id) => {
            const { element, closeButtonId } = config;

            if (!element) return;

            // Click outside to close (event delegation)
            element.addEventListener('click', (e) => {
                // Only close if clicking the backdrop, not modal content
                if (e.target === element) {
                    this.close();
                }
            });

            // Close button handler
            if (closeButtonId) {
                const btn = document.getElementById(closeButtonId);
                if (btn) {
                    btn.addEventListener('click', () => this.close());
                } else if (this.debug) {
                    console.warn(`[ModalManager] Close button not found: ${closeButtonId}`);
                }
            }
        });

        if (this.debug) {
            console.log(`[ModalManager] Setup handlers for ${this.modals.size} modals`);
        }
    }

    /**
     * Get the ID of the currently active modal
     *
     * @returns {string|null} - Active modal ID or null
     */
    getActiveModal() {
        return this.activeModal;
    }

    /**
     * Check if a specific modal is currently open
     *
     * @param {string} id - Modal ID to check
     * @returns {boolean} - True if this modal is active
     */
    isOpen(id) {
        return this.activeModal === id;
    }

    /**
     * Check if any modal is currently open
     *
     * @returns {boolean} - True if any modal is active
     */
    isAnyOpen() {
        return this.activeModal !== null;
    }

    /**
     * Enable debug logging
     */
    enableDebug() {
        this.debug = true;
        console.log('[ModalManager] Debug mode enabled');
    }

    /**
     * Cleanup all event listeners and timers
     *
     * Call this when tearing down the page (e.g., in a SPA navigation)
     * to prevent memory leaks.
     */
    destroy() {
        // Clear any pending timer
        if (this.glowTimer) {
            clearTimeout(this.glowTimer);
            this.glowTimer = null;
        }

        // Remove global escape handler
        if (this.boundEscapeHandler) {
            document.removeEventListener('keydown', this.boundEscapeHandler);
            this.boundEscapeHandler = null;
        }

        // Clear state
        this.modals.clear();
        this.activeModal = null;

        if (this.debug) {
            console.log('[ModalManager] Destroyed');
        }
    }
}

// Export for use in other scripts
// (Can be used as ES6 module or global variable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}
