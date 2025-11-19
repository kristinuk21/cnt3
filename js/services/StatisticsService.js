/**
 * StatisticsService - Calculates meaningful spending statistics
 * Provides actionable insights from budget history
 */
class StatisticsService {
    constructor(databaseService, dateCalculationService) {
        this.databaseService = databaseService;
        this.dateCalculationService = dateCalculationService;
    }

    /**
     * Get comprehensive spending statistics for current period
     * @returns {Object} Statistics object with all insights
     */
    getCurrentPeriodStatistics() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        const currentBudget = this.databaseService.getCurrentBudget();
        
        // Get period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Filter to current period
        const currentPeriodHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= periodStart && entryDate <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // If no data for current period, return empty stats
        if (currentPeriodHistory.length === 0) {
            return {
                startingBudget: currentBudget,
                currentBudget: currentBudget,
                totalSpent: 0,
                daysElapsed: 0,
                daysRemaining: this.dateCalculationService.computeRemainingDaysUntilNextEnd(),
                avgSpendingPerDay: 0,
                targetSpendingPerDay: 0,
                spendingPace: 'No spending data',
                spendingPacePercent: 0,
                budgetDurationDays: Infinity,
                forecastEndDate: null,
                advice: {
                    status: 'info',
                    message: 'Start tracking your spending to see insights!'
                }
            };
        }
        
        // Calculate basic metrics
        const startingBudget = currentPeriodHistory[0].amount;
        const totalSpent = Math.max(0, startingBudget - currentBudget);
        
        const now = new Date();
        const daysElapsed = Math.max(1, Math.floor((now - periodStart) / (1000 * 60 * 60 * 24)));
        const daysRemaining = this.dateCalculationService.computeRemainingDaysUntilNextEnd();
        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        
        // Spending rates
        const avgSpendingPerDay = totalSpent / daysElapsed;
        const targetSpendingPerDay = startingBudget / totalDays;
        
        // Spending pace analysis
        const spendingPacePercent = targetSpendingPerDay > 0 ? 
            (avgSpendingPerDay / targetSpendingPerDay) * 100 : 0;
        
        let spendingPace = '';
        if (spendingPacePercent < 70) {
            spendingPace = 'Way under budget 🎯';
        } else if (spendingPacePercent < 90) {
            spendingPace = 'Under budget ✓';
        } else if (spendingPacePercent <= 110) {
            spendingPace = 'On track ✓';
        } else if (spendingPacePercent <= 130) {
            spendingPace = 'Slightly over pace ⚠️';
        } else {
            spendingPace = 'Way over pace 🚨';
        }
        
        // Budget duration forecast
        const budgetDurationDays = avgSpendingPerDay > 0 ? 
            Math.floor(currentBudget / avgSpendingPerDay) : Infinity;
        
        let forecastEndDate = null;
        if (budgetDurationDays < Infinity) {
            forecastEndDate = new Date(now);
            forecastEndDate.setDate(now.getDate() + budgetDurationDays);
        }
        
        // Generate advice
        const advice = this._generateAdvice(
            spendingPacePercent, 
            budgetDurationDays, 
            daysRemaining,
            currentBudget,
            avgSpendingPerDay,
            targetSpendingPerDay
        );
        
