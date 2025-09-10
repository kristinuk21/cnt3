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
        this.renderBudgetPerDayTrendsChart();
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
                            color: '#e9ecef',
                            usePointStyle: true
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
                            color: '#e9ecef',
                            usePointStyle: true
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
                        }
                    }
                }
            }
        });
    }

    /**
     * Render budget per day trends chart with smoothing
     */
    renderBudgetPerDayTrendsChart() {
        const ctx = document.getElementById('budgetPerDayTrendsChart');
        if (!ctx) return;

        // Check if Chart.js is available
        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.budgetPerDayTrends) {
            this.charts.budgetPerDayTrends.destroy();
        }

        const chartData = this._prepareBudgetPerDayTrendsData();
        
        this.charts.budgetPerDayTrends = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Raw Data',
                        data: chartData.rawData,
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        tension: 0,
                        borderWidth: 2,
                        pointBackgroundColor: '#ffc107'
                    },
                    {
                        label: '7-day Average',
                        data: chartData.smoothedData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#28a745'
                    },
                    {
                        label: 'Trend Line',
                        data: chartData.trendLine,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.05)',
                        pointRadius: 0,
                        tension: 0,
                        borderWidth: 2,
                        borderDash: [8, 4],
                        fill: false
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
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${Math.round(value)} RON/day`;
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
                                // Color weekend days differently
                                const timestamp = context.tick.value;
                                const date = new Date(timestamp);
                                const dayOfWeek = date.getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? '#ff6b6b' : '#e9ecef';
                            }
                        },
                        grid: {
                            color: function(context) {
                                // Different grid color for weekend days
                                const timestamp = context.tick.value;
                                const date = new Date(timestamp);
                                const dayOfWeek = date.getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? 'rgba(255, 107, 107, 0.3)' : 'rgba(233, 236, 239, 0.2)';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#e9ecef'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return Math.round(value) + ' RON/day';
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
     * Prepare budget per day trends chart data with smoothing and trend analysis
     * @private
     * @returns {Object} Chart data
     */
    _prepareBudgetPerDayTrendsData() {
        const logs = this.databaseService.getLogs();
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Extract budget per day calculations from logs and budget history
        const budgetPerDayData = [];
        const budgetPerDayMap = new Map();
        
        // Method 1: Extract from logs that contain budget per day mentions
        logs.forEach(log => {
            const timestamp = new Date(log.timestamp);
            const dateKey = timestamp.toISOString().split('T')[0];
            
            // Look for budget-related log entries
            if (log.message.includes('Budget') && log.message.includes('RON')) {
                // Try to extract budget amount from log message
                const budgetMatch = log.message.match(/(\d+(?:\.\d+)?)\s*RON/);
                if (budgetMatch) {
                    const budgetAmount = parseFloat(budgetMatch[1]);
                    
                    // Calculate budget per day for this timestamp
                    const remainingDays = this._calculateRemainingDaysForDate(timestamp);
                    const budgetPerDay = remainingDays > 0 ? budgetAmount / remainingDays : 0;
                    
                    if (budgetPerDay > 0) {
                        budgetPerDayMap.set(dateKey, {
                            x: timestamp.getTime(),
                            y: budgetPerDay,
                            date: timestamp
                        });
                    }
                }
            }
        });
        
        // Method 2: Calculate from budget history
        budgetHistory.forEach(entry => {
            const timestamp = new Date(entry.timestamp);
            const dateKey = timestamp.toISOString().split('T')[0];
            
            if (!budgetPerDayMap.has(dateKey)) {
                const remainingDays = this._calculateRemainingDaysForDate(timestamp);
                const budgetPerDay = remainingDays > 0 ? entry.amount / remainingDays : 0;
                
                if (budgetPerDay > 0) {
                    budgetPerDayMap.set(dateKey, {
                        x: timestamp.getTime(),
                        y: budgetPerDay,
                        date: timestamp
                    });
                }
            }
        });
        
        // Method 3: Add today's current budget per day calculation
        const currentBudget = this.databaseService.getCurrentBudget();
        const currentRemainingDays = this.dateCalculationService.computeRemainingDaysUntilNextEnd();
        const currentBudgetPerDay = currentRemainingDays > 0 ? currentBudget / currentRemainingDays : 0;
        
        if (currentBudgetPerDay > 0) {
            const today = new Date();
            const todayKey = today.toISOString().split('T')[0];
            
            // Always add/update today's data to ensure current budget per day is shown
            budgetPerDayMap.set(todayKey, {
                x: today.getTime(),
                y: currentBudgetPerDay,
                date: today
            });
        }
        
        // Convert map to sorted array
        const rawDataPoints = Array.from(budgetPerDayMap.values()).sort((a, b) => a.x - b.x);
        
        // Generate smoothed data using 7-day moving average
        const smoothedDataPoints = this._calculateMovingAverage(rawDataPoints, 7);
        
        // Calculate trend line using linear regression
        const trendLinePoints = this._calculateTrendLine(rawDataPoints);
        
        return {
            rawData: rawDataPoints,
            smoothedData: smoothedDataPoints,
            trendLine: trendLinePoints
        };
    }

    /**
     * Calculate remaining days for a specific date
     * @private
     * @param {Date} date - The date to calculate for
     * @returns {number} Remaining days
     */
    _calculateRemainingDaysForDate(date) {
        // Use the same logic as DateCalculationService but for a specific date
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        
        const daysDiff = Math.ceil((endDate - date) / (1000 * 60 * 60 * 24));
        return Math.max(0, daysDiff);
    }

    /**
     * Calculate moving average for smoothing
     * @private
     * @param {Array} dataPoints - Array of data points {x, y}
     * @param {number} windowSize - Size of moving average window
     * @returns {Array} Smoothed data points
     */
    _calculateMovingAverage(dataPoints, windowSize = 7) {
        if (dataPoints.length < windowSize) return dataPoints;
        
        const smoothedData = [];
        
        for (let i = 0; i < dataPoints.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(dataPoints.length, start + windowSize);
            
            const windowData = dataPoints.slice(start, end);
            const average = windowData.reduce((sum, point) => sum + point.y, 0) / windowData.length;
            
            smoothedData.push({
                x: dataPoints[i].x,
                y: average
            });
        }
        
        return smoothedData;
    }

    /**
     * Calculate trend line using linear regression
     * @private
     * @param {Array} dataPoints - Array of data points {x, y}
     * @returns {Array} Trend line points
     */
    _calculateTrendLine(dataPoints) {
        if (dataPoints.length < 2) return [];
        
        const n = dataPoints.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        // Convert timestamps to days for easier calculation
        const firstTimestamp = dataPoints[0].x;
        
        dataPoints.forEach(point => {
            const x = (point.x - firstTimestamp) / (1000 * 60 * 60 * 24); // Convert to days
            const y = point.y;
            
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });
        
        // Calculate linear regression coefficients
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Generate trend line points
        const trendPoints = [];
        const startX = (dataPoints[0].x - firstTimestamp) / (1000 * 60 * 60 * 24);
        const endX = (dataPoints[dataPoints.length - 1].x - firstTimestamp) / (1000 * 60 * 60 * 24);
        
        trendPoints.push({
            x: dataPoints[0].x,
            y: slope * startX + intercept
        });
        
        trendPoints.push({
            x: dataPoints[dataPoints.length - 1].x,
            y: slope * endX + intercept
        });
        
        return trendPoints;
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

        if (this.charts.budgetPerDayTrends) {
            const budgetPerDayData = this._prepareBudgetPerDayTrendsData();
            this.charts.budgetPerDayTrends.data.datasets[0].data = budgetPerDayData.rawData;
            this.charts.budgetPerDayTrends.data.datasets[1].data = budgetPerDayData.smoothedData;
            this.charts.budgetPerDayTrends.data.datasets[2].data = budgetPerDayData.trendLine;
            this.charts.budgetPerDayTrends.update();
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