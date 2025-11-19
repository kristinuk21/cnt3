/**
 * UIService - Handles UI rendering and updates
 * Follows Single Responsibility Principle - only responsible for UI operations
 */
class UIService {
    /**
     * Update the Today modal with all relevant info
     * @param {Object} data - {breaks, earlyStart, hasEarlyStart}
     */
    updateTodayModal(data) {
        const container = document.getElementById('todayModalContent');
        if (!container) return;

        let html = '';
        // Early start info
        if (data.hasEarlyStart && data.earlyStart) {
            html += `<div class="mb-2"><strong>Early start time:</strong> ${UtilsService.formatDate(data.earlyStart, 'time')}</div>`;
        }

        // Start Early button (only if not started early and before regular start time)
        const now = new Date();
        const workStart = new Date();
        workStart.setHours(CONFIG.WORKING_HOURS.START, 0, 0, 0);
        if (!data.hasEarlyStart && now < workStart) {
            html += `<div class="d-flex justify-content-center mb-3">
                <button id="startEarlyBtn" class="btn btn-warning px-4">Start Early</button>
            </div>`;
        }

        // Breaks list
        if (data.breaks && data.breaks.length > 0) {
            html += '<div class="mb-2"><strong>Breaks today:</strong></div>';
            html += '<div class="mb-3">';
            data.breaks.forEach(breakItem => {
                const startTime = UtilsService.formatDate(new Date(breakItem.start), 'time');
                const endTime = breakItem.end ? UtilsService.formatDate(new Date(breakItem.end), 'time') : 'Ongoing';
                html += `<div class="break-item mb-2 p-2 bg-secondary rounded">
                    <small>Break: ${startTime} - ${endTime}</small>
                    <small class="ms-2">(${breakItem.durationStr})</small>
                </div>`;
            });
            html += '</div>';
        }

        // Determine if a break is active
        const hasActiveBreak = data.breaks && data.breaks.some(b => !b.end);

        // Break buttons
        html += `<div class="d-flex justify-content-between gap-3 mb-4">
            <button id="startBreakBtn" class="btn btn-success flex-fill"${hasActiveBreak ? ' disabled' : ''}>Start Break</button>
            <button id="endBreakBtn" class="btn btn-danger flex-fill"${!hasActiveBreak ? ' disabled' : ''}>End Break</button>
        </div>`;

        // Reset Day button
        html += `<div class="d-flex justify-content-center">
            <button id="resetDayBtn" class="btn btn-outline-danger">Reset Day</button>
        </div>`;

        container.innerHTML = html;
    }
    constructor() {
        this.elements = this._initializeElements();
        this.notificationService = null; // Will be injected by ApplicationController
        this.databaseService = null; // Will be injected by ApplicationController
        this.progressCalculationService = null; // Will be injected by ApplicationController
    }

    /**
     * Set notification service dependency
     * @param {NotificationService} notificationService 
     */
    setNotificationService(notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Set database service dependency
     * @param {DatabaseService} databaseService 
     */
    setDatabaseService(databaseService) {
        this.databaseService = databaseService;
    }

    /**
     * Set progress calculation service dependency
     * @param {ProgressCalculationService} progressCalculationService 
     */
    setProgressCalculationService(progressCalculationService) {
        this.progressCalculationService = progressCalculationService;
    }

    /**
     * Initialize DOM element references
     * @private
     * @returns {Object} Element references
     */
    _initializeElements() {
        return {
            // Details tab elements
            // Period details
            currentDate: document.getElementById('currentDate'),
            previousStartDay: document.getElementById('previousStartDay'),
            nextEndDay: document.getElementById('nextEndDay'),
            remainingDays: document.getElementById('remainingDays'),
            currentBudget: document.getElementById('currentBudget'),
            budgetPerDay: document.getElementById('budgetPerDay'),
            
            // Today's details
            todayWorkingDayFlag: document.getElementById('todayWorkingDayFlag'),
            todayWorkingHoursFlag: document.getElementById('todayWorkingHoursFlag'),
            todayStartTime: document.getElementById('todayStartTime'),
            expectedEndTime: document.getElementById('expectedEndTime'),
            remainingHours: document.getElementById('remainingHours'),
            todayProgress: document.getElementById('todayProgress'),
            
            // Break details
            currentBreakStatus: document.getElementById('currentBreakStatus'),
            totalBreakDuration: document.getElementById('totalBreakDuration'),
            breakCount: document.getElementById('breakCount'),
            
            // Logs tab elements
            logsContent: document.getElementById('logsContent'),
            
            // Modal elements
            breakModal: document.getElementById('breakModal'),
            budgetModal: document.getElementById('budgetModal'),
            tasksModal: document.getElementById('tasksModal')
        };
    }

    /**
     * Update details section with calculated values
     * @param {Object} data - Data object containing all calculated values
     */
    updateDetailsSection(data) {
        // Helper to safely update elements with data
        const updateElement = (elementId, content) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = content;
            }
        };

