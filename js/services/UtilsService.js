/**
 * UtilsService - Common utility functions
 * Follows DRY principle - centralizes commonly used utility functions
 */
class UtilsService {
    /**
     * Format a date for display in various contexts
     * @param {string|Date} date - Date to format
     * @param {string} format - Format type ('short', 'full', 'time')
     * @returns {string} - Formatted date string
     */
    static formatDate(date, format = 'short') {
        let dateObj;
        
        if (typeof date === 'string') {
            if (date.includes('/')) {
                const [month, day, year] = date.split('/').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(date);
            }
        } else {
            dateObj = date;
        }

        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
            case 'full':
                return dateObj.toLocaleDateString();
            case 'time':
                return dateObj.toLocaleTimeString();
            case 'datetime':
                return dateObj.toLocaleString();
            default:
                return dateObj.toLocaleDateString();
        }
    }

    /**
     * Calculate percentage progress
     * @param {number} current - Current value
     * @param {number} total - Total value
     * @returns {number} - Percentage (0-100)
     */
    static calculatePercentage(current, total) {
        if (total <= 0) return 0;
        const percentage = Math.round((current / total) * 100);
        return Math.max(0, Math.min(100, percentage)); // Clamp between 0 and 100
    }

    /**
     * Safely update DOM element content
     * @param {HTMLElement|string} element - Element or element ID
     * @param {string} content - Content to set
     */
    static updateElement(element, content) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Create a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Check if a value is within working hours range
     * @param {number} hour - Hour to check (0-23)
     * @returns {boolean}
     */
    static isWithinWorkingHours(hour) {
        return hour >= CONFIG.WORKING_HOURS.START && hour < CONFIG.WORKING_HOURS.END;
    }

    /**
     * Check if a day is a working day
     * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
     * @returns {boolean}
     */
    static isWorkingDay(dayOfWeek) {
        return dayOfWeek >= CONFIG.WORKING_DAYS.START && dayOfWeek <= CONFIG.WORKING_DAYS.END;
    }

    /**
     * Log message with timestamp prefix
     * @param {string} message - Message to log
     * @param {string} level - Log level ('info', 'warn', 'error')
     */
    static log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }
}
