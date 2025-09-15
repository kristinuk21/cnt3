/**
 * TabController - Handles tab management
 * Follows Single Responsibility Principle - only responsible for tab management
 */
class TabController {
    constructor(uiService, dateCalculationService, databaseService, progressCalculationService, chartService) {
        this.uiService = uiService;
        this.dateCalculationService = dateCalculationService;
        this.databaseService = databaseService;
        this.progressCalculationService = progressCalculationService;
        this.chartService = chartService;
    }

    /**
     * Handle tab click event
     * @param {HTMLElement} tabElement - Clicked tab element
     */
    handleTabClick(tabElement) {
        const tabTrigger = new bootstrap.Tab(tabElement);
        tabTrigger.show();
    }

    /**
     * Handle details tab shown event
     */
    handleDetailsTabShown() {
        this._updateDetailsTab();
    }

    /**
     * Handle logs tab shown event
     */
    handleLogsTabShown() {
        this._updateLogsTab();
        this._setupLogFilters();
    }

    /**
     * Setup event listeners for log filter checkboxes
     * @private
     */
    _setupLogFilters() {
        const filterIds = ['filterBudget', 'filterReloads', 'filterClicks', 'filterOther'];
        
        filterIds.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement && !filterElement.hasAttribute('data-listener-added')) {
                // Mark element to avoid duplicate listeners
                filterElement.setAttribute('data-listener-added', 'true');
                // Add listener using arrow function to preserve 'this' context
                filterElement.addEventListener('change', () => {
                    this._handleFilterChange();
                });
            }
        });

        // Add debug button listener
        const debugBtn = document.getElementById('debugDataBtn');
        if (debugBtn && !debugBtn.hasAttribute('data-listener-added')) {
            debugBtn.setAttribute('data-listener-added', 'true');
            debugBtn.addEventListener('click', () => {
                this._handleDebugData();
            });
        }
    }

    /**
     * Handle filter checkbox change
     * @private
     */
    _handleFilterChange() {
        // Re-render logs with current filters
        this._updateLogsTab();
    }

    /**
     * Handle debug data button click
     * @private
     */
    _handleDebugData() {
        const logs = this.databaseService.getLogs();
        const budgetHistory = this.databaseService.getBudgetHistory();
        
        // Analyze budget-related logs
        const budgetLogs = logs.filter(log => 
            log.message.toLowerCase().includes('budget')
        );
        
        // Extract budget values from logs
        const budgetValuesFromLogs = budgetLogs.map(log => {
            const match = log.message.match(/(\d+)\s*RON/);
            return {
                timestamp: log.timestamp,
                message: log.message,
                extractedAmount: match ? parseInt(match[1]) : null
            };
        });
        
        // Compare with budget history
        const budgetHistoryWithDates = budgetHistory.map(entry => ({
            ...entry,
            date: new Date(entry.timestamp).toLocaleDateString(),
            time: new Date(entry.timestamp).toLocaleTimeString()
        }));

        // Calculate budget per day for comparison
        const currentBudget = this.databaseService.getCurrentBudget();
        const homeData = this.progressCalculationService.getHomeProgressData();
        const budgetPerDay = homeData.budgetPerDay;
        
        // Analyze the discrepancy
        const latestBudgetLog = budgetLogs[0];
        const latestBudgetHistory = budgetHistory[0];
        
        let discrepancyAnalysis = "No obvious discrepancy detected.";
        
        if (latestBudgetLog && latestBudgetHistory) {
            const logBudgetMatch = latestBudgetLog.message.match(/(\d+)\s*RON/);
            const logBudgetAmount = logBudgetMatch ? parseInt(logBudgetMatch[1]) : null;
            
            if (logBudgetAmount && logBudgetAmount !== latestBudgetHistory.amount) {
                discrepancyAnalysis = `DISCREPANCY FOUND: Log shows ${logBudgetAmount} RON but budget history shows ${latestBudgetHistory.amount} RON`;
            } else if (logBudgetAmount && budgetPerDay) {
                const dailyFromTotal = Math.round(logBudgetAmount / 10); // Assuming 10 day period
                discrepancyAnalysis = `Log shows total budget: ${logBudgetAmount} RON. Chart likely shows daily: ${budgetPerDay} RON/day (${logBudgetAmount}/10 days = ${dailyFromTotal})`;
            }
        }
        
        const debugData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalLogs: logs.length,
                budgetLogs: budgetLogs.length,
                budgetHistoryEntries: budgetHistory.length,
                currentBudget: currentBudget,
                budgetPerDay: budgetPerDay,
                discrepancyAnalysis: discrepancyAnalysis
            },
            analysis: {
                latestBudgetFromHistory: budgetHistory[0],
                latestBudgetFromLogs: budgetLogs[0],
                budgetValuesFromLogs: budgetValuesFromLogs.slice(0, 10), // First 10
                budgetHistoryRecent: budgetHistoryWithDates.slice(0, 10) // First 10
            },
            rawData: {
                logs: logs,
                budgetHistory: budgetHistory
            }
        };
        
        console.log('=== DEBUG DATA ANALYSIS ===');
        console.log('📊 DISCREPANCY ANALYSIS:', discrepancyAnalysis);
        console.log('📈 Summary:', debugData.summary);
        console.log('💰 Latest Budget (History):', debugData.analysis.latestBudgetFromHistory);
        console.log('📝 Latest Budget (Logs):', debugData.analysis.latestBudgetFromLogs);
        console.log('📋 Budget Values from Logs:', debugData.analysis.budgetValuesFromLogs);
        console.log('📊 Budget History (Recent):', debugData.analysis.budgetHistoryRecent);
        console.log('🔍 Full Debug Data:', debugData);
        
        // Create downloadable JSON file
        const dataStr = JSON.stringify(debugData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `debug-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert(`Debug analysis complete!\n\n${discrepancyAnalysis}\n\nCheck browser console for detailed analysis and download the JSON file for complete data.\n\nKey insight: Logs show TOTAL budget amounts, while charts typically show DAILY calculations (total ÷ days).`);
    }

    /**
     * Handle charts tab shown event
     */
    handleChartsTabShown() {
        this.chartService.initializeCharts();
    }

    /**
     * Update details tab with current data
     * Uses the centralized data from ProgressCalculationService
     */
    _updateDetailsTab() {
        // Get all data from the centralized progress calculation service
        const todayData = this.progressCalculationService.getTodayProgressData();
        const homeData = this.progressCalculationService.getHomeProgressData();
        const remainingTime = this.progressCalculationService.calculateRemainingTime();

        const formatDate = (date) => {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, ' '); // Ensure consistent spacing
        };

        const parseDate = (dateStr) => {
            const [month, day, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        };

        // Calculate break status
        let breakStatus = 'No break active';
        if (todayData.activeBreak) {
            const breakStart = new Date(todayData.activeBreak.start);
            breakStatus = `Break active (started at ${UtilsService.formatDate(breakStart, 'time')})`;
        }

        const data = {
            // Period information
            currentDate: formatDate(new Date()),
            previousStartDay: formatDate(parseDate(this.dateCalculationService.computePreviousStartDay())),
            nextEndDay: formatDate(parseDate(this.dateCalculationService.computeNextEndDay())),
            remainingDays: this.dateCalculationService.computeRemainingDaysUntilNextEnd(),
            
            // Budget information
            currentBudget: homeData.currentBudget || 0,
            budgetPerDay: homeData.budgetPerDay || 0,
            
            // Work status
            isWorkingDay: todayData.isWorkingDay ? 'Working day' : 'Non-working day',
            isWorkingHours: todayData.isBeforeHours ? 'Before working hours' :
                          todayData.isAfterHours ? 'After working hours' :
                          todayData.isWorkingDay ? 'During working hours' : 'Non-working day',
            remainingHours: remainingTime.formatted,
            startTime: todayData.startTime,
            expectedEndTime: todayData.endTime,

            // Break information
            currentBreakStatus: breakStatus,
            totalBreakDuration: todayData.totalBreakDuration,
            breakCount: todayData.breakCount || 0,
            
            // Progress
            todayProgress: `${todayData.progress}%`
        };

        this.uiService.updateDetailsSection(data);
    }

    /**
     * Update logs tab with current logs
     */
    _updateLogsTab() {
        const logs = this.databaseService.getLogs();
        this.uiService.renderLogs(logs);
    }

    /**
     * Update home tab with progress data
     */
    updateHomeTab() {
        // Only trigger React render for progress bars
        if (window.renderProgressBars) {
            window.renderProgressBars();
        }
    }
}
