// progressBarHelpers.js
// Helper functions to provide props for React progress bars

(function() {
    // Wait for React and ReactDOM to be available
    function waitForReact(callback) {
        if (window.React && window.ReactDOM && window.HomeProgressBar && window.TodayProgressBar) {
            callback();
        } else {
            console.log('Waiting for React dependencies...');
            setTimeout(() => waitForReact(callback), 100);
        }
    }

    /**
     * Get props for the Home progress bar
     * @returns {Object} Props for HomeProgressBar component
     */
    function getHomeProgressBarProps() {
        const app = window.app;
        if (!app?.services?.progressCalculation) {
            console.warn('ProgressCalculationService not available');
            return { progress: 0, endDate: '', remainingDays: 0, onClick: () => {} };
        }
        
        const progressService = app.services.progressCalculation;
        const progressController = app.controllers.progress;
        const homeProgressData = progressService.getHomeProgressData();
        
        // Debug logging
        console.log('Home Progress Data:', homeProgressData);
        
        return {
            progress: homeProgressData.progress,
            endDate: homeProgressData.endDate,
            remainingDays: homeProgressData.remainingDays,
            onClick: () => progressController.handleDaysProgressClick()
        };
    }

    /**
     * Get props for the Today progress bar
     * @returns {Object} Props for TodayProgressBar component
     */
    function getTodayProgressBarProps() {
        const app = window.app;
        if (!app?.services?.progressCalculation) {
            console.warn('ProgressCalculationService not available');
            return { 
                progress: 0, 
                remainingHours: 0, 
                remainingMinutes: 0, 
                endTime: '', 
                isBeforeHours: false,
                isAfterHours: false,
                onClick: () => {} 
            };
        }
        
        const progressService = app.services.progressCalculation;
        const progressController = app.controllers.progress;
        const todayProgressData = progressService.getTodayProgressData();
        
        // Debug logging
        console.log('Today Progress Data:', todayProgressData);
        
        return {
            progress: todayProgressData.progress,
            remainingHours: todayProgressData.remainingHours,
            remainingMinutes: todayProgressData.remainingMinutes,
            endTime: todayProgressData.endTime,
            isBeforeHours: todayProgressData.isBeforeHours,
            isAfterHours: todayProgressData.isAfterHours,
            onClick: () => progressController.handleHoursProgressClick()
        };
    }

    /**
     * Render both progress bars using React
     */
    function renderProgressBars() {
        console.log('renderProgressBars called');
        
        if (!window.app || !window.app.services || !window.app.services.progressCalculation) {
            console.warn('Application or ProgressCalculationService not ready yet');
            return;
        }

        waitForReact(() => {
            const homeContainer = document.getElementById('homeProgressBarContainer');
            const todayContainer = document.getElementById('todayProgressBarContainer');
            
            try {
                if (homeContainer) {
                    const homeProps = getHomeProgressBarProps();
                    console.log('Home progress props:', homeProps);
                    ReactDOM.render(
                        React.createElement(window.HomeProgressBar, homeProps),
                        homeContainer
                    );
                }
                
                if (todayContainer) {
                    const todayProps = getTodayProgressBarProps();
                    console.log('Today progress props:', todayProps);
                    ReactDOM.render(
                        React.createElement(window.TodayProgressBar, todayProps),
                        todayContainer
                    );
                }
            } catch (error) {
                console.error('Error rendering progress bars:', error);
            }
        });
    }

    // Export functions to global scope
    window.getHomeProgressBarProps = getHomeProgressBarProps;
    window.getTodayProgressBarProps = getTodayProgressBarProps;
    window.renderProgressBars = renderProgressBars;
})();
