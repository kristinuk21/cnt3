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
        this.renderBudgetPerDayProjectedVsActualChart();
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
        
        // Create datasets starting with historical periods
        const datasets = [];
        
        // Check if we have meaningful data to display
        const hasActualData = chartData.actual.some(val => val !== null);
        const hasProjectedData = chartData.projected.some(val => val !== null);
        
        // Add previous periods datasets (oldest to newest) - only if we have current period data
        if (chartData.previousPeriodsData && chartData.previousPeriodsData.length > 0 && (hasActualData || hasProjectedData)) {
            // Sort by period index (oldest first)
            const sortedPreviousPeriods = chartData.previousPeriodsData.sort((a, b) => b.periodIndex - a.periodIndex);
            
            sortedPreviousPeriods.forEach((periodData, index) => {
                const periodIndex = periodData.periodIndex;
                const opacity = Math.max(0.15, 0.8 - (periodIndex - 1) * 0.2); // Fade older periods
                const lineWidth = Math.max(1, 4 - periodIndex); // Thinner lines for older periods
                
                // Generate period label
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[periodData.month];
                const halfLabel = periodData.isFirstHalf ? '1st' : '2nd';
                const label = `${monthName} ${periodData.year} (${halfLabel} half)`;
                
                datasets.push({
                    label: label,
                    data: periodData.data,
                    borderColor: `rgba(108, 117, 125, ${opacity})`, // Gray with varying opacity
                    backgroundColor: 'transparent',
                    tension: 0.1,
                    borderWidth: lineWidth,
                    pointRadius: 0, // No points for historical data
                    pointHoverRadius: 0,
                    spanGaps: true,
                    order: 10 + periodIndex, // Higher order number = rendered behind
                });
            });
        }
        
        // Add current period datasets (on top) - only if we have data
        if (hasProjectedData) {
            datasets.push({
                label: 'Projected Budget',
                data: chartData.projected,
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                tension: 0.1,
                borderDash: [5, 5],
                borderWidth: 2,
                order: 2 // Rendered on top
            });
        }
        
        if (hasActualData) {
            datasets.push({
                label: 'Actual Budget',
                data: chartData.actual,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.1,
                spanGaps: true, // Connect points across null values
                pointRadius: 5,
                pointHoverRadius: 8,
                showLine: true,
                borderWidth: 3,
                order: 1 // Rendered on top
            });
        }
        
        // If no meaningful data, show a placeholder message
        if (!hasActualData && !hasProjectedData) {
            datasets.push({
                label: 'No budget data for current period',
                data: [], // Empty data
                borderColor: '#6c757d',
                backgroundColor: 'transparent',
                tension: 0.1,
                pointRadius: 0,
                showLine: false,
                order: 1
            });
        }
        
        this.charts.budget = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: datasets
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
     * Render budget per day projected vs actual chart
     */
    renderBudgetPerDayProjectedVsActualChart() {
        const ctx = document.getElementById('budgetPerDayProjectedVsActualChart');
        if (!ctx) return;

        // Check if Chart.js is available
        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        // Destroy existing chart if it exists
        if (this.charts.budgetPerDayProjectedVsActual) {
            this.charts.budgetPerDayProjectedVsActual.destroy();
        }

        const chartData = this._prepareBudgetPerDayProjectedVsActualData();
        
        // Create datasets starting with historical periods
        const datasets = [];
        
        // Check if we have meaningful data to display
        const hasActualData = chartData.actualData.length > 0;
        const hasProjectedData = chartData.projectedData.length > 0;
        
        // Add previous periods datasets (oldest to newest) - only if we have current period data
        if (chartData.previousPeriodsData && chartData.previousPeriodsData.length > 0 && (hasActualData || hasProjectedData)) {
            // Sort by period index (oldest first)
            const sortedPreviousPeriods = chartData.previousPeriodsData.sort((a, b) => b.periodIndex - a.periodIndex);
            
            sortedPreviousPeriods.forEach((periodData, index) => {
                const periodIndex = periodData.periodIndex;
                const opacity = Math.max(0.15, 0.6 - (periodIndex - 1) * 0.15); // Fade older periods
                const lineWidth = Math.max(1, 3 - periodIndex); // Thinner lines for older periods
                
                // Generate period label
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[periodData.month];
                const halfLabel = periodData.isFirstHalf ? '1st' : '2nd';
                const label = `${monthName} ${periodData.year} (${halfLabel} half)`;
                
                datasets.push({
                    label: label,
                    data: periodData.actualData,
                    borderColor: `rgba(108, 117, 125, ${opacity})`, // Gray with varying opacity
                    backgroundColor: 'transparent',
                    tension: 0.1,
                    borderWidth: lineWidth,
                    pointRadius: 0, // No points for historical data
                    pointHoverRadius: 0,
                    spanGaps: true,
                    order: 10 + periodIndex, // Higher order number = rendered behind
                    fill: false
                });
            });
        }
        
        // Add current period datasets (on top) - only if we have data
        if (hasProjectedData) {
            datasets.push({
                label: 'Projected Budget/Day',
                data: chartData.projectedData,
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.1,
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: '#17a2b8',
                fill: false,
                order: 2 // Rendered on top
            });
        }
        
        if (hasActualData) {
            datasets.push({
                label: 'Actual Budget/Day',
                data: chartData.actualData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                pointRadius: 4,
                pointHoverRadius: 8,
                tension: 0.2,
                borderWidth: 3,
                pointBackgroundColor: '#28a745',
                fill: false,
                order: 1 // Rendered on top
            });
        }
        
        // If no meaningful data, show a placeholder message
        if (!hasActualData && !hasProjectedData) {
            datasets.push({
                label: 'No budget data for current period',
                data: [], // Empty data
                borderColor: '#6c757d',
                backgroundColor: 'transparent',
                tension: 0.1,
                pointRadius: 0,
                showLine: false,
                order: 1
            });
        }
        
        this.charts.budgetPerDayProjectedVsActual = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                datasets: datasets
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
                                return `${context.dataset.label}: ${Math.round(value * 100) / 100} RON/day`;
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
                                return Math.round(value * 100) / 100 + ' RON/day';
                            }
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        },
                        title: {
                            display: true,
                            text: 'Budget per Day (RON)',
                            color: '#e9ecef'
                        }
                    }
                }
            }
        });
    }

    /**
     * Prepare budget per day projected vs actual chart data
     * @private
     * @returns {Object} Chart data
     */
    _prepareBudgetPerDayProjectedVsActualData() {
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
        
        const projectedData = [];
        const actualData = [];
        
        // Filter budget history to current period
        const currentPeriodBudgetHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);
            
            const periodStartNorm = new Date(periodStart);
            periodStartNorm.setHours(0, 0, 0, 0);
            
            const periodEndNorm = new Date(periodEnd);
            periodEndNorm.setHours(23, 59, 59, 999);
            
            return entryDate >= periodStartNorm && entryDate <= periodEndNorm;
        });
        
        // Create a map for actual budget per day calculations
        const actualBudgetPerDayMap = new Map();
        
        // Calculate actual budget per day for each transaction
        currentPeriodBudgetHistory.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            const dateKey = entryDate.toISOString().split('T')[0];
            
            // Calculate remaining days from this transaction date
            const remainingDaysFromEntry = this._calculateRemainingDaysForDate(entryDate);
            const budgetPerDayAtEntry = remainingDaysFromEntry > 0 ? entry.amount / remainingDaysFromEntry : 0;
            
            actualBudgetPerDayMap.set(dateKey, {
                x: entryDate.getTime(),
                y: budgetPerDayAtEntry,
                budgetAmount: entry.amount,
                remainingDays: remainingDaysFromEntry
            });
        });
        
        // Convert actual data to array
        Array.from(actualBudgetPerDayMap.values()).forEach(data => {
            actualData.push({
                x: data.x,
                y: data.y
            });
        });
        
        // Sort actual data by date
        actualData.sort((a, b) => a.x - b.x);
        
        // Calculate projected budget per day for comparison
        // This shows what the ideal budget per day should have been at each point
        for (let i = 0; i <= totalDays; i++) {
            const date = new Date(periodStart);
            date.setDate(periodStart.getDate() + i);
            
            // Skip future dates beyond today
            if (date > now) continue;
            
            const remainingDaysFromThisDate = Math.max(1, totalDays - i);
            
            // For projected line, assume the current budget was available from the start
            // and calculate what the daily rate should have been from each day
            const projectedBudgetPerDay = currentBudget / remainingDaysFromThisDate;
            
            projectedData.push({
                x: date.getTime(),
                y: projectedBudgetPerDay
            });
        }
        
        console.log('Budget Per Day Projected vs Actual Chart Data:', {
            periodStart: periodStart.toLocaleDateString(),
            periodEnd: periodEnd.toLocaleDateString(),
            currentBudget,
            totalDays,
            todayIndex,
            actualDataPoints: actualData.length,
            projectedDataPoints: projectedData.length,
            actualValues: actualData.map(d => ({ date: new Date(d.x).toLocaleDateString(), value: d.y })),
            projectedValues: projectedData.slice(0, 5).map(d => ({ date: new Date(d.x).toLocaleDateString(), value: d.y }))
        });
        
        // Get previous periods data for comparison
        let previousPeriodsData = [];
        if (actualData.length > 0 || projectedData.length > 0) {
            const previousPeriods = this._getPreviousPeriodsData(3);
            
            // Transform previous periods to current timeline and calculate budget per day
            const currentPeriodData = { periodStart, periodEnd };
            
            previousPeriods.forEach(prevPeriod => {
                const previousPeriodBudgetPerDayData = this._calculatePreviousPeriodBudgetPerDay(prevPeriod, currentPeriodData);
                if (previousPeriodBudgetPerDayData.length > 0) {
                    previousPeriodsData.push({
                        actualData: previousPeriodBudgetPerDayData,
                        periodIndex: prevPeriod.periodIndex,
                        month: prevPeriod.month,
                        year: prevPeriod.year,
                        isFirstHalf: prevPeriod.isFirstHalf
                    });
                }
            });
        }
        
        return {
            projectedData,
            actualData,
            previousPeriodsData
        };
    }

    /**
     * Calculate budget per day data for a previous period and map to current timeline
     * @private
     * @param {Object} previousPeriod - Previous period data
     * @param {Object} currentPeriod - Current period data
     * @returns {Array} Budget per day data points mapped to current timeline
     */
    _calculatePreviousPeriodBudgetPerDay(previousPeriod, currentPeriod) {
        const { budgetHistory, periodStart: prevStart, periodEnd: prevEnd } = previousPeriod;
        const { periodStart: currStart, periodEnd: currEnd } = currentPeriod;
        
        // Calculate period lengths
        const prevPeriodDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24));
        const currPeriodDays = Math.ceil((currEnd - currStart) / (1000 * 60 * 60 * 24));
        
        // Create budget per day data for previous period
        const prevBudgetPerDayData = [];
        
        // Calculate budget per day for each transaction in the previous period
        budgetHistory.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            const dayIndex = Math.floor((entryDate - prevStart) / (1000 * 60 * 60 * 24));
            
            if (dayIndex >= 0 && dayIndex <= prevPeriodDays) {
                // Calculate remaining days from this transaction date in the previous period
                const remainingDaysFromEntry = Math.max(1, prevPeriodDays - dayIndex);
                const budgetPerDayAtEntry = entry.amount / remainingDaysFromEntry;
                
                prevBudgetPerDayData.push({
                    dayIndex: dayIndex,
                    budgetPerDay: budgetPerDayAtEntry,
                    timestamp: entryDate.getTime()
                });
            }
        });
        
        // Sort by day index
        prevBudgetPerDayData.sort((a, b) => a.dayIndex - b.dayIndex);
        
        // Transform to current period timeline
        const transformedData = [];
        
        prevBudgetPerDayData.forEach(data => {
            // Map previous period day to current period timeline
            const progress = data.dayIndex / prevPeriodDays; // 0 to 1
            const currentDayIndex = Math.floor(progress * currPeriodDays);
            
            // Calculate the corresponding date in current period
            const currentDate = new Date(currStart);
            currentDate.setDate(currStart.getDate() + currentDayIndex);
            
            // Only include if it's not in the future
            if (currentDate <= new Date()) {
                transformedData.push({
                    x: currentDate.getTime(),
                    y: data.budgetPerDay
                });
            }
        });
        
        return transformedData;
    }

    /**
     * Get previous periods data for burndown comparison
     * @private
     * @param {number} periodsCount - Number of previous periods to retrieve (default: 3)
     * @returns {Array} Array of previous period data
     */
    _getPreviousPeriodsData(periodsCount = 3) {
        const budgetHistory = this.databaseService.getBudgetHistory();
        const periods = [];
        
        // Calculate previous periods
        for (let i = 1; i <= periodsCount; i++) {
            const periodData = this._calculatePreviousPeriod(i);
            if (periodData) {
                // Filter budget history for this period
                const periodBudgetHistory = budgetHistory.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return entryDate >= periodData.periodStart && entryDate <= periodData.periodEnd;
                });
                
                if (periodBudgetHistory.length > 0) {
                    periods.push({
                        ...periodData,
                        budgetHistory: periodBudgetHistory,
                        periodIndex: i
                    });
                }
            }
        }
        
        return periods;
    }

    /**
     * Calculate period dates for a previous period
     * @private
     * @param {number} periodsBack - How many periods back (1 = last period, 2 = two periods ago, etc.)
     * @returns {Object|null} Period data with start and end dates
     */
    _calculatePreviousPeriod(periodsBack) {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Calculate how many periods to go back from current period
        let targetMonth = currentMonth;
        let targetYear = currentYear;
        let isFirstHalf;
        
        // Determine current period position
        if (currentDay >= CONFIG.PERIODS.SECOND_DAY) {
            // In second half of current month (25th onwards)
            isFirstHalf = false;
        } else if (currentDay >= CONFIG.PERIODS.FIRST_DAY) {
            // In first half of current month (10th to 24th)
            isFirstHalf = true;
        } else {
            // Before first day (1st to 9th), so we're in previous month's second half
            isFirstHalf = false;
            targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        }
        
        // Go back the specified number of periods
        for (let i = 0; i < periodsBack; i++) {
            if (isFirstHalf) {
                // Currently first half, go to previous month's second half
                targetMonth = targetMonth === 0 ? 11 : targetMonth - 1;
                targetYear = targetMonth === 11 ? targetYear - 1 : targetYear;
                isFirstHalf = false;
            } else {
                // Currently second half, go to same month's first half
                isFirstHalf = true;
            }
        }
        
        // Calculate period start and end dates
        let periodStart, periodEnd;
        
        if (isFirstHalf) {
            // First half: 10th to 25th
            periodStart = new Date(targetYear, targetMonth, CONFIG.PERIODS.FIRST_DAY);
            periodEnd = new Date(targetYear, targetMonth, CONFIG.PERIODS.SECOND_DAY);
        } else {
            // Second half: 25th to 10th of next month
            periodStart = new Date(targetYear, targetMonth, CONFIG.PERIODS.SECOND_DAY);
            const nextMonth = targetMonth === 11 ? 0 : targetMonth + 1;
            const nextYear = targetMonth === 11 ? targetYear + 1 : targetYear;
            periodEnd = new Date(nextYear, nextMonth, CONFIG.PERIODS.FIRST_DAY);
        }
        
        // Adjust for working days
        const periodStartStr = this.dateCalculationService.findFirstWorkingDayOnOrAfter(periodStart);
        const periodEndStr = this.dateCalculationService.findFirstWorkingDayOnOrAfter(periodEnd);
        
        const [startMonth, startDay, startYear] = periodStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = periodEndStr.split('/').map(Number);
        
        return {
            periodStart: new Date(startYear, startMonth - 1, startDay),
            periodEnd: new Date(endYear, endMonth - 1, endDay),
            isFirstHalf,
            month: targetMonth,
            year: targetYear
        };
    }

    /**
     * Transform previous period data to current period timeline
     * @private
     * @param {Object} previousPeriod - Previous period data
     * @param {Object} currentPeriod - Current period data
     * @returns {Array} Transformed budget data aligned to current period
     */
    _transformPreviousPeriodToCurrentTimeline(previousPeriod, currentPeriod) {
        const { budgetHistory, periodStart: prevStart, periodEnd: prevEnd } = previousPeriod;
        const { periodStart: currStart, periodEnd: currEnd } = currentPeriod;
        
        // Calculate period lengths
        const prevPeriodDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24));
        const currPeriodDays = Math.ceil((currEnd - currStart) / (1000 * 60 * 60 * 24));
        
        // Create budget data for previous period
        const prevActual = [];
        for (let i = 0; i <= prevPeriodDays; i++) {
            prevActual[i] = null;
        }
        
        // Fill in actual budget data
        budgetHistory.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0);
            
            const dayIndex = Math.floor((entryDate - prevStart) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex <= prevPeriodDays) {
                prevActual[dayIndex] = entry.amount;
            }
        });
        
        // Fill forward missing values
        let lastKnownValue = null;
        for (let i = 0; i <= prevPeriodDays; i++) {
            if (prevActual[i] !== null) {
                lastKnownValue = prevActual[i];
            } else if (lastKnownValue !== null) {
                prevActual[i] = lastKnownValue;
            }
        }
        
        // Transform to current period timeline (shift so both end at the same point)
        const transformedData = [];
        for (let i = 0; i <= currPeriodDays; i++) {
            // Map current period day to previous period day
            const progress = i / currPeriodDays; // 0 to 1
            const prevDayIndex = Math.floor(progress * prevPeriodDays);
            
            if (prevDayIndex >= 0 && prevDayIndex < prevActual.length && prevActual[prevDayIndex] !== null) {
                transformedData[i] = prevActual[prevDayIndex];
            } else {
                transformedData[i] = null;
            }
        }
        
        return transformedData;
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

        // Filter budget history to only include entries from the current period
        const currentPeriodBudgetHistory = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            // Normalize all dates to start of day for accurate comparison
            entryDate.setHours(0, 0, 0, 0);
            
            const periodStartNorm = new Date(periodStart);
            periodStartNorm.setHours(0, 0, 0, 0);
            
            const periodEndNorm = new Date(periodEnd);
            periodEndNorm.setHours(23, 59, 59, 999); // Include the entire end day
            
            const isInPeriod = entryDate >= periodStartNorm && entryDate <= periodEndNorm;
            
            // Debug logging for each entry
            console.log('Budget History Entry:', {
                timestamp: entry.timestamp,
                entryDate: entryDate.toLocaleDateString(),
                amount: entry.amount,
                action: entry.action,
                periodStart: periodStartNorm.toLocaleDateString(),
                periodEnd: periodEndNorm.toLocaleDateString(),
                isInPeriod: isInPeriod
            });
            
            return isInPeriod;
        });

        // Add actual budget data points from current period history only
        // For each day, use the LATEST budget transaction amount for that day
        const dailyBudgetMap = new Map();
        
        currentPeriodBudgetHistory.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            entryDate.setHours(0, 0, 0, 0); // Normalize to start of day
            
            const dayIndex = Math.floor((entryDate - periodStart) / (1000 * 60 * 60 * 24));
            const dateKey = entryDate.toISOString().split('T')[0];
            
            console.log('Processing budget entry:', {
                timestamp: entry.timestamp,
                entryDate: entryDate.toLocaleDateString(),
                amount: entry.amount,
                action: entry.action,
                dayIndex: dayIndex,
                dateKey: dateKey
            });
            
            if (dayIndex >= 0 && dayIndex <= totalDays) {
                // Keep track of the latest (highest ID) transaction for each day
                if (!dailyBudgetMap.has(dayIndex) || entry.id > dailyBudgetMap.get(dayIndex).id) {
                    dailyBudgetMap.set(dayIndex, {
                        amount: entry.amount,
                        id: entry.id,
                        timestamp: entry.timestamp,
                        dayIndex: dayIndex
                    });
                }
            }
        });
        
        // Set the actual values using the latest transaction for each day
        dailyBudgetMap.forEach((data, dayIndex) => {
            actual[dayIndex] = data.amount;
            console.log(`Set actual[${dayIndex}] = ${data.amount} (latest transaction: ID ${data.id})`);
        });

        // Don't automatically add today's budget as a data point unless there was an actual transaction today
        // The chart should only show actual budget transactions from the database

        // Create projected line - only show meaningful projections
        const remainingDays = Math.max(1, totalDays - todayIndex);
        
        // Check if we have any actual budget transactions in the current period
        const hasCurrentPeriodData = currentPeriodBudgetHistory.length > 0;
        
        if (hasCurrentPeriodData && todayIndex >= 0 && todayIndex <= totalDays && currentBudget > 0) {
            const dailySpendRate = currentBudget / remainingDays;
            
            // Find the last actual budget transaction to start projection from
            let lastTransactionIndex = -1;
            let lastTransactionAmount = currentBudget;
            
            for (let i = todayIndex; i >= 0; i--) {
                if (actual[i] !== null) {
                    lastTransactionIndex = i;
                    lastTransactionAmount = actual[i];
                    break;
                }
            }
            
            // Only show forward projection from the last transaction date or today, whichever is later
            const projectionStartIndex = Math.max(lastTransactionIndex, todayIndex);
            
            for (let i = 0; i <= totalDays; i++) {
                if (i >= projectionStartIndex) {
                    // Forward projection: linear spending to zero from current budget
                    const daysFromProjectionStart = i - todayIndex;
                    projected[i] = Math.max(0, currentBudget - (dailySpendRate * daysFromProjectionStart));
                } else {
                    // No backward projection - only show actual data
                    projected[i] = null;
                }
            }
        } else {
            // No meaningful data - don't show projections
            for (let i = 0; i <= totalDays; i++) {
                projected[i] = null;
            }
        }

        // Fill forward actual values from the last known transaction
        // This ensures that budget amounts persist after the transaction date
        let lastKnownValue = null;
        let lastTransactionIndex = -1;
        
        // Find the most recent actual transaction
        for (let i = 0; i <= totalDays; i++) {
            if (actual[i] !== null) {
                lastKnownValue = actual[i];
                lastTransactionIndex = i;
            }
        }
        
        // Fill forward from the last transaction to today (or end of period if past today)
        if (lastKnownValue !== null && lastTransactionIndex >= 0) {
            const fillEndIndex = Math.min(totalDays, Math.max(todayIndex, lastTransactionIndex));
            
            console.log('Forward filling budget data:', {
                lastKnownValue,
                lastTransactionIndex,
                todayIndex,
                fillEndIndex,
                totalDays
            });
            
            for (let i = lastTransactionIndex; i <= fillEndIndex; i++) {
                if (actual[i] === null) {
                    actual[i] = lastKnownValue;
                    console.log(`Forward filled actual[${i}] = ${lastKnownValue}`);
                }
            }
        }

        // Get previous periods data only if we have current period data
        let previousPeriodsData = [];
        if (hasCurrentPeriodData) {
            const previousPeriods = this._getPreviousPeriodsData(3);
            
            // Transform previous periods to current timeline
            const currentPeriodData = { periodStart, periodEnd };
            
            previousPeriods.forEach(prevPeriod => {
                const transformedData = this._transformPreviousPeriodToCurrentTimeline(prevPeriod, currentPeriodData);
                previousPeriodsData.push({
                    data: transformedData,
                    periodIndex: prevPeriod.periodIndex,
                    month: prevPeriod.month,
                    year: prevPeriod.year,
                    isFirstHalf: prevPeriod.isFirstHalf
                });
            });
        }

        // Debug logging
        console.log('Budget Chart Data:', {
            totalDays,
            todayIndex,
            currentBudget,
            periodStart: periodStart.toLocaleDateString(),
            periodEnd: periodEnd.toLocaleDateString(),
            currentPeriodHistoryEntries: currentPeriodBudgetHistory.length,
            currentPeriodHistoryDates: currentPeriodBudgetHistory.map(entry => ({
                date: new Date(entry.timestamp).toLocaleDateString(),
                amount: entry.amount,
                action: entry.action
            })),
            hasCurrentPeriodData,
            actualDataPoints: actual.map((val, idx) => ({ day: idx, value: val })).filter(item => item.value !== null),
            projectedDataPoints: projected.map((val, idx) => ({ day: idx, value: val })).filter(item => item.value !== null),
            previousPeriods: previousPeriodsData.length
        });

        return { labels, projected, actual, periodStart, previousPeriodsData };
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
            // For budget chart, it's easier to destroy and recreate due to dynamic datasets
            this.renderBudgetChart();
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

        if (this.charts.budgetPerDayProjectedVsActual) {
            // For budget per day projected vs actual chart, it's easier to destroy and recreate due to dynamic datasets
            this.renderBudgetPerDayProjectedVsActualChart();
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