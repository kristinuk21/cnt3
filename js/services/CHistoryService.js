/**
 * CHistoryService (CHarts) - Handles historical chart rendering and data visualization
 * Focuses on historical analysis: period comparisons, long-term patterns, and historical trends
 * Complements ChartService (CharTs) which handles real-time trend data
 */
class CHistoryService {
    constructor(databaseService, dateCalculationService) {
        this.databaseService = databaseService;
        this.dateCalculationService = dateCalculationService;
        this.charts = {};
    }

    /**
     * Initialize all CHarts (history charts) when the CHarts tab is shown
     */
    initializeCharts() {
        this.renderHistoricalBudgetComparison();
        this.renderPeriodSpendingPatterns();
        this.renderLongTermTrends();
        this.renderBudgetEfficiencyHistory();
    }

    /**
     * Render historical budget comparison across multiple periods
     */
    renderHistoricalBudgetComparison() {
        const ctx = document.getElementById('historicalBudgetChart');
        if (!ctx) return;

        // Check if Chart.js is available
        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.historicalBudget) {
            this.charts.historicalBudget.destroy();
        }

        const chartData = this._prepareHistoricalBudgetData();
        
        this.charts.historicalBudget = new ChartConstructor(ctx, {
            type: 'bar',
            data: {
                labels: chartData.periodLabels,
                datasets: [
                    {
                        label: 'Starting Budget',
                        data: chartData.startingBudgets,
                        backgroundColor: 'rgba(23, 162, 184, 0.6)',
                        borderColor: '#17a2b8',
                        borderWidth: 2
                    },
                    {
                        label: 'Final Budget',
                        data: chartData.finalBudgets,
                        backgroundColor: 'rgba(40, 167, 69, 0.6)',
                        borderColor: '#28a745',
                        borderWidth: 2
                    },
                    {
                        label: 'Total Spent',
                        data: chartData.totalSpent,
                        backgroundColor: 'rgba(220, 53, 69, 0.6)',
                        borderColor: '#dc3545',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Math.round(context.parsed.y)} RON`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#e9ecef'
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return value + ' RON';
                            }
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Render period spending patterns
     */
    renderPeriodSpendingPatterns() {
        const ctx = document.getElementById('spendingPatternsChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        if (this.charts.spendingPatterns) {
            this.charts.spendingPatterns.destroy();
        }

        const chartData = this._prepareSpendingPatternsData();
        
        this.charts.spendingPatterns = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Math.round(context.parsed.y * 100) / 100} RON/day`;
                            },
                            title: function(tooltipItems) {
                                const dayNumber = tooltipItems[0].parsed.x + 1;
                                return `Day ${dayNumber} of Period`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Days into Period',
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#e9ecef'
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Daily Spending (RON)',
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return Math.round(value * 100) / 100 + ' RON';
                            }
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Render long-term trends
     */
    renderLongTermTrends() {
        const ctx = document.getElementById('longTermTrendsChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        if (this.charts.longTermTrends) {
            this.charts.longTermTrends.destroy();
        }

        const chartData = this._prepareLongTermTrendsData();
        
        this.charts.longTermTrends = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                labels: chartData.periodLabels,
                datasets: [
                    {
                        label: 'Average Daily Spending',
                        data: chartData.avgDailySpending,
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Budget Utilization %',
                        data: chartData.budgetUtilization,
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#e9ecef'
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Daily Spending (RON)',
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#e9ecef'
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Budget Utilization (%)',
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
    }

    /**
     * Render budget efficiency history
     */
    renderBudgetEfficiencyHistory() {
        const ctx = document.getElementById('budgetEfficiencyChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        if (this.charts.budgetEfficiency) {
            this.charts.budgetEfficiency.destroy();
        }

        const chartData = this._prepareBudgetEfficiencyData();
        
        this.charts.budgetEfficiency = new ChartConstructor(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Budget Efficiency',
                    data: chartData.values,
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',   // Efficient
                        'rgba(255, 193, 7, 0.8)',   // Moderate  
                        'rgba(220, 53, 69, 0.8)',   // Inefficient
                        'rgba(108, 117, 125, 0.8)'  // Incomplete
                    ],
                    borderColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#6c757d'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} periods (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Prepare historical budget comparison data
     * @private
     * @returns {Object} Chart data
     */
    _prepareHistoricalBudgetData() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        const periods = this._getHistoricalPeriods(6); // Last 6 periods
        
        const periodLabels = [];
        const startingBudgets = [];
        const finalBudgets = [];
        const totalSpent = [];

        periods.forEach(period => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[period.month];
            const halfLabel = period.isFirstHalf ? '1st' : '2nd';
            const label = `${monthName} ${period.year} (${halfLabel})`;
            
            periodLabels.push(label);

            // Get budget transactions for this period
            const periodTransactions = budgetHistory.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= period.periodStart && entryDate <= period.periodEnd;
            });

            if (periodTransactions.length > 0) {
                const sortedTransactions = periodTransactions.sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp));
                
                const startingBudget = sortedTransactions[0].amount;
                const finalBudget = sortedTransactions[sortedTransactions.length - 1].amount;
                const spent = startingBudget - finalBudget;

                startingBudgets.push(startingBudget);
                finalBudgets.push(finalBudget);
                totalSpent.push(Math.max(0, spent));
            } else {
                startingBudgets.push(0);
                finalBudgets.push(0);
                totalSpent.push(0);
            }
        });

        return {
            periodLabels,
            startingBudgets,
            finalBudgets,
            totalSpent
        };
    }

