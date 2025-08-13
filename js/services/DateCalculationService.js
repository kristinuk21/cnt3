/**
 * DateCalculationService - Handles all date-related calculations
 * Follows Single Responsibility Principle - only responsible for date calculations
 */
class DateCalculationService {
    constructor() {
        this.workingHoursStart = CONFIG.WORKING_HOURS.START;
        this.workingHoursEnd = CONFIG.WORKING_HOURS.END;
    }

    /**
     * Find first working day on or after given date
     * @param {Date} date - The date to start searching from
     * @returns {string} - Date string in MM/DD/YYYY format
     */
    findFirstWorkingDayOnOrAfter(date) {
        let temp = new Date(date.getTime());
        
        while (temp.getDay() < CONFIG.WORKING_DAYS.START || temp.getDay() > CONFIG.WORKING_DAYS.END) {
            temp.setDate(temp.getDate() + 1);
        }
        
        const month = temp.getMonth() + 1;
        const day = temp.getDate();
        const year = temp.getFullYear();
        return `${month}/${day}/${year}`;
    }

    /**
     * Compute the previous start day based on current date
     * @returns {string} - Date string in MM/DD/YYYY format
     */
    computePreviousStartDay() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // For August 13 (between 10th and 25th):
        // We should return August 10 (the last working day)
        let targetDate;

        if (currentDay >= CONFIG.PERIODS.SECOND_DAY) {
            // On or after SECOND_DAY, use SECOND_DAY of current month
            targetDate = new Date(currentYear, currentMonth, CONFIG.PERIODS.SECOND_DAY);
        } else if (currentDay >= CONFIG.PERIODS.FIRST_DAY) {
            // Between FIRST_DAY and SECOND_DAY, use FIRST_DAY of current month
            targetDate = new Date(currentYear, currentMonth, CONFIG.PERIODS.FIRST_DAY);
        } else {
            // Before FIRST_DAY, use SECOND_DAY of previous month
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            targetDate = new Date(prevYear, prevMonth, CONFIG.PERIODS.SECOND_DAY);
        }

