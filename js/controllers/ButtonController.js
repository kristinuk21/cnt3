/**
 * ButtonController - Handles button interactions
 * Follows Single Responsibility Principle - only responsible for button actions
 */
class ButtonController {
    /**
     * Handle reset day button click
     */
    handleResetDay() {
        this.databaseService.resetToday();
        this.uiService.showAlert('Day has been reset.', 'success');
        // Optionally refresh modal and home tab
        if (this.tabController && this.tabController.updateHomeTab) {
            this.tabController.updateHomeTab();
        }
    }
    constructor(databaseService, uiService, tabController) {
        this.databaseService = databaseService;
        this.uiService = uiService;
        this.tabController = tabController;
    }

    /**
     * Handle start early button click
     */
    handleStartEarly() {
        this.databaseService.startEarlyDay();
        this.uiService.showAlert(CONFIG.MESSAGES.SUCCESS.DAY_STARTED_EARLY, 'success');
    }

    /**
     * Handle start break button click
     */
    handleStartBreak() {
        this.databaseService.startBreak();
        // Could refresh modal content here
    }

    /**
     * Handle end break button click
     */
    handleEndBreak() {
        this.databaseService.endBreak();
        // Could refresh modal content here
    }

    /**
     * Handle reset logs button click
     */
    handleResetLogs() {
        this.databaseService.resetLogs();
        this.databaseService.addLog(CONFIG.MESSAGES.INFO.LOGS_RESET);
        this.tabController.handleLogsTabShown(); // Refresh logs display
    }
}
