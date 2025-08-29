/**
 * Application configuration constants
 * Centralizes all configuration values following SOLID principles
 */
const CONFIG = {
    // Database configuration
    DATABASE: {
        LOCALSTORAGE_KEY: 'progressTrackerDB',
        ASSETS_PATH: 'assets/'
    },
    
    // Working hours configuration
    WORKING_HOURS: {
        START: 10,  // 10:00 AM
        END: 18     // 6:00 PM
    },
    
    // Working days configuration
    WORKING_DAYS: {
        START: 1,   // Monday
        END: 5      // Friday
    },
    
    // Period configuration
    PERIODS: {
        FIRST_DAY: 10,
        SECOND_DAY: 25
    },
    
    // UI configuration
    UI: {
        PROGRESS_BAR_HEIGHT: '30px',
        MODAL_MIN_WIDTH: '350px',
        ANIMATION_DURATION: 150
    },
    
    // Messages
    MESSAGES: {
        SUCCESS: {
            DAY_STARTED_EARLY: 'Day started early!',
            LOGS_RESET: 'Logs have been reset successfully.',
            BUDGET_UPDATED: 'Budget updated successfully!'
        },
        ERROR: {
            DB_INIT_FAILED: 'Failed to initialize database',
            SQL_JS_NOT_LOADED: 'sql.js not loaded',
            BUDGET_INVALID: 'Invalid budget amount'
        },
        INFO: {
            PAGE_RELOADED: 'Page reloaded',
            TODAY_PROGRESS_CLICKED: 'Today progress bar clicked',
            OVERALL_PROGRESS_CLICKED: 'Overall progress bar clicked',
            BREAK_STARTED: 'Break started',
            BREAK_ENDED: 'Break ended',
            LOGS_RESET: 'Logs reset',
            STARTED_DAY_EARLY: 'Started day early',
            BUDGET_INCREASED: 'Budget increased',
            BUDGET_DECREASED: 'Budget decreased',
            BUDGET_SET: 'Budget set manually',
            BUDGET_RESET: 'Budget reset to 0'
        }
    }
};

// Make configuration available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
