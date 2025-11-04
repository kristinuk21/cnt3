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
        this.renderPerformanceScorecard();
        this.renderSpendingPatternHeatmap();
        this.renderEfficiencyTrendline();
    }

    /**
     * Render Performance Scorecard - Clear comparison metrics across periods
     * Shows spending efficiency and budget utilization in an easy-to-read format
     */
    renderPerformanceScorecard() {
        const ctx = document.getElementById('performanceScorecardChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        if (this.charts.performanceScorecard) {
            this.charts.performanceScorecard.destroy();
        }

        const scorecardData = this._preparePerformanceScorecardData();
        
        this.charts.performanceScorecard = new ChartConstructor(ctx, {
            type: 'radar',
            data: {
                labels: ['Budget\nUtilization', 'Spending\nConsistency', 'Days\nActive', 'Avg Daily\nSpending', 'Period\nCompletion'],
                datasets: scorecardData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#e9ecef',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        },
                        pointLabels: {
                            color: '#e9ecef',
                            font: {
                                size: 11
                            }
                        },
                        angleLines: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Math.round(context.parsed.r)}% score`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: scorecardData.summary,
                        color: '#e9ecef',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    }
                }
            }
        });
    }

    /**
     * Render Spending Pattern Heatmap - Visual pattern recognition across days
     * Shows which days of the period tend to have higher spending
     */
    renderSpendingPatternHeatmap() {
        const ctx = document.getElementById('spendingPatternChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        if (this.charts.spendingPattern) {
            this.charts.spendingPattern.destroy();
        }

        const patternData = this._prepareSpendingPatternData();
        
        this.charts.spendingPattern = new ChartConstructor(ctx, {
            type: 'bar',
            data: {
                labels: patternData.labels,
                datasets: [{
                    label: 'Daily Average',
                    data: patternData.avgDailySpending,
                    backgroundColor: patternData.depletionRates.map(rate => {
                        if (rate > 8) return 'rgba(220, 53, 69, 0.8)'; // Critical
                        if (rate > 7) return 'rgba(255, 193, 7, 0.8)'; // Warning
                        return 'rgba(40, 167, 69, 0.8)'; // Good
                    }),
                    borderColor: patternData.depletionRates.map(rate => {
                        if (rate > 8) return 'rgba(220, 53, 69, 1)';
                        if (rate > 7) return 'rgba(255, 193, 7, 1)';
                        return 'rgba(40, 167, 69, 1)';
                    }),
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: 'Depletion Rate (%/day)',
                    data: patternData.depletionRates,
                    type: 'line',
                    borderColor: 'rgba(23, 162, 184, 1)',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(23, 162, 184, 1)',
                    yAxisID: 'y1',
                    fill: true
                }, {
                    label: 'Target (6.7%/day)',
                    data: patternData.targetLine,
                    type: 'line',
                    borderColor: 'rgba(108, 117, 125, 0.5)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    yAxisID: 'y1',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const datasetLabel = context.dataset.label;
                                const value = context.parsed.y;
                                if (datasetLabel.includes('Daily Average')) {
                                    return `${datasetLabel}: ${Math.round(value)} RON`;
                                } else if (datasetLabel.includes('Depletion')) {
                                    return `${datasetLabel}: ${value.toFixed(1)}%`;
                                }
                                return `${datasetLabel}: ${value.toFixed(1)}%`;
                            },
                            afterBody: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const rate = patternData.depletionRates[index];
                                const daysToDeplete = Math.floor(100 / rate);
                                return `Budget lasts: ~${daysToDeplete} days at this rate`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: patternData.insights,
                        color: '#e9ecef',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 15
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#e9ecef'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Daily Average (RON)',
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return Math.round(value) + ' RON';
                            }
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        max: 12,
                        title: {
                            display: true,
                            text: 'Depletion Rate (%/day)',
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Render Efficiency Trendline - Long-term improvement tracking
     * Shows how budget management efficiency changes over time
     */
    renderEfficiencyTrendline() {
        const ctx = document.getElementById('efficiencyTrendChart');
        if (!ctx) return;

        const ChartConstructor = window.Chart || Chart;
        if (!ChartConstructor) {
            console.error('Chart.js is not loaded properly');
            return;
        }

        if (this.charts.efficiencyTrend) {
            this.charts.efficiencyTrend.destroy();
        }

        const trendData = this._prepareEfficiencyTrendData();
        
        this.charts.efficiencyTrend = new ChartConstructor(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [
                    {
                        label: 'Budget Efficiency Score',
                        data: trendData.efficiencyScores,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#28a745',
                        fill: true
                    },
                    {
                        label: 'Target (80%)',
                        data: trendData.targetLine,
                        borderColor: 'rgba(255, 193, 7, 0.6)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e9ecef',
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Efficiency: ${Math.round(context.parsed.y)}%`;
                                }
                                return `Target: ${Math.round(context.parsed.y)}%`;
                            },
                            footer: function(tooltipItems) {
                                const score = tooltipItems[0].parsed.y;
                                if (score >= 80) return '✓ Excellent efficiency';
                                if (score >= 60) return '✓ Good efficiency';
                                if (score >= 40) return '⚠ Needs improvement';
                                return '✗ Poor efficiency';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: trendData.trendMessages,
                        color: trendData.isImproving ? '#28a745' : '#ffc107',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 15
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#e9ecef',
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#e9ecef',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(233, 236, 239, 0.2)'
                        },
                        title: {
                            display: true,
                            text: 'Efficiency Score',
                            color: '#e9ecef'
                        }
                    }
                }
            }
        });
    }

    /**
     * Prepare performance scorecard data
     * @private
     */
    _preparePerformanceScorecardData() {
        const periods = this._getHistoricalPeriods(4); // Last 4 periods for comparison
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        const datasets = [];
        const colors = [
            { border: '#28a745', bg: 'rgba(40, 167, 69, 0.2)' },
            { border: '#17a2b8', bg: 'rgba(23, 162, 184, 0.2)' },
            { border: '#ffc107', bg: 'rgba(255, 193, 7, 0.2)' },
            { border: '#dc3545', bg: 'rgba(220, 53, 69, 0.2)' }
        ];
        
        let bestScore = 0;
        let bestPeriod = '';
        let worstScore = 100;
        let improvementArea = '';
        
        periods.forEach((period, index) => {
            const color = colors[index % colors.length];
            const scores = this._calculatePeriodScores(period, budgetHistory);
            
            const avgScore = (scores.utilization + scores.consistency + scores.active + scores.spending + scores.completion) / 5;
            
            if (avgScore > bestScore) {
                bestScore = avgScore;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[period.month];
                const halfLabel = period.isFirstHalf ? '1st' : '2nd';
                bestPeriod = `${monthName} ${period.year} (${halfLabel})`;
            }
            
            // Track weakest area across all periods
            const minScore = Math.min(scores.utilization, scores.consistency, scores.active, scores.spending, scores.completion);
            if (minScore < worstScore) {
                worstScore = minScore;
                const areas = ['Budget Utilization', 'Spending Consistency', 'Days Active', 'Avg Daily Spending', 'Period Completion'];
                const scoreValues = [scores.utilization, scores.consistency, scores.active, scores.spending, scores.completion];
                improvementArea = areas[scoreValues.indexOf(minScore)];
            }
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[period.month];
            const halfLabel = period.isFirstHalf ? '1st' : '2nd';
            const label = `${monthName} '${String(period.year).slice(-2)} (${halfLabel.charAt(0)})`;
            
            datasets.push({
                label: label,
                data: [scores.utilization, scores.consistency, scores.active, scores.spending, scores.completion],
                borderColor: color.border,
                backgroundColor: color.bg,
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            });
        });
        
        const summary = [
            bestScore > 70 
                ? `✓ Best: ${bestPeriod} (${Math.round(bestScore)}% score)` 
                : `⚠️ Room for improvement (Best: ${Math.round(bestScore)}%)`,
            worstScore < 60 && improvementArea
                ? `🎯 Focus on: ${improvementArea}` 
                : 'Continue current strategies'
        ];
        
        return { datasets, summary };
    }

    /**
     * Calculate performance scores for a period
     * @private
     */
    _calculatePeriodScores(period, budgetHistory) {
        const periodTransactions = budgetHistory.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= period.periodStart && entryDate <= period.periodEnd;
        });
        
        if (periodTransactions.length < 2) {
            return {
                utilization: 0,
                consistency: 0,
                active: 0,
                spending: 0,
                completion: 0
            };
        }
        
        const sortedTransactions = periodTransactions.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp));
        
        const startingBudget = sortedTransactions[0].amount;
        const finalBudget = sortedTransactions[sortedTransactions.length - 1].amount;
        const totalSpent = startingBudget - finalBudget;
        
        // Budget utilization score (80-100% is ideal)
        const utilization = startingBudget > 0 ? (totalSpent / startingBudget) * 100 : 0;
        const utilizationScore = utilization >= 80 && utilization <= 100 ? 100 : 
                                utilization > 100 ? Math.max(0, 100 - (utilization - 100)) : utilization * 1.25;
        
        // Consistency score (based on transaction frequency)
        const periodDays = Math.ceil((period.periodEnd - period.periodStart) / (1000 * 60 * 60 * 24));
        const transactionsPerDay = periodTransactions.length / periodDays;
        const consistencyScore = Math.min(100, transactionsPerDay * 30); // Expect ~3 transactions per day
        
        // Active days score
        const uniqueDays = new Set();
        periodTransactions.forEach(t => {
            const date = new Date(t.timestamp);
            uniqueDays.add(date.toISOString().split('T')[0]);
        });
        const activeDaysScore = (uniqueDays.size / periodDays) * 100;
        
        // Spending rate score (compare to ideal)
        const actualDailyRate = totalSpent / periodDays;
        const idealDailyRate = startingBudget / periodDays;
        const rateRatio = idealDailyRate > 0 ? actualDailyRate / idealDailyRate : 1;
        const spendingScore = rateRatio <= 1 ? 100 : Math.max(0, 100 - ((rateRatio - 1) * 100));
        
        // Completion score (did they make it through the period?)
        const completionScore = finalBudget >= 0 ? 100 : Math.max(0, 100 + (finalBudget / startingBudget * 100));
        
        return {
            utilization: Math.min(100, utilizationScore),
            consistency: Math.min(100, consistencyScore),
            active: Math.min(100, activeDaysScore),
            spending: Math.min(100, spendingScore),
            completion: Math.min(100, completionScore)
        };
    }

    /**
     * Prepare spending pattern data - focus on daily rate and depletion trends
     * @private
     */
    _prepareSpendingPatternData() {
        const periods = this._getHistoricalPeriods(6);
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        const labels = [];
        const avgDailySpending = [];
        const depletionRates = []; // % of budget spent per day
        const targetLine = [];
        
        periods.forEach(period => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[period.month];
            const halfLabel = period.isFirstHalf ? '1' : '2';
            const label = `${monthName}-H${halfLabel}`;
            labels.push(label);
            
            const periodTransactions = budgetHistory.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= period.periodStart && entryDate <= period.periodEnd;
            }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            if (periodTransactions.length < 2) {
                avgDailySpending.push(0);
                depletionRates.push(0);
                targetLine.push(6.67); // 100% / 15 days = ideal
                return;
            }
            
            const startingBudget = periodTransactions[0].amount;
            const endingBudget = periodTransactions[periodTransactions.length - 1].amount;
            const totalSpent = startingBudget - endingBudget;
            
            // Calculate active days (days with spending)
            const spendingDays = new Set();
            for (let i = 1; i < periodTransactions.length; i++) {
                const spent = periodTransactions[i - 1].amount - periodTransactions[i].amount;
                if (spent > 0) {
                    const date = new Date(periodTransactions[i].timestamp);
                    const dayOfPeriod = Math.floor((date - period.periodStart) / (1000 * 60 * 60 * 24));
                    spendingDays.add(dayOfPeriod);
                }
            }
            
            const activeDays = spendingDays.size || 15;
            const dailyAvg = totalSpent / activeDays;
            avgDailySpending.push(Math.round(dailyAvg));
            
            // Depletion rate: what % of budget is spent per day on average
            const depletionRate = startingBudget > 0 ? (dailyAvg / startingBudget) * 100 : 0;
            depletionRates.push(depletionRate);
            targetLine.push(6.67); // Target: 100% / 15 days
        });
        
        // Calculate insights
        const insights = [];
        const recentRate = depletionRates.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const recentDailyAvg = avgDailySpending.slice(-1)[0] || 0;
        
        if (recentRate > 8) {
            insights.push(`🚨 Critical: Spending ${recentRate.toFixed(1)}% of budget per day`);
            insights.push(`⚠️ At this rate, budget depletes in ${Math.floor(100 / recentRate)} days`);
            insights.push(`🎯 Target: Reduce daily average to ${Math.round(recentDailyAvg * 0.67)} RON or less`);
        } else if (recentRate > 7) {
            insights.push(`⚠️ Warning: Spending ${recentRate.toFixed(1)}% per day (target: 6.7%)`);
            insights.push(`🎯 Action: Limit daily spending to ${Math.round(recentDailyAvg * 0.85)} RON`);
        } else {
            insights.push(`✓ Good pace: ${recentRate.toFixed(1)}% per day`);
            insights.push(`💡 Budget will last full 15-day period`);
        }
        
        // Trend analysis
        const olderRate = depletionRates.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        if (recentRate > olderRate * 1.2) {
            insights.push(`📈 Trend: Daily spending increasing - review recent changes`);
        } else if (recentRate < olderRate * 0.8) {
            insights.push(`📉 Trend: Daily spending decreasing - good progress!`);
        }
        
        return {
            labels,
            avgDailySpending,
            depletionRates,
            targetLine,
            insights
        };
    }

    /**
     * Prepare efficiency trend data
     * @private
     */
    _prepareEfficiencyTrendData() {
        const periods = this._getHistoricalPeriods(8);
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        const labels = [];
        const efficiencyScores = [];
        const targetLine = [];
        
        periods.forEach(period => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthNames[period.month];
            const halfLabel = period.isFirstHalf ? '1' : '2';
            const label = `${monthName} '${String(period.year).slice(-2)}-H${halfLabel}`;
            
            labels.push(label);
            targetLine.push(80);
            
            const periodTransactions = budgetHistory.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= period.periodStart && entryDate <= period.periodEnd;
            });
            
            if (periodTransactions.length < 2) {
                efficiencyScores.push(0);
                return;
            }
            
            const scores = this._calculatePeriodScores(period, budgetHistory);
            const avgScore = (scores.utilization + scores.consistency + scores.active + scores.spending + scores.completion) / 5;
            efficiencyScores.push(avgScore);
        });
        
        // Determine if improving
        const recentScores = efficiencyScores.slice(-3);
        const olderScores = efficiencyScores.slice(0, 3);
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / (olderScores.length || 1);
        const isImproving = recentAvg > olderAvg;
        
        const improvementPercent = Math.abs(Math.round(((recentAvg - olderAvg) / (olderAvg || 1)) * 100));
        
        const trendMessages = [];
        if (isImproving) {
            trendMessages.push(`↗ Improving: +${improvementPercent}% vs earlier`);
            trendMessages.push('✓ Action: Continue current strategies');
        } else if (improvementPercent > 10) {
            trendMessages.push(`↘ Declining: -${improvementPercent}% vs earlier`);
            trendMessages.push('🎯 Action: Review what changed in recent periods');
        } else {
            trendMessages.push('→ Stable performance');
            if (recentAvg < 70) {
                trendMessages.push('🎯 Action: Focus on consistency and completion');
            } else {
                trendMessages.push('✓ Maintaining good habits');
            }
        }
        
        return {
            labels,
            efficiencyScores,
            targetLine,
            isImproving,
            trendMessages
        };
    }

    /**
     * Render historical budget comparison (LEGACY - kept for compatibility)
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
        // Update new CHarts
        if (this.charts.performanceScorecard) {
            this.renderPerformanceScorecard();
        }
        
        if (this.charts.spendingPattern) {
            this.renderSpendingPatternHeatmap();
        }
        
        if (this.charts.efficiencyTrend) {
            this.renderEfficiencyTrendline();
        }
        
        // Legacy chart support (if still in use)
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