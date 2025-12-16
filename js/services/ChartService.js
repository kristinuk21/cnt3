/**
 * ChartService (CharTs) - Handles chart rendering and data visualization
 * 
 * KEY INSIGHT: Budget updates represent periodic snapshots.
 * Spending = change between snapshots / days elapsed.
 * Charts show period-based analysis, not point-in-time data.
 */
class ChartService {
    constructor(databaseService, dateCalculationService) {
        this.databaseService = databaseService;
        this.dateCalculationService = dateCalculationService;
        this.charts = {};
    }

    /**
     * Initialize all CharTs (trend charts) when the CharTs tab is shown
     */
    initializeCharts() {
        this.renderPeriodRatesChart();
        this.renderBudgetTimelineChart();
        this.renderPaceGaugeChart();
    }

    /**
     * Get spending periods from budget history
     * Each period = gap between consecutive budget updates
     * @private
     */
    _getSpendingPeriods() {
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Get current period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Filter and sort chronologically
        const history = budgetHistory.filter(entry => {
            const d = new Date(entry.timestamp);
            return d >= periodStart && d <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (history.length < 2) return [];
        
        const periods = [];
        for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1];
            const curr = history[i];
            const prevDate = new Date(prev.timestamp);
            const currDate = new Date(curr.timestamp);
            const days = Math.max(1, Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24)));
            const spent = prev.amount - curr.amount;
            const dailyRate = spent / days;
            
