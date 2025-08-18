/**
 * ProgressCalculationService - Centralized progress calculations
 * Follows Single Responsibility and DRY principles
 * Consolidates all progress-related calculations            // Calculate times
        const defaultStartTime = new Date();
        defaultStartTime.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        const actualStartTime = (earlyStart instanceof Date && earlyStart < defaultStartTime) ? earlyStart : defaultStartTime;
        
        // For early start check
        const standardWorkStart = new Date();
        standardWorkStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        
        const result = {e place
 */
class ProgressCalculationService {
    constructor(dateCalculationService, databaseService) {
        this.dateService = dateCalculationService;
        this.databaseService = databaseService;
    }

    /**
     * Calculate overall days progress
     * @returns {number} Progress percentage (0-100)
     */
    calculateDaysProgress() {
        return this.dateService.calculateDaysProgress();
    }

    /**
     * Calculate today's hours progress
     * @returns {number} Progress percentage (0-100)
     */
    calculateHoursProgress() {
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        const breaks = this._getTodayBreaks();
        return this.dateService.calculateHoursProgress({ earlyStart, breaks });
    }

    /**
     * Calculate remaining time for today
     * @returns {Object} {hours: number, minutes: number, totalMs: number}
     */
    calculateRemainingTime() {
        const now = new Date();
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        const breaks = this._getTodayBreaks();
        
        // Standard work start time (10:00 AM)
        let workStart = new Date();
        workStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        
        // If started early, use that time
        if (earlyStart instanceof Date && earlyStart < workStart) {
            workStart = new Date(earlyStart);
        }

        // If we haven't started yet, show time until work starts
        if (now < workStart) {
            const timeUntilWork = workStart - now;
            return {
                totalMs: timeUntilWork,
                hours: Math.floor(timeUntilWork / (60 * 60 * 1000)),
                minutes: Math.floor((timeUntilWork % (60 * 60 * 1000)) / (60 * 1000)),
                isBeforeHours: true
            };
        }
        
        // Calculate 8-hour workday end time from the actual start time
        const eightHoursMs = (window.CONSTANTS?.TIME?.EIGHT_HOURS) || (8 * 60 * 60 * 1000);
        let workEnd = new Date(workStart.getTime() + eightHoursMs);
        
        // Add break time to extend the end time (breaks extend the day)
        const breakMs = this._calculateBreakDuration(breaks);
        workEnd = new Date(workEnd.getTime() + breakMs);
        
        // If we're past the calculated end time, show no time remaining
        if (now >= workEnd) {
            return {
                totalMs: 0,
                hours: 0,
                minutes: 0,
                isAfterHours: true
            };
        }
        
        // Debug logging
        console.log('Progress Calc Debug:', {
            now: now.toLocaleTimeString(),
            workStart: workStart.toLocaleTimeString(),
            workEnd: workEnd.toLocaleTimeString(),
            breakMs,
            breakMins: Math.floor(breakMs / (60 * 1000)),
            remainingMs: workEnd - now
        });
        
        // Calculate remaining time
        const remainingMs = workEnd - now;
        
        const oneHourMs = (window.CONSTANTS?.TIME?.ONE_HOUR) || (60 * 60 * 1000);
        const oneMinuteMs = (window.CONSTANTS?.TIME?.ONE_MINUTE) || (60 * 1000);
        
        const hours = Math.floor(remainingMs / oneHourMs);
        const minutes = Math.floor((remainingMs % oneHourMs) / oneMinuteMs);
        return {
            totalMs: remainingMs,
            hours,
            minutes,
            formatted: hours === 0 && minutes === 0 ? '0h 0m' : `${hours}h ${minutes}m`
        };
    }

