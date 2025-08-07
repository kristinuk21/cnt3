/**
 * TabController - Handles tab-related operations
 * Follows Single Responsibility Principle - only responsible for tab management
 */
class TabController {
    constructor(uiService, dateCalculationService, databaseService) {
        this.uiService = uiService;
        this.dateCalculationService = dateCalculationService;
        this.databaseService = databaseService;
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
     * Update details tab with current data
     */
    _updateDetailsTab() {
        // Get early start and breaks for today
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        const breaksRaw = this.databaseService.getBreaks();
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        // Only today's breaks
        const breaks = breaksRaw
            .filter(b => b.start && b.start.startsWith(todayStr))
            .map(b => ({
                start: b.start ? new Date(b.start) : null,
                end: b.end ? new Date(b.end) : null
            }));

        // Calculate remaining minutes until end of work day, considering early start and breaks
        const now = new Date();
        let workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.dateCalculationService.workingHoursStart, 0, 0, 0);
        if (earlyStart instanceof Date && earlyStart < workStart) {
            workStart = new Date(earlyStart);
        }
        const workEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.dateCalculationService.workingHoursEnd, 0, 0, 0);
        let totalWorkMinutes = Math.floor((workEnd - workStart) / (1000 * 60));
        if (totalWorkMinutes < 1) totalWorkMinutes = 1;
        // Subtract break minutes
        let breakMinutes = 0;
        for (const brk of breaks) {
            if (brk.start instanceof Date && brk.end instanceof Date && brk.end > brk.start) {
                const breakEnd = brk.end < now ? brk.end : now;
                const breakStart = brk.start < workStart ? workStart : brk.start;
                if (breakEnd > breakStart) {
                    breakMinutes += Math.floor((breakEnd - breakStart) / (1000 * 60));
                }
            }
        }
        let minutesPassed = Math.floor((now - workStart) / (1000 * 60)) - breakMinutes;
        if (minutesPassed < 0) minutesPassed = 0;
        if (minutesPassed > totalWorkMinutes) minutesPassed = totalWorkMinutes;
        let remainingMinutes = totalWorkMinutes - minutesPassed;
        if (remainingMinutes < 0) remainingMinutes = 0;
        const remainingHoursObj = {
            hours: Math.floor(remainingMinutes / 60),
            minutes: remainingMinutes % 60
        };

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

        const data = {
            currentDate: formatDate(new Date()),
            previousStartDay: formatDate(parseDate(this.dateCalculationService.computePreviousStartDay())),
            nextEndDay: formatDate(parseDate(this.dateCalculationService.computeNextEndDay())),
            remainingDays: this.dateCalculationService.computeRemainingDaysUntilNextEnd(),
            isWorkingDay: this.dateCalculationService.isTodayWorkingDay(),
            isWorkingHours: this.dateCalculationService.isCurrentTimeInWorkingHours(),
            remainingHours: remainingHoursObj
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
