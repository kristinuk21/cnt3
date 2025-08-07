/**
 * ModalController - Handles modal operations
 * Follows Single Responsibility Principle - only responsible for modal management
 */
class ModalController {
    constructor(uiService, databaseService) {
        this.uiService = uiService;
        this.databaseService = databaseService;
    }

    /**
     * Show break modal and update its content
     */
    showBreakModal() {
        this._updateModalContent();
        this.uiService.showBreakModal();
    }

    /**
     * Handle modal show event
     */
    handleModalShow() {
        this._updateModalContent();
    }

    /**
     * Update modal content with current breaks
     */
    _updateModalContent() {
        // Gather today's info
        const breaks = this.databaseService.getBreaks();
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        this.uiService.updateTodayModal({
            breaks,
            earlyStart,
            hasEarlyStart: !!earlyStart
        });
    }
}