            periods.push({
                startDate: prevDate,
                endDate: currDate,
                startBudget: prev.amount,
                endBudget: curr.amount,
                days,
                spent,
                dailyRate
            });
        }
        
        return periods;
    }

    /**
     * Render Period Rates Chart - Bar chart showing daily rate for each update period
     */
    renderPeriodRatesChart() {
        const ctx = document.getElementById('periodRatesChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) return;

        if (this.charts.periodRates) {
            this.charts.periodRates.destroy();
        }

        const periods = this._getSpendingPeriods();
        
        // Calculate target daily rate for comparison line
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        
        const budgetHistory = this.databaseService.getBudgetHistory();
        const currentPeriodHistory = budgetHistory.filter(entry => {
            const d = new Date(entry.timestamp);
            return d >= periodStart && d <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const startingBudget = currentPeriodHistory.length > 0 ? currentPeriodHistory[0].amount : 0;
        const targetDailyRate = totalDays > 0 ? startingBudget / totalDays : 0;
        
        // Format labels
        const formatDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        
        const labels = periods.map((p, i) => `${formatDate(p.startDate)} - ${formatDate(p.endDate)}\n(${p.days}d)`);
        const dailyRates = periods.map(p => Math.round(p.dailyRate * 10) / 10);
        const targetLine = periods.map(() => targetDailyRate);
        
        // Color bars based on comparison to target
        const barColors = dailyRates.map(rate => {
            if (rate <= targetDailyRate * 0.8) return 'rgba(40, 167, 69, 0.8)'; // Under budget - green
            if (rate <= targetDailyRate * 1.1) return 'rgba(255, 193, 7, 0.8)'; // Near target - yellow
            return 'rgba(220, 53, 69, 0.8)'; // Over budget - red
        });
        
        this.charts.periodRates = new ChartConstructor(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Your Daily Rate (RON/day)',
                        data: dailyRates,
                        backgroundColor: barColors,
                        borderColor: barColors.map(c => c.replace('0.8', '1')),
                        borderWidth: 2
                    },
                    {
                        label: `Target Rate (${Math.round(targetDailyRate)} RON/day)`,
                        data: targetLine,
                        type: 'line',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e9ecef' }
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                if (context.datasetIndex === 0) {
                                    const period = periods[context.dataIndex];
                                    return [
                                        `Spent: ${Math.round(period.spent)} RON over ${period.days} days`,
                                        `Budget: ${Math.round(period.startBudget)} → ${Math.round(period.endBudget)} RON`
                                    ];
                                }
                                return '';
                            }
                        }
                    },
                    title: {
                        display: periods.length === 0,
                        text: 'No spending periods yet. Update your budget to see data.',
                        color: '#e9ecef'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#e9ecef', maxRotation: 45 },
                        grid: { color: 'rgba(233, 236, 239, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e9ecef',
                            callback: (v) => v + ' RON/day'
                        },
                        grid: { color: 'rgba(233, 236, 239, 0.2)' }
                    }
                }
            }
        });
    }

    /**
     * Render Budget Timeline Chart - Shows budget balance over time
     */
    renderBudgetTimelineChart() {
        const ctx = document.getElementById('budgetTimelineChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) return;

        if (this.charts.budgetTimeline) {
            this.charts.budgetTimeline.destroy();
        }

        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Get period boundaries
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        
        // Filter and sort
        const history = budgetHistory.filter(entry => {
            const d = new Date(entry.timestamp);
            return d >= periodStart && d <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (history.length === 0) {
            this.charts.budgetTimeline = new ChartConstructor(ctx, {
                type: 'line',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'No budget data for current period',
                            color: '#e9ecef'
                        }
                    }
                }
            });
            return;
        }
        
        // Build stepped data points
        const dataPoints = history.map(entry => ({
            x: new Date(entry.timestamp),
            y: entry.amount
        }));
        
        // Ideal linear spending line
        const startingBudget = history[0].amount;
        const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        const idealLine = [];
        for (let i = 0; i <= totalDays; i++) {
            const date = new Date(periodStart);
            date.setDate(periodStart.getDate() + i);
            if (date <= new Date()) {
                idealLine.push({
                    x: date,
                    y: startingBudget - (startingBudget / totalDays) * i
                });
            }
        }
        
        this.charts.budgetTimeline = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Ideal Spending',
                        data: idealLine,
                        borderColor: 'rgba(108, 117, 125, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        tension: 0
                    },
                    {
                        label: 'Actual Budget',
                        data: dataPoints,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 3,
                        pointRadius: 6,
                        pointBackgroundColor: '#28a745',
                        fill: true,
                        stepped: 'before'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { labels: { color: '#e9ecef' } },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const date = new Date(items[0].parsed.x);
                                return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                            },
                            label: (context) => `${context.dataset.label}: ${Math.round(context.parsed.y)} RON`
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day', displayFormats: { day: 'MMM dd' } },
                        ticks: { color: '#e9ecef' },
                        grid: { color: 'rgba(233, 236, 239, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e9ecef',
                            callback: (v) => v + ' RON'
                        },
                        grid: { color: 'rgba(233, 236, 239, 0.2)' }
                    }
                }
            }
        });
    }

    /**
     * Render Pace Gauge Chart - Simple visual showing if on track
     */
    renderPaceGaugeChart() {
        const ctx = document.getElementById('paceGaugeChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) return;

        if (this.charts.paceGauge) {
            this.charts.paceGauge.destroy();
        }

        // Calculate pace
        const periods = this._getSpendingPeriods();
        let totalDays = 0;
        let totalSpent = 0;
        
        periods.forEach(p => {
            if (p.spent > 0) {
                totalDays += p.days;
                totalSpent += p.spent;
            }
        });
        
        const actualDailyRate = totalDays > 0 ? totalSpent / totalDays : 0;
        
        // Get target
        const prevStartStr = this.dateCalculationService.computePreviousStartDay();
        const nextEndStr = this.dateCalculationService.computeNextEndDay();
        const [startMonth, startDay, startYear] = prevStartStr.split('/').map(Number);
        const [endMonth, endDay, endYear] = nextEndStr.split('/').map(Number);
        const periodStart = new Date(startYear, startMonth - 1, startDay);
        const periodEnd = new Date(endYear, endMonth - 1, endDay);
        const cycleDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
        
        const budgetHistory = this.databaseService.getBudgetHistory();
        const currentPeriodHistory = budgetHistory.filter(entry => {
            const d = new Date(entry.timestamp);
            return d >= periodStart && d <= periodEnd;
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const startingBudget = currentPeriodHistory.length > 0 ? currentPeriodHistory[0].amount : 0;
        const targetDailyRate = cycleDays > 0 ? startingBudget / cycleDays : 0;
        
        const pacePercent = targetDailyRate > 0 ? (actualDailyRate / targetDailyRate) * 100 : 0;
        
        // Determine status
        let status, statusColor, advice;
        if (pacePercent === 0) {
            status = 'No Data';
            statusColor = '#6c757d';
            advice = 'Update your budget to start tracking';
        } else if (pacePercent < 80) {
            status = 'Under Budget ✓';
            statusColor = '#28a745';
            advice = `Spending ${Math.round(pacePercent)}% of target - great job!`;
        } else if (pacePercent <= 100) {
            status = 'On Track ✓';
            statusColor = '#28a745';
            advice = `Spending ${Math.round(pacePercent)}% of target - keep it up!`;
        } else if (pacePercent <= 120) {
            status = 'Slightly Over ⚠️';
            statusColor = '#ffc107';
            advice = `Spending ${Math.round(pacePercent)}% of target - slow down a bit`;
        } else {
            status = 'Over Budget 🚨';
            statusColor = '#dc3545';
            advice = `Spending ${Math.round(pacePercent)}% of target - reduce spending!`;
        }
        
        // Create gauge-like visualization using doughnut
        const gaugeValue = Math.min(150, pacePercent); // Cap at 150% for display
        const remaining = 150 - gaugeValue;
        
        this.charts.paceGauge = new ChartConstructor(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Your Pace', 'Remaining'],
                datasets: [{
                    data: [gaugeValue, remaining],
                    backgroundColor: [statusColor, 'rgba(108, 117, 125, 0.2)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    title: {
                        display: true,
                        text: [
                            status,
                            `${Math.round(actualDailyRate)} RON/day vs ${Math.round(targetDailyRate)} RON/day target`,
                            advice
                        ],
                        color: statusColor,
                        font: { size: 14, weight: 'bold' },
                        padding: { top: 10 }
                    }
                }
            }
        });
    }

    /**
     * Update all charts
     */
    updateCharts() {
        this.initializeCharts();
    }
}