        return {
            startingBudget: Math.round(startingBudget),
            currentBudget: Math.round(currentBudget),
            totalSpent: Math.round(totalSpent),
            daysElapsed,
            daysRemaining,
            avgSpendingPerDay: Math.round(avgSpendingPerDay * 10) / 10,
            targetSpendingPerDay: Math.round(targetSpendingPerDay * 10) / 10,
            spendingPace,
            spendingPacePercent: Math.round(spendingPacePercent),
            budgetDurationDays,
            forecastEndDate,
            advice
        };
    }

    /**
     * Generate actionable advice based on spending patterns
     * @private
     */
    _generateAdvice(pacePercent, durationDays, daysRemaining, currentBudget, avgDaily, targetDaily) {
        let status = 'info';
        let message = '';
        
        // Critical: Budget runs out before period ends
        if (durationDays < daysRemaining) {
            status = 'danger';
            const dailyLimit = Math.floor(currentBudget / daysRemaining);
            message = `🚨 URGENT: Budget will run out ${daysRemaining - durationDays} days early! `;
            message += `Limit spending to ${dailyLimit} RON/day maximum to make it last.`;
        }
        // Warning: Spending too fast
        else if (pacePercent > 130) {
            status = 'warning';
            const reduction = Math.round(avgDaily - targetDaily);
            message = `⚠️ Spending ${pacePercent}% of target rate. `;
            message += `Reduce daily spending by ${reduction} RON to stay on track.`;
        }
        // Close call: Slightly over
        else if (pacePercent > 110) {
            status = 'warning';
            message = `⚠️ Slightly over pace at ${pacePercent}% of target. `;
            message += `Watch your spending closely over the next few days.`;
        }
        // Good: On track
        else if (pacePercent >= 90) {
            status = 'success';
            message = `✓ Good! You're on track at ${pacePercent}% of target pace. `;
            message += `Continue with current spending habits.`;
        }
        // Excellent: Under budget
        else {
            status = 'success';
            const surplus = Math.round((targetDaily - avgDaily) * daysRemaining);
            message = `✓ Excellent! Spending only ${pacePercent}% of target. `;
            message += `You have ~${surplus} RON buffer for unexpected expenses.`;
        }
        
        return { status, message };
    }

    /**
     * Get spending pattern insights (weekday vs weekend, etc.)
     * @returns {Object} Pattern insights
     */
    getSpendingPatterns() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Get period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Filter to current period
        const currentPeriodHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= periodStart && entryDate <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (currentPeriodHistory.length < 2) {
            return {
                weekdaySpending: 0,
                weekendSpending: 0,
                highestSpendingDay: null,
                lowestSpendingDay: null,
                transactionCount: 0
            };
        }
        
        // Analyze spending by day of week
        let weekdayTotal = 0;
        let weekdayCount = 0;
        let weekendTotal = 0;
        let weekendCount = 0;
        
        const dailySpending = new Map();
        
        for (let i = 1; i < currentPeriodHistory.length; i++) {
            const current = currentPeriodHistory[i];
            const previous = currentPeriodHistory[i - 1];
            const spent = Math.max(0, previous.amount - current.amount);
            
            if (spent > 0) {
                const date = new Date(current.timestamp);
                const dayOfWeek = date.getDay();
                const dateKey = date.toISOString().split('T')[0];
                
                // Accumulate daily spending
                dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + spent);
                
                // Categorize by weekday/weekend
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    weekendTotal += spent;
                    weekendCount++;
                } else {
                    weekdayTotal += spent;
                    weekdayCount++;
                }
            }
        }
        
        // Find highest and lowest spending days
        let highestDay = null;
        let highestAmount = 0;
        let lowestDay = null;
        let lowestAmount = Infinity;
        
        dailySpending.forEach((amount, date) => {
            if (amount > highestAmount) {
                highestAmount = amount;
                highestDay = { date, amount: Math.round(amount) };
            }
            if (amount < lowestAmount && amount > 0) {
                lowestAmount = amount;
                lowestDay = { date, amount: Math.round(amount) };
            }
        });
        
        return {
            weekdaySpending: weekdayCount > 0 ? Math.round(weekdayTotal / weekdayCount) : 0,
            weekendSpending: weekendCount > 0 ? Math.round(weekendTotal / weekendCount) : 0,
            highestSpendingDay: highestDay,
            lowestSpendingDay: lowestDay,
            transactionCount: currentPeriodHistory.length - 1
        };
    }

    /**
     * Format statistics for display
     * @param {Object} stats - Statistics object
     * @returns {Object} Formatted display strings
     */
    formatForDisplay(stats) {
        const formatted = {
            startingBudget: `${stats.startingBudget} RON`,
            currentBudget: `${stats.currentBudget} RON`,
            totalSpent: `${stats.totalSpent} RON`,
            avgSpendingPerDay: `${stats.avgSpendingPerDay} RON`,
            spendingPace: stats.spendingPace,
            budgetDuration: stats.budgetDurationDays < Infinity ? 
                `~${stats.budgetDurationDays} days` : 
                'Budget will last entire period',
            forecastEndDate: stats.forecastEndDate ? 
                stats.forecastEndDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                }) : 
                'After period end ✓'
        };
        
        return formatted;
    }
}
