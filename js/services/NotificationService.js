/**
 * NotificationService - Handles user notifications
 * Follows Single Responsibility Principle - only responsible for notifications
 */
class NotificationService {
    constructor() {
        this.toastContainer = null;
        this._initializeToastContainer();
    }

    /**
     * Show a toast notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = this._createToastElement(message, type);
        this.toastContainer.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);

        // Add fade-in animation
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * Show a success notification
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show an error notification
     * @param {string} message - Error message
     */
    showError(message) {
        this.showToast(message, 'error', 5000); // Longer duration for errors
    }

    /**
     * Show a warning notification
     * @param {string} message - Warning message
     */
    showWarning(message) {
        this.showToast(message, 'warning', 4000);
    }

    /**
     * Show an info notification
     * @param {string} message - Info message
     */
    showInfo(message) {
        this.showToast(message, 'info');
    }

    /**
     * Initialize toast container
     * @private
     */
    _initializeToastContainer() {
        this.toastContainer = document.getElementById('toast-container');
        
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            this.toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                max-width: 300px;
            `;
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * Create toast element
     * @private
     * @param {string} message - Toast message
     * @param {string} type - Toast type
     * @returns {HTMLElement} Toast element
     */
    _createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };

        toast.style.cssText = `
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            line-height: 1.4;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            word-wrap: break-word;
        `;

        // Add warning text color for better visibility
        if (type === 'warning') {
            toast.style.color = '#212529';
        }

        toast.textContent = message;

        // Click to dismiss
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        });

        return toast;
    }
}
