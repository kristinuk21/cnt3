/**
 * EventService - Handles all event management
 * Follows Single Responsibility Principle - only responsible for event handling
 */
class EventService {
    constructor() {
        this.listeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize all event listeners
     * @param {Object} controllers - Object containing controller instances
     */
    initialize(controllers) {
        if (this.isInitialized) return;

        this._setupProgressBarEvents(controllers.progress);
        this._setupTabEvents(controllers.tab);
        this._setupButtonEvents(controllers.button);
        this._setupModalEvents(controllers.modal);
        
        this.isInitialized = true;
    }

    /**
     * Setup progress bar click events
     * @param {Object} progressController - Progress controller instance
     */
    _setupProgressBarEvents(progressController) {
        const hoursProgress = document.getElementById('hoursProgress');
        const daysProgress = document.getElementById('daysProgress');

        if (hoursProgress) {
            this._addEventListener(hoursProgress, 'click', () => {
                progressController.handleHoursProgressClick();
            });
        }

        if (daysProgress) {
            this._addEventListener(daysProgress, 'click', () => {
                progressController.handleDaysProgressClick();
            });
        }
    }

    /**
     * Setup tab switching events
     * @param {Object} tabController - Tab controller instance
     */
    _setupTabEvents(tabController) {
        const tabLinks = document.querySelectorAll('#myTab .nav-link');
        
        tabLinks.forEach(link => {
            this._addEventListener(link, 'click', (e) => {
                e.preventDefault();
                tabController.handleTabClick(link);
            });
        });

        // Specific tab events
        const detailsTab = document.getElementById('details-tab');
        const logsTab = document.getElementById('logs-tab');

        if (detailsTab) {
            this._addEventListener(detailsTab, 'shown.bs.tab', () => {
                tabController.handleDetailsTabShown();
            });
        }

        if (logsTab) {
            this._addEventListener(logsTab, 'shown.bs.tab', () => {
                tabController.handleLogsTabShown();
            });
        }
    }

    /**
     * Setup button events
     * @param {Object} buttonController - Button controller instance
     */
    _setupButtonEvents(buttonController) {
        // Delegated event handling for modal buttons
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.id === 'startEarlyBtn') {
                buttonController.handleStartEarly();
            } else if (target.id === 'startBreakBtn') {
                buttonController.handleStartBreak();
            } else if (target.id === 'endBreakBtn') {
                buttonController.handleEndBreak();
            } else if (target.id === 'resetLogsBtn') {
                buttonController.handleResetLogs();
            } else if (target.id === 'resetDayBtn') {
                buttonController.handleResetDay();
            }
        });
    }

    /**
     * Setup modal events
     * @param {Object} modalController - Modal controller instance
     */
    _setupModalEvents(modalController) {
        const breakModal = document.getElementById('breakModal');
        
        if (breakModal) {
            this._addEventListener(breakModal, 'show.bs.modal', () => {
                modalController.handleModalShow();
            });
        }
    }

    /**
     * Add event listener and track it for cleanup
     * @param {HTMLElement} element - Element to add listener to
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     */
    _addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        
        // Track listeners for potential cleanup
        const key = `${element.id || element.tagName}_${event}`;
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push({ element, event, handler });
    }

    /**
     * Remove all event listeners (cleanup method)
     */
    cleanup() {
        this.listeners.forEach((handlers) => {
            handlers.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.listeners.clear();
        this.isInitialized = false;
    }
}