    /**
     * Prepare spending patterns data
     * @private
     * @returns {Object} Chart data
     */
    _prepareSpendingPatternsData() {
        const periods = this._getHistoricalPeriods(4);
        const datasets = [];

        const colors = [
            { border: '#28a745', bg: 'rgba(40, 167, 69, 0.1)' },
            { border: '#17a2b8', bg: 'rgba(23, 162, 184, 0.1)' },
            { border: '#ffc107', bg: 'rgba(255, 193, 7, 0.1)' },
            { border: '#dc3545', bg: 'rgba(220, 53, 69, 0.1)' }
        ];

        periods.forEach((period, index) => {
            const spendingData = this._calculateDailySpending(period);
            const color = colors[index % colors.length];
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[period.month];
            const halfLabel = period.isFirstHalf ? '1st' : '2nd';
            const label = `${monthName} ${period.year} (${halfLabel})`;

            datasets.push({
                label: label,
                data: spendingData,
                borderColor: color.border,
                backgroundColor: color.bg,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: false
            });
        });

        return { datasets };
    }

    /**
     * Prepare long-term trends data
     * @private
     * @returns {Object} Chart data
     */
    _prepareLongTermTrendsData() {
        const periods = this._getHistoricalPeriods(8);
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        const periodLabels = [];
        const avgDailySpending = [];
        const budgetUtilization = [];

        periods.forEach(period => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[period.month];
            const halfLabel = period.isFirstHalf ? '1st' : '2nd';
            const shortLabel = `${monthName} ${String(period.year).slice(-2)} (${halfLabel.charAt(0)})`;
            
            periodLabels.push(shortLabel);

            const periodTransactions = budgetHistory.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= period.periodStart && entryDate <= period.periodEnd;
            });

