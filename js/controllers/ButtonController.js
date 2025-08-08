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
        this.modalController.handleModalShow();  // Update modal content
        // Update home tab for progress bars
        if (this.tabController && this.tabController.updateHomeTab) {
            this.tabController.updateHomeTab();
        }
    }
    constructor(databaseService, uiService, tabController, modalController) {
        this.databaseService = databaseService;
        this.uiService = uiService;
        this.tabController = tabController;
        this.modalController = modalController;
    }

    /**
     * Handle start early button click
     */
    handleStartEarly() {
        this.databaseService.startEarlyDay();
        this.modalController.handleModalShow();  // Update modal content
        this.uiService.showAlert(CONFIG.MESSAGES.SUCCESS.DAY_STARTED_EARLY, 'success');
    }

    /**
     * Handle start break button click
     */
    handleStartBreak() {
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        const now = new Date();
        let workStart = new Date();
        workStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        
        // Check if day has started (either early start or past regular start time)
        if (!earlyStart && now < workStart) {
            this.uiService.showAlert('Cannot start break before starting the day', 'warning');
            return;
        }

        // Check if there's already an active break
        if (this.databaseService.isBreakActive()) {
            this.uiService.showAlert('A break is already in progress', 'warning');
            return;
        }

        // Try to start the break
        const started = this.databaseService.startBreak();
        if (started) {
            this.modalController.handleModalShow();  // Update modal content
            this.tabController.updateHomeTab();  // Update progress bars
            this.uiService.showAlert('Break started successfully', 'success');
        } else {
            this.uiService.showAlert('Failed to start break', 'error');
        }
    }

    /**
     * Handle end break button click
     */
    handleEndBreak() {
        if (!this.databaseService.isBreakActive()) {
            this.uiService.showAlert('No active break to end', 'warning');
            return;
        }
        this.databaseService.endBreak();
        this.modalController.handleModalShow();  // Update modal content
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
