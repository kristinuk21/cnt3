// progressBarHelpers.js
// Helper functions to provide props for React progress bars

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
        return { progress: 0, remainingHours: 0, remainingMinutes: 0, endTime: '', onClick: () => {} };
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
        onClick: () => progressController.handleHoursProgressClick()
    };
}

/**
 * Render both progress bars using React
 */
function renderProgressBars() {
    console.log('renderProgressBars called');
    console.log('window.app:', window.app);
    console.log('services available:', window.app?.services ? Object.keys(window.app.services) : 'none');
    
    const homeContainer = document.getElementById('homeProgressBarContainer');
    const todayContainer = document.getElementById('todayProgressBarContainer');
    
    if (homeContainer) {
        const homeProps = getHomeProgressBarProps();
        console.log('Rendering HomeProgressBar with props:', homeProps);
        ReactDOM.render(
            React.createElement(HomeProgressBar, homeProps),
            homeContainer
        );
    }
    
    if (todayContainer) {
        const todayProps = getTodayProgressBarProps();
        console.log('Rendering TodayProgressBar with props:', todayProps);
        ReactDOM.render(
            React.createElement(TodayProgressBar, todayProps),
            todayContainer
        );
    }
}

// Export functions to global scope
window.getHomeProgressBarProps = getHomeProgressBarProps;
window.getTodayProgressBarProps = getTodayProgressBarProps;
window.renderProgressBars = renderProgressBars;
