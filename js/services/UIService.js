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
    }

    /**
     * Set notification service dependency
     * @param {NotificationService} notificationService 
     */
    setNotificationService(notificationService) {
        this.notificationService = notificationService;
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
            breakModal: document.getElementById('breakModal')
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

        let html = `
            <table class="table table-dark table-striped table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Message</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logs.forEach(log => {
            html += `<tr><td>${log.id}</td><td>${log.message}</td><td>${log.timestamp}</td></tr>`;
        });

        html += '</tbody></table>';
        this.elements.logsContent.innerHTML = html;
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
