/**
 * StatisticsService - Calculates meaningful spending statistics
 * 
 * KEY INSIGHT: Each budget entry represents spending over a PERIOD (since last update),
 * not a point-in-time event. We calculate daily rates based on the gap between updates.
 */
class StatisticsService {
    constructor(databaseService, dateCalculationService) {
        this.databaseService = databaseService;
        this.dateCalculationService = dateCalculationService;
    }

    /**
     * Get all spending periods for current budget cycle
     * Each period = gap between two consecutive budget updates
     * @returns {Array} Array of period objects with spending data
     */
    getSpendingPeriods() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Get current period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Filter to current period and sort chronologically (oldest first)
        const currentPeriodHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= periodStart && entryDate <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (currentPeriodHistory.length < 2) {
            return [];
        }
        
        // Build spending periods
        const periods = [];
        for (let i = 1; i < currentPeriodHistory.length; i++) {
            const prevEntry = currentPeriodHistory[i - 1];
            const currEntry = currentPeriodHistory[i];
            
            const prevDate = new Date(prevEntry.timestamp);
            const currDate = new Date(currEntry.timestamp);
            
            // Days between updates (at least 1 to avoid division by zero)
            const daysBetween = Math.max(1, Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24)));
            
            // Amount spent in this period (negative means money was added)
            const amountSpent = prevEntry.amount - currEntry.amount;
            
            // Daily rate for this period
            const dailyRate = amountSpent / daysBetween;
            
            periods.push({
                startDate: prevDate,
                endDate: currDate,
                startBudget: prevEntry.amount,
                endBudget: currEntry.amount,
                daysCovered: daysBetween,
                amountSpent: amountSpent,
                dailyRate: dailyRate,
                action: currEntry.action
            });
        }
        
        return periods;
    }

    /**
     * Get comprehensive statistics using period-based calculations
     * @returns {Object} Statistics object
     */
    getCurrentPeriodStatistics() {
        const periods = this.getSpendingPeriods();
        const budgetHistory = this.databaseService.getBudgetHistory();
        const currentBudget = this.databaseService.getCurrentBudget();
        const daysRemaining = this.dateCalculationService.computeRemainingDaysUntilNextEnd();
        
        // Get period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Get starting budget for this cycle
        const currentPeriodHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= periodStart && entryDate <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const startingBudget = currentPeriodHistory.length > 0 ? currentPeriodHistory[0].amount : currentBudget;
        const totalSpent = Math.max(0, startingBudget - currentBudget);
        
        // Calculate weighted average daily rate (KEY CALCULATION)
        let totalDaysCovered = 0;
        let weightedSpending = 0;
        
        periods.forEach(p => {
            if (p.amountSpent > 0) { // Only count spending periods, not additions
                totalDaysCovered += p.daysCovered;
                weightedSpending += p.amountSpent;
            }
        });
        
        const weightedDailyRate = totalDaysCovered > 0 ? weightedSpending / totalDaysCovered : 0;
        
        // Total days in cycle
        const totalDaysInCycle = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        const targetDailyRate = startingBudget / totalDaysInCycle;
        
        // Days elapsed since cycle start
        const now = new Date();
        const daysElapsed = Math.max(1, Math.floor((now - periodStart) / (1000 * 60 * 60 * 24)));
        
        // Forecast: at current rate, how many days will budget last?
        const forecastDays = weightedDailyRate > 0 ? Math.floor(currentBudget / weightedDailyRate) : Infinity;
        const forecastDate = forecastDays < Infinity ? new Date(now.getTime() + forecastDays * 24 * 60 * 60 * 1000) : null;
        
        // Is forecast before or after period end?
        const forecastOk = forecastDate === null || forecastDate >= periodEnd;
        
        // Spending pace comparison
        const pacePercent = targetDailyRate > 0 ? (weightedDailyRate / targetDailyRate) * 100 : 0;
        
        // Find best/worst periods (lowest/highest daily rate)
        let bestPeriod = null;
        let worstPeriod = null;
        
        periods.filter(p => p.amountSpent > 0).forEach(p => {
            if (!bestPeriod || p.dailyRate < bestPeriod.dailyRate) {
                bestPeriod = p;
            }
            if (!worstPeriod || p.dailyRate > worstPeriod.dailyRate) {
                worstPeriod = p;
            }
        });
        
        // Generate status and advice
        const { status, advice } = this._generateAdvice(pacePercent, forecastOk, forecastDays, daysRemaining, currentBudget, weightedDailyRate, targetDailyRate);
        
        return {
            // Core metrics
            startingBudget: Math.round(startingBudget),
            currentBudget: Math.round(currentBudget),
            totalSpent: Math.round(totalSpent),
            
            // Time metrics
            daysElapsed,
            daysRemaining,
            totalDaysInCycle,
            
            // Rate metrics (the key insight!)
            weightedDailyRate: Math.round(weightedDailyRate * 10) / 10,
            targetDailyRate: Math.round(targetDailyRate * 10) / 10,
            pacePercent: Math.round(pacePercent),
            
            // Forecast
            forecastDays,
            forecastDate,
            forecastOk,
            
            // Best/Worst
            bestPeriod,
            worstPeriod,
            
            // Update tracking
            updateCount: periods.length,
            periods,
            
            // Advice
            status,
            advice
        };
    }

    /**
     * Generate actionable advice
     * @private
     */
    _generateAdvice(pacePercent, forecastOk, forecastDays, daysRemaining, currentBudget, actualRate, targetRate) {
        let status = 'info';
        let advice = '';
        
        if (!forecastOk) {
            // Budget will run out before period ends
            status = 'danger';
            const shortfall = daysRemaining - forecastDays;
            const neededRate = daysRemaining > 0 ? Math.floor(currentBudget / daysRemaining) : 0;
            advice = `🚨 At current rate, budget runs out ${shortfall} days early! Reduce to ${neededRate} RON/day to last.`;
        } else if (pacePercent > 120) {
            status = 'warning';
            const excess = Math.round(actualRate - targetRate);
            advice = `⚠️ Spending ${pacePercent}% of target rate (+${excess} RON/day). Slow down to stay on track.`;
        } else if (pacePercent > 100) {
            status = 'warning';
            advice = `⚠️ Slightly over pace (${pacePercent}%). You have buffer but watch spending.`;
        } else if (pacePercent >= 80) {
            status = 'success';
            advice = `✓ On track at ${pacePercent}% of target. Current habits are working.`;
        } else if (pacePercent > 0) {
            status = 'success';
            const saved = Math.round((targetRate - actualRate) * daysRemaining);
            advice = `✓ Under budget! Only ${pacePercent}% of target. ~${saved} RON buffer available.`;
        } else {
            status = 'info';
            advice = 'Start tracking spending to see insights.';
        }
        
        return { status, advice };
    }

    /**
     * Format statistics for display
     */
    formatForDisplay(stats) {
        const formatDate = (date) => {
            if (!date) return '-';
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        };
        
        const formatPeriod = (period) => {
            if (!period) return '-';
            return `${formatDate(period.startDate)}-${formatDate(period.endDate)}: ${Math.round(period.dailyRate)} RON/day (${period.daysCovered}d)`;
        };
        
        return {
            startingBudget: `${stats.startingBudget} RON`,
            currentBudget: `${stats.currentBudget} RON`,
            totalSpent: `${stats.totalSpent} RON`,
            weightedDailyRate: `${stats.weightedDailyRate} RON/day`,
            targetDailyRate: `${stats.targetDailyRate} RON/day`,
            pacePercent: `${stats.pacePercent}%`,
            forecastDays: stats.forecastDays < Infinity ? `${stats.forecastDays} days` : 'Full period+',
            forecastDate: stats.forecastDate ? formatDate(stats.forecastDate) : 'After period end ✓',
            bestPeriod: formatPeriod(stats.bestPeriod),
            worstPeriod: formatPeriod(stats.worstPeriod),
            advice: stats.advice
        };
    }

    /**
     * Get previous period statistics for comparison
     */
    getPreviousPeriodStats() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Calculate previous period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const currentPeriodStart = new Date(startYear, startMonth - 1, startDay);
        
        // Previous period is ~15 days before current period start
        const prevPeriodEnd = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(prevPeriodEnd.getTime() - 15 * 24 * 60 * 60 * 1000);
        
        const prevHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= prevPeriodStart && entryDate <= prevPeriodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (prevHistory.length < 2) {
            return null;
        }
        
        const startBudget = prevHistory[0].amount;
        const endBudget = prevHistory[prevHistory.length - 1].amount;
        const totalSpent = Math.max(0, startBudget - endBudget);
        
        // Calculate weighted daily rate for previous period
        let totalDays = 0;
        let totalSpending = 0;
        
        for (let i = 1; i < prevHistory.length; i++) {
            const prev = prevHistory[i - 1];
            const curr = prevHistory[i];
            const days = Math.max(1, Math.round((new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60 * 24)));
            const spent = prev.amount - curr.amount;
            if (spent > 0) {
                totalDays += days;
                totalSpending += spent;
            }
        }
        
        const dailyRate = totalDays > 0 ? totalSpending / totalDays : 0;
        
        return {
            startBudget,
            endBudget,
            totalSpent,
            dailyRate: Math.round(dailyRate * 10) / 10
        };
    }
}