        return this.findFirstWorkingDayOnOrAfter(targetDate);
    }

    /**
     * Compute the next end day based on current date
     * @returns {string} - Date string in MM/DD/YYYY format
     */
    computeNextEndDay() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // For August 13 (between 10th and 25th):
        // We should return August 25 (the next working day)
        let targetDate;

        if (currentDay >= CONFIG.PERIODS.SECOND_DAY) {
            // On or after SECOND_DAY, use FIRST_DAY of next month
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            targetDate = new Date(nextYear, nextMonth, CONFIG.PERIODS.FIRST_DAY);
        } else if (currentDay >= CONFIG.PERIODS.FIRST_DAY) {
            // Between FIRST_DAY and SECOND_DAY, use SECOND_DAY of current month
            targetDate = new Date(currentYear, currentMonth, CONFIG.PERIODS.SECOND_DAY);
        } else {
            // Before FIRST_DAY, use FIRST_DAY of current month
            targetDate = new Date(currentYear, currentMonth, CONFIG.PERIODS.FIRST_DAY);
        }

        return this.findFirstWorkingDayOnOrAfter(targetDate);
    }

    /**
     * Check if today is a working day (Monday to Friday)
     * @returns {boolean}
     */
    isTodayWorkingDay() {
        const today = new Date();
        const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        return UtilsService.isWorkingDay(day);
    }

    /**
     * Check if current time is within working hours (10:00 to 18:00)
     * @returns {boolean}
     */
    isCurrentTimeInWorkingHours() {
        const now = new Date();
        const hour = now.getHours();
        return UtilsService.isWithinWorkingHours(hour);
    }

    /**
     * Compute remaining days until next end date
     * @returns {number}
     */
    computeRemainingDaysUntilNextEnd() {
        const now = new Date();
        const nextEndDateStr = this.computeNextEndDay();
        const [month, day, year] = nextEndDateStr.split('/').map(Number);
        const nextEndDate = new Date(year, month - 1, day);
        
        // Set both dates to start of day to avoid time-based issues
        const nowStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextEndStartOfDay = new Date(nextEndDate.getFullYear(), nextEndDate.getMonth(), nextEndDate.getDate());
        
        const diffTime = nextEndStartOfDay - nowStartOfDay;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : 0;
    }

    /**
     * Compute remaining hours and minutes until end of work day (18:00)
     * @returns {Object} - {hours: number, minutes: number}
     */
    computeRemainingHoursToday() {
        const now = new Date();
        const endOfWork = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.workingHoursEnd, 0, 0, 0);
        let remainingMs = endOfWork - now;
        
        if (remainingMs < 0) remainingMs = 0;
        
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return { hours: remainingHours, minutes: remainingMinutes };
    }

    /**
     * Format date for display (e.g., "11 Aug")
     * @param {string} dateString - Date string in MM/DD/YYYY format
     * @returns {string} - Formatted date string
     */
    formatDateForDisplay(dateString) {
        return UtilsService.formatDate(dateString, 'short');
    }

    /**
     * Calculate progress percentage for days
     * @returns {number} - Progress percentage (0-100)
     */
    calculateDaysProgress() {
        const prevStartStr = this.computePreviousStartDay();
        const nextEndStr = this.computeNextEndDay();
        const remainingDays = this.computeRemainingDaysUntilNextEnd();
        
        const [prevMonth, prevDay, prevYear] = prevStartStr.split('/').map(Number);
        const [nextMonth, nextDay, nextYear] = nextEndStr.split('/').map(Number);
        
        const prevStartDate = new Date(prevYear, prevMonth - 1, prevDay);
        const nextEndDate = new Date(nextYear, nextMonth - 1, nextDay);
        
        const totalDays = Math.max(1, Math.ceil((nextEndDate - prevStartDate) / (1000 * 60 * 60 * 24)));
        const daysPassed = Math.max(0, totalDays - remainingDays);
        
        const progress = UtilsService.calculatePercentage(daysPassed, totalDays);
        
        // Debug logging
        console.log('Days Progress Debug:', {
            prevStart: prevStartStr,
            nextEnd: nextEndStr,
            remainingDays,
            totalDays,
            daysPassed,
            progress: progress + '%'
        });
        
        return progress;
    }

    /**
     * Calculate progress percentage for today's hours
     * @returns {number} - Progress percentage (0-100)
     */
    /**
     * Calculate progress percentage for today's hours, considering early start and break times.
     * @param {Object} options - { earlyStart: Date|null, breaks: Array<{start: Date, end: Date}> }
     * @returns {number} - Progress percentage (0-100)
     */
    calculateHoursProgress(options = {}) {
        const now = new Date();
        
        // Work day is 8 hours (10:00-18:00 by default)
        let workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.workingHoursStart, 0, 0, 0);
        
        // If started early, use that time
        if (options.earlyStart instanceof Date && options.earlyStart < workStart) {
            workStart = new Date(options.earlyStart);
        }
        
        // 8-hour work period
        const workEnd = new Date(workStart.getTime() + 8 * 60 * 60 * 1000);
        const totalWorkMinutes = 8 * 60; // 480 minutes
        
        // Calculate break time
        let breakMinutes = 0;
        if (Array.isArray(options.breaks)) {
            for (const brk of options.breaks) {
                if (brk.start) {
                    const breakStart = new Date(brk.start);
                    const breakEnd = brk.end ? new Date(brk.end) : now;
                    if (breakEnd > breakStart) {
                        breakMinutes += Math.floor((breakEnd - breakStart) / (1000 * 60));
                    }
                }
            }
        }
        
        // Minutes worked so far (excluding breaks)
        const elapsedMinutes = Math.floor((now - workStart) / (1000 * 60));
        const workMinutes = Math.max(0, elapsedMinutes - breakMinutes);
        
        return UtilsService.calculatePercentage(workMinutes, totalWorkMinutes);
    }

    /**
     * Calculate remaining time for today's work
     * @param {Object} options - { earlyStart: Date|null, breaks: Array }
     * @returns {Object} {hours: number, minutes: number, endTime: string}
     */
    calculateRemainingTime(options = {}) {
        const now = new Date();
        
        // Work day starts at 10:00 AM or early start time
        let workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.workingHoursStart, 0, 0, 0);
        if (options.earlyStart instanceof Date && options.earlyStart < workStart) {
            workStart = new Date(options.earlyStart);
        }
        
        // 8-hour work period + break time
        let workEnd = new Date(workStart.getTime() + 8 * 60 * 60 * 1000);
        
        // Add break time to extend the end time
        if (Array.isArray(options.breaks)) {
            for (const brk of options.breaks) {
                if (brk.start) {
                    const breakStart = new Date(brk.start);
                    const breakEnd = brk.end ? new Date(brk.end) : now;
                    if (breakEnd > breakStart) {
                        workEnd = new Date(workEnd.getTime() + (breakEnd - breakStart));
                    }
                }
            }
        }
        
        const remainingMs = Math.max(0, workEnd - now);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const endTime = workEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return { hours, minutes, endTime };
    }
}
