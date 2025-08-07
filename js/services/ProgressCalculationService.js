/**
 * ProgressCalculationService - Centralized progress calculations
 * Follows Single Responsibility and DRY principles
 * Consolidates all progress-related calculations in one place
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
        const currentHour = now.getHours();
        
        // If it's past working hours or before working hours, show different message
        if (currentHour >= CONFIG.WORKING_HOURS.END) {
            return {
                totalMs: 0,
                hours: 0,
                minutes: 0,
                isAfterHours: true
            };
        }
        
        if (currentHour < CONFIG.WORKING_HOURS.START) {
            // Calculate time until work starts
            const workStart = new Date();
            workStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
            const timeUntilWork = workStart - now;
            
            return {
                totalMs: timeUntilWork,
                hours: Math.floor(timeUntilWork / (60 * 60 * 1000)),
                minutes: Math.floor((timeUntilWork % (60 * 60 * 1000)) / (60 * 1000)),
                isBeforeHours: true
            };
        }
        
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
        
        // Debug logging
        console.log('Progress Calc Debug:', {
            now: now.toLocaleTimeString(),
            workStart: workStart.toLocaleTimeString(),
            workEnd: workEnd.toLocaleTimeString(),
            breakMs,
            remainingMs: workEnd - now
        });
        
        // Calculate remaining time
        const remainingMs = Math.max(0, workEnd - now);
        
        const oneHourMs = (window.CONSTANTS?.TIME?.ONE_HOUR) || (60 * 60 * 1000);
        const oneMinuteMs = (window.CONSTANTS?.TIME?.ONE_MINUTE) || (60 * 1000);
        
        return {
            totalMs: remainingMs,
            hours: Math.floor(remainingMs / oneHourMs),
            minutes: Math.floor((remainingMs % oneHourMs) / oneMinuteMs)
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
        
        return workEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
     * @returns {Object} Today progress data
     */
    getTodayProgressData() {
        const remainingTime = this.calculateRemainingTime();
        
        const result = {
            progress: this.calculateHoursProgress(),
            remainingHours: remainingTime.hours,
            remainingMinutes: remainingTime.minutes,
            endTime: this.calculateEndTime()
        };
        
        console.log('ProgressCalculationService.getTodayProgressData:', result);
        return result;
    }

    /**
     * Get today's breaks
     * @private
     * @returns {Array} Array of today's breaks
     */
    _getTodayBreaks() {
        const today = new Date().toDateString();
        return this.databaseService.getBreaks().filter(b => 
            b.start && new Date(b.start).toDateString() === today
        );
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