    /**
     * Calculate end time for today
     * @returns {string} Formatted end time
     */
    calculateEndTime() {
        const now = new Date();
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        const breaks = this._getTodayBreaks();
        
        // Standard work start time (10:00 AM)
        let workStart = new Date();
        workStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        
        // If started early, use that time
        if (earlyStart instanceof Date && earlyStart < workStart) {
            workStart = new Date(earlyStart);
        }
        
        // Calculate 8-hour workday end time
        const eightHoursMs = (window.CONSTANTS?.TIME?.EIGHT_HOURS) || (8 * 60 * 60 * 1000);
        let workEnd = new Date(workStart.getTime() + eightHoursMs);
        
        // Add break time to extend the end time (breaks extend the day)
        const breakMs = this._calculateBreakDuration(breaks);
        workEnd = new Date(workEnd.getTime() + breakMs);
        
        return workEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    /**
     * Get comprehensive progress data for home section
     * @returns {Object} Home progress data
     */
    getHomeProgressData() {
        const progress = this.calculateDaysProgress();
        const endDate = this.dateService.formatDateForDisplay(this.dateService.computeNextEndDay());
        const remainingDays = this.dateService.computeRemainingDaysUntilNextEnd();
        
        const result = {
            progress,
            endDate,
            remainingDays
        };
        
        console.log('ProgressCalculationService.getHomeProgressData:', result);
        return result;
    }

    /**
     * Get comprehensive progress data for today section
     * This is the single source of truth for all today's calculations
     * @returns {Object} Today progress data with all necessary information for both modal and details view
     */
    getTodayProgressData() {
        const now = new Date();
        const earlyStart = this.databaseService.getTodayEarlyStartTime();
        const todayBreaks = this.databaseService.getBreaks(); // Already filtered for today
        const remainingTime = this.calculateRemainingTime();
        const isWorkingDay = this.dateService.isTodayWorkingDay();
        
        // Calculate total break duration
        const breakMs = this._calculateBreakDuration(todayBreaks);
        const breakMinutes = Math.round(breakMs / (60 * 1000)); // Round instead of floor
        const breakHours = Math.floor(breakMinutes / 60);
        const breakRemainingMinutes = breakMinutes % 60;
        
        // Calculate work status
        let workStatus = isWorkingDay ? 'Working day' : 'Non-working day';
        if (remainingTime.isBeforeHours) {
            workStatus = 'Waiting to start';
        } else if (remainingTime.isAfterHours) {
            workStatus = 'Day completed';
        }
        
        // Calculate times
        const defaultStartTime = new Date();
        defaultStartTime.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        const actualStartTime = (earlyStart instanceof Date && earlyStart < defaultStartTime) ? earlyStart : defaultStartTime;
        
        const result = {
            // Progress information
            progress: this.calculateHoursProgress(),
            remainingHours: remainingTime.hours,
            remainingMinutes: remainingTime.minutes,
            endTime: this.calculateEndTime(),
            
            // Status flags
            isBeforeHours: remainingTime.isBeforeHours,
            isAfterHours: remainingTime.isAfterHours,
            isWorkingDay: isWorkingDay,
            workStatus: workStatus,
            
            // Times
            startTime: isWorkingDay ? 
                UtilsService.formatDate(actualStartTime, 'time') : 
                'Not a working day',
            
            // Break information
            totalBreakDuration: todayBreaks.length > 0 ? 
                (breakMinutes > 0 ? 
                    (breakHours > 0 ? `${breakHours}h ${breakRemainingMinutes}m` : `${breakMinutes}m`) : 
                    '0m') : 
                'No breaks taken',
            activeBreak: todayBreaks.find(b => !b.end),
            breakCount: todayBreaks.length,
            breaks: todayBreaks,
            hasEarlyStart: earlyStart instanceof Date && earlyStart < defaultStartTime
        };
        
        console.log('Today Progress Data:', result);
        return result;
    }

    /**
     * Get today's breaks
     * @private
     * @returns {Array} Array of today's breaks
     */
    _getTodayBreaks() {
        return this.databaseService.getBreaks(); // DatabaseService now filters for today's breaks
    }

    /**
     * Calculate total break duration in milliseconds
     * @private
     * @param {Array} breaks - Array of break objects
     * @returns {number} Total break duration in ms
     */
    _calculateBreakDuration(breaks) {
        if (!Array.isArray(breaks)) return 0;
        
        let totalMs = 0;
        const now = new Date();
        
        for (const brk of breaks) {
            if (brk.start) {
                const breakStart = new Date(brk.start);
                const breakEnd = brk.end ? new Date(brk.end) : now;
                
                if (breakEnd > breakStart) {
                    totalMs += breakEnd - breakStart;
                }
            }
        }
        
        return totalMs;
    }
}
