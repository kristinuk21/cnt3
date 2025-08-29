/**
 * TabController - Handles tab management
 * Follows Single Responsibility Principle - only responsible for tab management
 */
class TabController {
    constructor(uiService, dateCalculationService, databaseService, progressCalculationService, chartService) {
        this.uiService = uiService;
        this.dateCalculationService = dateCalculationService;
        this.databaseService = databaseService;
        this.progressCalculationService = progressCalculationService;
        this.chartService = chartService;
    }

    /**
     * Handle tab click event
     * @param {HTMLElement} tabElement - Clicked tab element
     */
    handleTabClick(tabElement) {
        const tabTrigger = new bootstrap.Tab(tabElement);
        tabTrigger.show();
    }

    /**
     * Handle details tab shown event
     */
    handleDetailsTabShown() {
        this._updateDetailsTab();
    }

    /**
     * Handle logs tab shown event
     */
    handleLogsTabShown() {
        this._updateLogsTab();
    }

    /**
     * Handle charts tab shown event
     */
    handleChartsTabShown() {
        this.chartService.initializeCharts();
    }

    /**
     * Update details tab with current data
     * Uses the centralized data from ProgressCalculationService
     */
    _updateDetailsTab() {
        // Get all data from the centralized progress calculation service
        const todayData = this.progressCalculationService.getTodayProgressData();
        const homeData = this.progressCalculationService.getHomeProgressData();
        const remainingTime = this.progressCalculationService.calculateRemainingTime();

        const formatDate = (date) => {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, ' '); // Ensure consistent spacing
        };

        const parseDate = (dateStr) => {
            const [month, day, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        // Calculate break status
        let breakStatus = 'No break active';
        if (todayData.activeBreak) {
            const breakStart = new Date(todayData.activeBreak.start);
            breakStatus = `Break active (started at ${UtilsService.formatDate(breakStart, 'time')})`;
        }

        const data = {
            // Period information
            currentDate: formatDate(new Date()),
            previousStartDay: formatDate(parseDate(this.dateCalculationService.computePreviousStartDay())),
            nextEndDay: formatDate(parseDate(this.dateCalculationService.computeNextEndDay())),
            remainingDays: this.dateCalculationService.computeRemainingDaysUntilNextEnd(),
            
            // Budget information
            currentBudget: homeData.currentBudget || 0,
            budgetPerDay: homeData.budgetPerDay || 0,
            
            // Work status
            isWorkingDay: todayData.isWorkingDay ? 'Working day' : 'Non-working day',
            isWorkingHours: todayData.isBeforeHours ? 'Before working hours' :
                          todayData.isAfterHours ? 'After working hours' :
                          todayData.isWorkingDay ? 'During working hours' : 'Non-working day',
            remainingHours: remainingTime.formatted,
            startTime: todayData.startTime,
            expectedEndTime: todayData.endTime,

            // Break information
            currentBreakStatus: breakStatus,
            totalBreakDuration: todayData.totalBreakDuration,
            breakCount: todayData.breakCount || 0,
            
            // Progress
            todayProgress: `${todayData.progress}%`
        };

        this.uiService.updateDetailsSection(data);
    }

    /**
     * Update logs tab with current logs
     */
    _updateLogsTab() {
        const logs = this.databaseService.getLogs();
        this.uiService.renderLogs(logs);
    }

    /**
     * Update home tab with progress data
     */
    updateHomeTab() {
        // Only trigger React render for progress bars
        if (window.renderProgressBars) {
            window.renderProgressBars();
        }
    }
}
