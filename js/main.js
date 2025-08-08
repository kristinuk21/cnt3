/**
 * Main application entry point
 * Initializes the application using the ApplicationController
 */

// Global application instance
let app = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if required dependencies are available
        if (!window.React) {
            throw new Error('React is not loaded');
        }
        if (!window.ReactDOM) {
            throw new Error('ReactDOM is not loaded');
        }
        if (!window.Babel) {
            throw new Error('Babel is not loaded');
        }
        
        app = new ApplicationController();
        window.app = app;
        
        await app.initialize();
        
        // Setup progress bar refresh system
        const progressData = {
            today: null,
            home: null
        };

        window.getProgressData = () => ({...progressData});
        
        // Update progress data
        function updateProgressData() {
            try {
                progressData.today = app.getService('progressCalculation').getTodayProgressData();
                progressData.home = app.getService('progressCalculation').getHomeProgressData();
                
                if (window.renderProgressBars) {
                    window.renderProgressBars();
                }
            } catch (e) {
                UtilsService.log(`Progress data update error: ${e.message}`, 'error');
            }
        }
        
        // Initial update
        updateProgressData();
        
        // Setup refresh interval
        setInterval(updateProgressData, 1000);
    } catch (error) {
        const errorDetails = `Failed to start application:\n\n${error.message}\n\nIf this persists, try clearing your browser cache and reloading.`;
        UtilsService.log(errorDetails, 'error');
        alert(errorDetails);
    }
});

// Global functions removed - all functionality is now accessed through proper MVC architecture

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (app) {
        app.cleanup();
    }
});