            if (periodTransactions.length > 0) {
                const sortedTransactions = periodTransactions.sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp));
                
                const startingBudget = sortedTransactions[0].amount;
                const finalBudget = sortedTransactions[sortedTransactions.length - 1].amount;
                const totalSpent = Math.max(0, startingBudget - finalBudget);
                
                const periodDays = Math.ceil((period.periodEnd - period.periodStart) / (1000 * 60 * 60 * 24));
                const avgDaily = totalSpent / periodDays;
                const utilization = startingBudget > 0 ? (totalSpent / startingBudget) * 100 : 0;

                avgDailySpending.push(avgDaily);
                budgetUtilization.push(Math.min(100, utilization));
            } else {
                avgDailySpending.push(0);
                budgetUtilization.push(0);
            }
        });

        return {
            periodLabels,
            avgDailySpending,
            budgetUtilization
        };
    }

    /**
     * Prepare budget efficiency data
     * @private
     * @returns {Object} Chart data
     */
    _prepareBudgetEfficiencyData() {
        const periods = this._getHistoricalPeriods(12);
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        let efficient = 0;    // 80-100% budget used
        let moderate = 0;     // 50-79% budget used
        let inefficient = 0;  // 0-49% budget used
        let incomplete = 0;   // No data or incomplete periods

        periods.forEach(period => {
            const periodTransactions = budgetHistory.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= period.periodStart && entryDate <= period.periodEnd;
            });

            if (periodTransactions.length < 2) {
                incomplete++;
                return;
            }

            const sortedTransactions = periodTransactions.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp));
            
            const startingBudget = sortedTransactions[0].amount;
            const finalBudget = sortedTransactions[sortedTransactions.length - 1].amount;
            const utilizationRate = startingBudget > 0 ? 
                ((startingBudget - finalBudget) / startingBudget) * 100 : 0;

            if (utilizationRate >= 80) {
                efficient++;
            } else if (utilizationRate >= 50) {
                moderate++;
            } else {
                inefficient++;
            }
        });

        return {
            labels: ['Efficient (80-100%)', 'Moderate (50-79%)', 'Inefficient (0-49%)', 'Incomplete Data'],
            values: [efficient, moderate, inefficient, incomplete]
        };
    }

    /**
     * Calculate daily spending for a period
     * @private
     * @param {Object} period - Period data
     * @returns {Array} Daily spending data points
     */
    _calculateDailySpending(period) {
        const budgetHistory = this.databaseService.getBudgetHistory();
        const periodTransactions = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= period.periodStart && entryDate <= period.periodEnd;
        });

        if (periodTransactions.length < 2) return [];

        const sortedTransactions = periodTransactions.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp));

        const dailySpending = [];
        
        for (let i = 1; i < sortedTransactions.length; i++) {
            const currentTransaction = sortedTransactions[i];
            const previousTransaction = sortedTransactions[i - 1];
            
            const spent = previousTransaction.amount - currentTransaction.amount;
            if (spent > 0) {
                const currentDate = new Date(currentTransaction.timestamp);
                const dayOfPeriod = Math.floor((currentDate - period.periodStart) / (1000 * 60 * 60 * 24));
                
                dailySpending.push({
                    x: dayOfPeriod,
                    y: spent
                });
            }
        }

        return dailySpending;
    }

    /**
     * Get historical periods data
     * @private
     * @param {number} count - Number of periods to retrieve
     * @returns {Array} Historical periods
     */
    _getHistoricalPeriods(count) {
        const periods = [];
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Determine current position
        let targetMonth = currentMonth;
        let targetYear = currentYear;
        let isFirstHalf;
        
        if (currentDay >= 25) {
            isFirstHalf = false;
        } else if (currentDay >= 10) {
            isFirstHalf = true;
        } else {
            isFirstHalf = false;
            targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        }

        // Get specified number of periods going back
        for (let i = 1; i <= count; i++) {
            if (isFirstHalf) {
                targetMonth = targetMonth === 0 ? 11 : targetMonth - 1;
                targetYear = targetMonth === 11 ? targetYear - 1 : targetYear;
                isFirstHalf = false;
            } else {
                isFirstHalf = true;
            }

            let periodStart, periodEnd;
            
            if (isFirstHalf) {
                periodStart = new Date(targetYear, targetMonth, 10);
                periodEnd = new Date(targetYear, targetMonth, 25);
            } else {
                periodStart = new Date(targetYear, targetMonth, 25);
                const nextMonth = targetMonth === 11 ? 0 : targetMonth + 1;
                const nextYear = targetMonth === 11 ? targetYear + 1 : targetYear;
                periodEnd = new Date(nextYear, nextMonth, 10);
            }

            periods.push({
                periodStart,
                periodEnd,
                isFirstHalf,
                month: targetMonth,
                year: targetYear
            });
        }

        return periods.reverse(); // Return oldest to newest
    }

    /**
     * Update charts with new data
     */
    updateCharts() {
        if (this.charts.historicalBudget) {
            this.renderHistoricalBudgetComparison();
        }
        
        if (this.charts.spendingPatterns) {
            this.renderPeriodSpendingPatterns();
        }
        
        if (this.charts.longTermTrends) {
            this.renderLongTermTrends();
        }
        
        if (this.charts.budgetEfficiency) {
            this.renderBudgetEfficiencyHistory();
        }
    }

    /**
     * Cleanup charts on application cleanup
     */
    cleanup() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}