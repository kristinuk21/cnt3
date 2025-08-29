/**
 * ProgressController - Handles progress bar interactions
 * Follows Single Responsibility Principle - only responsible for progress bar actions
 */
class ProgressController {
    constructor(databaseService, modalController) {
        this.databaseService = databaseService;
        this.modalController = modalController;
    }

    /**
     * Handle hours progress bar click
     */
    handleHoursProgressClick() {
        this.databaseService.addLog(CONFIG.MESSAGES.INFO.TODAY_PROGRESS_CLICKED);
        this.modalController.showBreakModal();
    }

    /**
     * Handle days progress bar click
     */
    handleDaysProgressClick() {
        this.databaseService.addLog(CONFIG.MESSAGES.INFO.OVERALL_PROGRESS_CLICKED);
        this.modalController.showBudgetModal();
    }
}
