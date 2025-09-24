/**
 * EventService - Handles all event management
 * Follows Single Responsibility Principle - only responsible for event handling
 */
class EventService {
    constructor() {
        this.listeners = new Map();
        this.customListeners = new Map(); // For custom events like logsUpdated, tasksUpdated
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
        // CharTs tab (trend data focus)
        const chartsTab = document.getElementById('charts-tab');
        
        // CHarts tab (history data focus)
        const chartsHistoryTab = document.getElementById('charts-history-tab');

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

        if (chartsTab) {
            this._addEventListener(chartsTab, 'shown.bs.tab', () => {
                tabController.handleChartsTabShown(); // Handle CharTs tab shown
            });
        }
        
        if (chartsHistoryTab) {
            this._addEventListener(chartsHistoryTab, 'shown.bs.tab', () => {
                tabController.handleChartsHistoryTabShown(); // Handle CHarts tab shown
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
        this.customListeners.clear();
        this.isInitialized = false;
    }

    /**
     * Add a custom event listener
     * @param {string} eventName - Name of the custom event
     * @param {Function} handler - Event handler function
     */
    on(eventName, handler) {
        if (!this.customListeners.has(eventName)) {
            this.customListeners.set(eventName, []);
        }
        this.customListeners.get(eventName).push(handler);
    }

    /**
     * Remove a custom event listener
     * @param {string} eventName - Name of the custom event
     * @param {Function} handler - Event handler function to remove
     */
    off(eventName, handler) {
        if (!this.customListeners.has(eventName)) return;
        
        const handlers = this.customListeners.get(eventName);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emit a custom event
     * @param {string} eventName - Name of the custom event
     * @param {*} data - Data to pass to event handlers
     */
    emit(eventName, data) {
        console.log(`EventService: Emitting custom event '${eventName}'`, data || '(no data)');
        
        if (!this.customListeners.has(eventName)) {
            console.log(`EventService: No listeners for event '${eventName}'`);
            return;
        }
        
        const handlers = this.customListeners.get(eventName);
        console.log(`EventService: Found ${handlers.length} listeners for event '${eventName}'`);
        
        handlers.forEach((handler, index) => {
            try {
                console.log(`EventService: Calling handler ${index + 1} for '${eventName}'`);
                handler(data);
            } catch (error) {
                console.error(`EventService: Error in handler for '${eventName}':`, error);
            }
        });
    }
}
