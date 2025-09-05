/**
 * ChartService - Handles chart rendering and data visualization
 * Follows Single Responsibility Principle - only responsible for chart operations
 */
class ChartService {
    constructor(databaseService, dateCalculationService) {
        this.databaseService = databaseService;
        this.dateCalculationService = dateCalculationService;
        this.charts = {};
    }

    /**
     * Initialize all charts when the charts tab is shown
     */
    initializeCharts() {
        this.renderBudgetChart();
        this.renderTrendsChart();
    }

    /**
     * Render budget burndown chart
     */
    renderBudgetChart() {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;

        // Check if Chart.js is available
        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.budget) {
            this.charts.budget.destroy();
        }

        const chartData = this._prepareBudgetData();
        
        this.charts.budget = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Projected Budget',
                        data: chartData.projected,
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        tension: 0.1,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'Actual Budget',
                        data: chartData.actual,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1,
                        spanGaps: true, // Connect points across null values
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        showLine: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9ecef'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: function(context) {
                                // Color weekend days differently
                                const index = context.index;
                                const date = new Date(chartData.periodStart);
                                date.setDate(chartData.periodStart.getDate() + index);
                                const dayOfWeek = date.getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? '#ff6b6b' : '#e9ecef';
                            }
                        },
                        grid: {
                            color: function(context) {
                                // Different grid color for weekend days
                                const index = context.index;
                                const date = new Date(chartData.periodStart);
                                date.setDate(chartData.periodStart.getDate() + index);
                                const dayOfWeek = date.getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? 'rgba(255, 107, 107, 0.3)' : 'rgba(233, 236, 239, 0.2)';
                            }
                        }
                    },
                    y: {
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
     * Render daily trends chart
     */
    renderTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        // Check if Chart.js is available
        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const chartData = this._prepareTrendsData();
        
        this.charts.trends = new ChartConstructor(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Early Starts',
                        data: chartData.earlyStarts,
                        backgroundColor: '#ffc107',
                        borderColor: '#ffc107',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointStyle: 'line'
                    },
                    {
                        label: 'Page Reloads',
                        data: chartData.pageReloads,
                        backgroundColor: '#6c757d',
                        borderColor: '#6c757d',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointStyle: 'line'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9ecef'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const hours = Math.floor(context.parsed.y / 60);
                                const minutes = context.parsed.y % 60;
                                const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                return `${context.dataset.label}: ${timeStr}`;
                            },
                            title: function(tooltipItems) {
                                const date = new Date(tooltipItems[0].parsed.x);
                                return date.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM dd'
                            }
                        },
                        ticks: {
                            color: function(context) {
                                // Color weekend days differently for trends chart
                                const timestamp = context.tick.value;
                                const date = new Date(timestamp);
                                const dayOfWeek = date.getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? '#ff6b6b' : '#e9ecef';
                            }
                        },
                        grid: {
                            color: function(context) {
                                // Different grid color for weekend days in trends chart
                                const timestamp = context.tick.value;
                                const date = new Date(timestamp);
                                const dayOfWeek = date.getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? 'rgba(255, 107, 107, 0.3)' : 'rgba(233, 236, 239, 0.2)';
                            }
                        }
                    },
                    y: {
                        min: 6 * 60, // Start at 6:00 AM (360 minutes)
                        max: 24 * 60, // 24 hours in minutes
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                const hours = Math.floor(value / 60);
                                const minutes = value % 60;
                                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            },
                            stepSize: 60 // Show tick every hour
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        },
                        title: {
                            display: true,
                            text: 'Time of Day',
                            color: '#e9ecef'
                        }
                    }
                }
            }
        });
    }

    /**
     * Prepare budget burndown chart data
     * @private
     * @returns {Object} Chart data
     */
    _prepareBudgetData() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        const currentBudget = this.databaseService.getCurrentBudget();
        
        // Get proper period dates
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        
        // Parse start and end dates
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Calculate total days in period
        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        const now = new Date();
        const todayIndex = Math.floor((now - periodStart) / (1000 * 60 * 60 * 24));
        
        const labels = [];
        const projected = [];
        const actual = [];
        
        // Generate dates for the entire period
        for (let i = 0; i <= totalDays; i++) {
            const date = new Date(periodStart);
            date.setDate(periodStart.getDate() + i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Initialize actual array with nulls
        for (let i = 0; i <= totalDays; i++) {
            actual[i] = null;
        }

        // Add actual budget data points from history
        budgetHistory.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0); // Normalize to start of day
            
            const dayIndex = Math.floor((entryDate - periodStart) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex <= totalDays) {
                actual[dayIndex] = entry.amount;
            }
        });

        // Set today's budget as a known point
        if (todayIndex >= 0 && todayIndex <= totalDays) {
            actual[todayIndex] = currentBudget;
        }

        // Create projected line based on current budget and remaining days
        const remainingDays = Math.max(1, totalDays - todayIndex);
        const dailySpendRate = currentBudget / remainingDays;

        for (let i = 0; i <= totalDays; i++) {
            if (i <= todayIndex) {
                // Backward projection: assume linear spending from unknown start to current budget
                const daysFromStart = todayIndex;
                if (daysFromStart > 0) {
                    // Estimate original budget based on current position and current budget
                    const estimatedOriginalBudget = currentBudget / (remainingDays / totalDays);
                    const dailySpendFromStart = (estimatedOriginalBudget - currentBudget) / daysFromStart;
                    projected[i] = Math.max(0, estimatedOriginalBudget - (dailySpendFromStart * i));
                } else {
                    projected[i] = currentBudget;
                }
            } else {
                // Forward projection: linear spending to zero
                const daysFromToday = i - todayIndex;
                projected[i] = Math.max(0, currentBudget - (dailySpendRate * daysFromToday));
            }
        }

        // Fill forward actual values where we have data
        let lastKnownValue = null;
        for (let i = 0; i <= totalDays; i++) {
            if (actual[i] !== null) {
                lastKnownValue = actual[i];
            } else if (lastKnownValue !== null && i < todayIndex) {
                // For past days without data, carry forward last known value
                actual[i] = lastKnownValue;
            }
            // Leave future days as null (no data available)
        }

        // Debug logging
        console.log('Budget Chart Data:', {
            totalDays,
            todayIndex,
            currentBudget,
            periodStart: periodStart.toLocaleDateString(),
            periodEnd: periodEnd.toLocaleDateString(),
            actualData: actual.map((val, idx) => ({ day: idx, value: val })).filter(item => item.value !== null)
        });

        return { labels, projected, actual, periodStart };
    }

    /**
     * Prepare daily trends chart data
     * @private
     * @returns {Object} Chart data
     */
    _prepareTrendsData() {
        const logs = this.databaseService.getLogs();
        const earlyStarts = [];
        const pageReloads = [];
        
        // Create a map to track unique early starts per day
        const earlyStartMap = new Map();
        
        logs.forEach(log => {
            const timestamp = new Date(log.timestamp);
            
            // Create date key for grouping by day (YYYY-MM-DD format)
            const dateKey = timestamp.toISOString().split('T')[0];
            const dateValue = new Date(dateKey + 'T00:00:00.000Z');
            
            if (log.message.includes('Started day early') || log.message.includes('Day started early')) {
                // For early starts, use the actual time as Y value
                const timeInMinutes = timestamp.getHours() * 60 + timestamp.getMinutes();
                
                // Only keep the earliest start time for each day
                if (!earlyStartMap.has(dateKey) || timeInMinutes < earlyStartMap.get(dateKey).timeInMinutes) {
                    earlyStartMap.set(dateKey, {
                        x: dateValue.getTime(),
                        y: timeInMinutes,
                        timeInMinutes: timeInMinutes,
                        originalTimestamp: timestamp
                    });
                }
            } else if (log.message.includes('Page reloaded')) {
                // For page reloads, show all occurrences
                const timeInMinutes = timestamp.getHours() * 60 + timestamp.getMinutes();
                pageReloads.push({
                    x: dateValue.getTime(),
                    y: timeInMinutes,
                    originalTimestamp: timestamp
                });
            }
        });

        // Convert early starts map to array
        earlyStartMap.forEach(value => {
            earlyStarts.push({
                x: value.x,
                y: value.y
            });
        });

        return { earlyStarts, pageReloads };
    }

    /**
     * Update charts with new data
     */
    updateCharts() {
        if (this.charts.budget) {
            const budgetData = this._prepareBudgetData();
            this.charts.budget.data.labels = budgetData.labels;
            this.charts.budget.data.datasets[0].data = budgetData.projected;
            this.charts.budget.data.datasets[1].data = budgetData.actual;
            this.charts.budget.update();
        }

        if (this.charts.trends) {
            const trendsData = this._prepareTrendsData();
            this.charts.trends.data.datasets[0].data = trendsData.earlyStarts;
            this.charts.trends.data.datasets[1].data = trendsData.pageReloads;
            this.charts.trends.update();
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