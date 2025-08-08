/**
 * ModalController - Handles modal operations
 * Follows Single Responsibility Principle - only responsible for modal management
 */
class ModalController {
    constructor(uiService, databaseService, progressCalculationService) {
        this.uiService = uiService;
        this.databaseService = databaseService;
        this.progressCalculationService = progressCalculationService;
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
        try {
            // Get data from the centralized progress calculation service
            const todayData = this.progressCalculationService.getTodayProgressData();
            
            // Get early start from database directly for the modal
            const earlyStart = this.databaseService.getTodayEarlyStartTime();
            const now = new Date();
            const workStart = new Date();
            workStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);

            // Calculate break durations for display
            const breakDetails = todayData.breaks.map(breakItem => {
                const start = new Date(breakItem.start);
                const end = breakItem.end ? new Date(breakItem.end) : now;
                const durationMs = end - start;
                const durationMins = Math.round(durationMs / (1000 * 60));  // Round instead of floor
                return {
                    ...breakItem,
                    durationStr: `${durationMins}m`
                };
            });

            // Ensure we have valid data with fallbacks
            this.uiService.updateTodayModal({
                breaks: breakDetails,
                earlyStart: earlyStart,
                hasEarlyStart: earlyStart instanceof Date && earlyStart < workStart,
                totalBreakDuration: todayData.totalBreakDuration,
                activeBreak: todayData.activeBreak
            });
        } catch (error) {
            console.error('Error updating modal content:', error);
            // Provide fallback data if there's an error
            this.uiService.updateTodayModal({
                breaks: [],
                earlyStart: null,
                hasEarlyStart: false,
                totalBreakDuration: 'No breaks taken',
                activeBreak: null
            });
        }
    }
}