        // Update period information
        updateElement('currentDate', data.currentDate);
        updateElement('previousStartDay', data.previousStartDay);
        updateElement('nextEndDay', data.nextEndDay);
        updateElement('remainingDays', data.remainingDays);
        
        // Update budget information
        if (data.currentBudget !== undefined) {
            updateElement('currentBudget', data.currentBudget);
        }
        if (data.budgetPerDay !== undefined) {
            updateElement('budgetPerDay', data.budgetPerDay);
        }

        // Update today's status
        updateElement('todayWorkingDayFlag', data.isWorkingDay);
        updateElement('todayWorkingHoursFlag', data.isWorkingHours);
        updateElement('todayStartTime', data.startTime);
        updateElement('expectedEndTime', data.expectedEndTime);
        updateElement('remainingHours', data.remainingHours);
        updateElement('todayProgress', data.todayProgress);

        // Update break information
        updateElement('currentBreakStatus', data.currentBreakStatus);
        updateElement('totalBreakDuration', data.totalBreakDuration);
        updateElement('breakCount', data.breakCount);

        // For debugging
        console.log('Updating details section with:', data);
    }

    /**
     * Update spending statistics section
     * @param {Object} stats - Statistics from StatisticsService
     */
    updateSpendingStatistics(stats) {
        const updateElement = (elementId, content) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = content;
            }
        };

        const updateHtml = (elementId, html) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = html;
            }
        };

        // Update budget status fields
        updateElement('startingBudget', stats.startingBudget);
        updateElement('totalSpent', stats.totalSpent);
        
        // Update spending statistics
        updateElement('avgSpendingPerDay', stats.avgSpendingPerDay);
        updateElement('spendingPace', stats.spendingPace);
        updateElement('budgetDuration', stats.budgetDuration);
        updateElement('forecastEndDate', stats.forecastEndDate);
        
        // Update advice box with appropriate styling
        const adviceElement = document.getElementById('spendingAdvice');
        if (adviceElement && stats.advice) {
            let bgColor = 'rgba(108, 117, 125, 0.2)'; // default grey
            let textColor = '#e9ecef';
            
            if (stats.advice.status === 'success') {
                bgColor = 'rgba(40, 167, 69, 0.2)';
                textColor = '#28a745';
            } else if (stats.advice.status === 'warning') {
                bgColor = 'rgba(255, 193, 7, 0.2)';
                textColor = '#ffc107';
            } else if (stats.advice.status === 'danger') {
                bgColor = 'rgba(220, 53, 69, 0.2)';
                textColor = '#dc3545';
            }
            
            adviceElement.style.backgroundColor = bgColor;
            adviceElement.style.color = textColor;
            adviceElement.style.fontWeight = 'bold';
            adviceElement.textContent = stats.advice.message;
        }
    }

    /**
     * Update home section with progress data
     * @param {Object} data - Data object containing progress information
     */
    updateHomeSection(data) {
    // No-op: Progress bars are now handled by React only
    }

    /**
     * Render logs table
     * @param {Array} logs - Array of log objects
     */
    renderLogs(logs) {
        if (!this.elements.logsContent) return;

        if (logs.length === 0) {
            this.elements.logsContent.innerHTML = '<em>No logs found.</em>';
            return;
        }

        // Get current filter states
        const filters = this._getLogFilters();
        
        // Categorize all logs first to get counts
        const categorizedLogs = logs.map(log => ({
            ...log,
            category: this._getLogCategory(log)
        }));
        
        // Count logs by category
        const categoryCounts = {
            budget: 0,
            reloads: 0,
            clicks: 0,
            other: 0
        };
        
        categorizedLogs.forEach(log => {
            categoryCounts[log.category]++;
        });
        
        // Filter logs based on selected categories
        const filteredLogs = categorizedLogs.filter(log => filters[log.category]);

        // Create summary header
        const totalLogs = logs.length;
        const filteredCount = filteredLogs.length;
        
        // Get current budget info for context (if services are available)
        let currentBudget = 'N/A';
        let budgetPerDay = 'N/A';
        
        if (this.databaseService) {
            currentBudget = this.databaseService.getCurrentBudget();
        }
        
        if (this.progressCalculationService) {
            const homeData = this.progressCalculationService.getHomeProgressData();
            budgetPerDay = homeData.budgetPerDay || 'N/A';
        }
        
        const summaryHtml = `
            <div class="alert alert-info mb-3">
                <div class="row">
                    <div class="col-md-8">
                        <strong>Log Summary:</strong> 
                        Showing ${filteredCount} of ${totalLogs} logs | 
                        Budget: ${categoryCounts.budget} | 
                        Reloads: ${categoryCounts.reloads} | 
                        Clicks: ${categoryCounts.clicks} | 
                        Other: ${categoryCounts.other}
                    </div>
                </div>
            </div>
        `;

        let html = summaryHtml + `
            <table class="table table-dark table-striped table-bordered">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Category</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filteredLogs.forEach(log => {
            // Clean up timestamp by removing milliseconds
            const cleanTimestamp = log.timestamp.replace(/\.\d{3}Z?$/, '').replace('T', ' ');
            const categoryBadge = this._getCategoryBadge(log.category);
            html += `<tr><td>${cleanTimestamp}</td><td>${categoryBadge}</td><td>${log.message}</td></tr>`;
        });

        html += '</tbody></table>';
        
        if (filteredLogs.length === 0) {
            html = summaryHtml + '<em>No logs match the current filters.</em>';
        }
        
        this.elements.logsContent.innerHTML = html;
    }

    /**
     * Get current filter states
     * @private
     * @returns {Object} Filter states
     */
    _getLogFilters() {
        return {
            budget: document.getElementById('filterBudget')?.checked ?? true,
            reloads: document.getElementById('filterReloads')?.checked ?? true,
            clicks: document.getElementById('filterClicks')?.checked ?? true,
            other: document.getElementById('filterOther')?.checked ?? true
        };
    }

    /**
     * Determine if a log should be shown based on current filters
     * @private
     * @param {Object} log - Log object with category property
     * @param {Object} filters - Filter states
     * @returns {boolean} Whether to show the log
     */
    _shouldShowLog(log, filters) {
        return filters[log.category];
    }

    /**
     * Categorize a log message
     * @private
     * @param {Object} log - Log object
     * @returns {string} Category name
     */
    _getLogCategory(log) {
        const message = log.message.toLowerCase();
        
        // Budget category - any budget-related operations
        if (message.includes('budget')) {
            return 'budget';
        }
        
        // Reloads category - page reload events
        if (message.includes('page reloaded') || message.includes('reloaded')) {
            return 'reloads';
        }
        
        // Click actions category - user interaction events
        if (message.includes('clicked') || 
            message.includes('progress bar') ||
            message.includes('progress clicked')) {
            return 'clicks';
        }
        
        // Default to other for breaks, tasks, early starts, etc.
        return 'other';
    }

    /**
     * Get a styled badge for the category
     * @private
     * @param {string} category - Category name
     * @returns {string} HTML badge
     */
    _getCategoryBadge(category) {
        const badges = {
            budget: '<span class="badge bg-success">Budget</span>',
            reloads: '<span class="badge bg-info">Reload</span>',
            clicks: '<span class="badge bg-warning">Click</span>',
            other: '<span class="badge bg-secondary">Other</span>'
        };
        return badges[category] || badges.other;
    }

    /**
     * Show break modal
     */
    showBreakModal() {
        if (!this.elements.breakModal) return;
        const modal = new bootstrap.Modal(this.elements.breakModal);
        modal.show();
    }

    /**
     * Show budget modal
     */
    showBudgetModal() {
        if (!this.elements.budgetModal) return;
        const modal = new bootstrap.Modal(this.elements.budgetModal);
        modal.show();
    }

    /**
     * Show tasks modal
     */
    showTasksModal() {
        if (!this.elements.tasksModal) return;
        const modal = new bootstrap.Modal(this.elements.tasksModal);
        modal.show();
    }

    /**
     * Show alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, warning, error, info)
     */
    showAlert(message, type = 'info') {
        if (this.notificationService) {
            this.notificationService.showToast(message, type);
        } else {
            // Fallback to browser alert if notification service not available
            alert(message);
        }
    }

    /**
     * Update the Budget modal with current budget information
     * @param {Object} data - Budget data including current budget, per day calculation, etc.
     */
    updateBudgetModal(data) {
        const container = document.getElementById('budgetModalContent');
        const budgetInput = document.getElementById('budgetInput');
        
        if (!container) return;

        // Update the input field with current budget
        if (budgetInput) {
            budgetInput.value = data.currentBudget || 0;
        }

        let html = '';
        
        // Display only budget per day
        html += `<div class="mb-3">
            <div><strong>Budget per Day:</strong> ${data.budgetPerDay || 0} RON/day</div>
        </div>`;

        container.innerHTML = html;
    }

    /**
     * Private method to update element text content safely
     * @param {HTMLElement} element - DOM element to update
     * @param {string} content - Content to set
     */
    _updateElement(element, content) {
        UtilsService.updateElement(element, content);
    }

    /**
     * Private method to update progress bar
     * @param {HTMLElement} progressElement - Progress bar element
     * @param {number} percentage - Progress percentage
     */
    _updateProgressBar(progressElement, percentage) {
        if (!progressElement) return;

        progressElement.style.width = percentage + '%';
        progressElement.setAttribute('aria-valuenow', percentage);
        
        if (progressElement.id === 'hoursProgress') {
            progressElement.innerHTML = `<span style="min-width:40px;display:inline-block;text-align:center;">${percentage}%</span>`;
        } else {
            progressElement.textContent = percentage + '%';
        }
    }
}
