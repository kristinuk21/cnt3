/**
 * Constants - Application-wide constants and enums
 * Follows SOLID principles by providing stable abstractions
 * 
 * Usage:
 * - TIME: Time-related constants in milliseconds
 * - DAYS: Day of week constants (0-6)
 * - PROGRESS: Progress calculation constraints
 * - ELEMENTS: DOM element IDs
 * - CSS_CLASSES: CSS class names
 * - LOG_LEVELS: Logging levels
 * 
 * Example:
 * ```js
 * const eightHours = CONSTANTS.TIME.EIGHT_HOURS;
 * const mondayIndex = CONSTANTS.DAYS.MONDAY;
 * ```
 */
const CONSTANTS = {
    // Time constants (in milliseconds)
    TIME: {
        ONE_SECOND: 1000,
        ONE_MINUTE: 60 * 1000,
        ONE_HOUR: 60 * 60 * 1000,
        EIGHT_HOURS: 8 * 60 * 60 * 1000
    },
    
    // Day of week constants
    DAYS: {
        SUNDAY: 0,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6
    },
    
    // Progress calculation constants
    PROGRESS: {
        MIN_PERCENTAGE: 0,
        MAX_PERCENTAGE: 100,
        MIN_WIDTH_PX: 40
    },
    
    // UI element IDs
    ELEMENTS: {
        HOME_PROGRESS_CONTAINER: 'homeProgressBarContainer',
        TODAY_PROGRESS_CONTAINER: 'todayProgressBarContainer',
        BREAK_MODAL: 'breakModal',
        LOGS_CONTENT: 'logsContent'
    },
    
    // CSS Classes
    CSS_CLASSES: {
        PROGRESS_BAR: 'progress-bar',
        MODAL_CONTENT: 'custom-modal-content',
        BREAK_ITEM: 'break-item',
        BTN_PRIMARY: 'btn btn-primary',
        BTN_SUCCESS: 'btn btn-success',
        BTN_DANGER: 'btn btn-danger',
        BTN_WARNING: 'btn btn-warning'
    },
    
    // Log levels
    LOG_LEVELS: {
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error'
    }
};

// Make constants available globally
if (typeof window !== 'undefined') {
    window.CONSTANTS = CONSTANTS;
}
