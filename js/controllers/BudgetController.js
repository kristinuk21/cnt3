/**
 * BudgetController - Handles budget-related operations
 * Follows Single Responsibility Principle - only responsible for budget management
 */
class BudgetController {
    constructor(databaseService, uiService, modalController) {
        this.databaseService = databaseService;
        this.uiService = uiService;
        this.modalController = modalController;
        this._setupEventListeners();
    }

    /**
     * Setup event listeners for budget modal buttons
     */
    _setupEventListeners() {
        // Increase budget button (moved to right side)
        const increaseBudgetBtn = document.getElementById('increaseBudgetBtn');
        if (increaseBudgetBtn) {
            increaseBudgetBtn.addEventListener('click', () => this.adjustBudget(100, 'increase'));
        }

        // Decrease budget button (moved to left side)
        const decreaseBudgetBtn = document.getElementById('decreaseBudgetBtn');
        if (decreaseBudgetBtn) {
            decreaseBudgetBtn.addEventListener('click', () => this.adjustBudget(-100, 'decrease'));
        }

        // Budget input field for manual entry with auto-save
        const budgetInput = document.getElementById('budgetInput');
        if (budgetInput) {
            budgetInput.addEventListener('change', () => this.saveBudget());
            budgetInput.addEventListener('blur', () => this.saveBudget());
        }
    }

    /**
     * Save the budget from the input field
     */
    saveBudget() {
        const budgetInput = document.getElementById('budgetInput');
        if (!budgetInput) return;

        const amount = parseFloat(budgetInput.value) || 0;
        const currentBudget = this.databaseService.getCurrentBudget();
        
        if (amount !== currentBudget) {
            this.databaseService.setBudget(amount, 'manual_set');
            this.uiService.showAlert(`Budget set to ${amount} RON`, 'success');
            this._refreshBudgetModal();
            this._updateCharts();
        }
    }

    /**
     * Adjust budget by a specific amount
     * @param {number} adjustment - Amount to adjust (positive or negative)
     * @param {string} action - Action type for logging
     */
    adjustBudget(adjustment, action) {
        const newBudget = this.databaseService.adjustBudget(adjustment, action);
        this.uiService.showAlert(`Budget ${action}d to ${newBudget} RON`, 'success');
        this._refreshBudgetModal();
        this._updateCharts();
    }

    /**
     * Refresh the budget modal content
     */
    _refreshBudgetModal() {
        this.modalController._updateBudgetModalContent();
        
        // Update the input field with the new value
        const budgetInput = document.getElementById('budgetInput');
        if (budgetInput) {
            budgetInput.value = this.databaseService.getCurrentBudget();
        }
    }

    /**
     * Update charts when budget changes
     * @private
     */
    _updateCharts() {
        // Update charts if they exist and are initialized
        const app = window.applicationController || window.app;
        if (app && app.services && app.services.chart) {
            try {
                app.services.chart.updateCharts();
            } catch (error) {
                console.error('Error updating charts after budget change:', error);
            }
        }
    }
}