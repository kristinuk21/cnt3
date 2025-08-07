/**
 * Main application entry point
 * Initializes the application using the ApplicationController
 */

// Global application instance
let app = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        app = new ApplicationController();
        
        // Make app globally available immediately
        window.app = app;
        
        await app.initialize();
        
        // Setup progress bar refresh system
        window.onProgressBarRefresh = window.onProgressBarRefresh || [];
        
        // Add React render as the main callback
        if (window.renderProgressBars && (!window.onProgressBarRefresh.includes(window.renderProgressBars))) {
            window.onProgressBarRefresh.push(window.renderProgressBars);
        }
        
        // Setup refresh interval
        function runAllRefreshCallbacks() {
            window.onProgressBarRefresh.forEach(fn => {
                try { fn(); } catch (e) { 
                    console.warn('Refresh callback error:', e);
                }
            });
        }
        
        setInterval(runAllRefreshCallbacks, 1000);
    } catch (error) {
        UtilsService.log(`Failed to start application: ${error.message}`, 'error');
        alert('Failed to initialize the application. Please check the console for details.');
    }
});

// Global functions removed - all functionality is now accessed through proper MVC architecture

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (app) {
        app.cleanup();
    }
});
