/**
 * TaskController - Handles task-related functionality
 * Follows Single Responsibility Principle - only responsible for task management
 */
class TaskController {
    constructor(databaseService, uiService, eventService) {
        this.databaseService = databaseService;
        this.uiService = uiService;
        this.eventService = eventService;
        this.isProcessingTask = false; // Flag to prevent duplicate task operations
        this.bindEvents();
    }

    bindEvents() {
        // Add task button - only bind once
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn && !addTaskBtn.hasAttribute('data-task-events-bound')) {
            addTaskBtn.addEventListener('click', () => this.addTask());
            addTaskBtn.setAttribute('data-task-events-bound', 'true');
        }

        // Note: Task input enter key listener is bound in showTasksModal() 
        // since the input is inside the modal and may not be available during initialization
    }

    addTask() {
        // Prevent duplicate task additions
        if (this.isProcessingTask) {
            return;
        }
        
        const taskInput = document.getElementById('taskInput');
        if (!taskInput) {
            return;
        }

        const description = taskInput.value.trim();
        if (description === '') {
            alert('Please enter a task description');
            return;
        }

        this.isProcessingTask = true;

        try {
            // Add task to database
            const taskId = this.databaseService.addTask(description);
            
            if (taskId !== null && taskId !== undefined) {
                taskInput.value = '';
                this.updateTasksModal();
                this.eventService.emit('tasksUpdated');
                // Update progress data and re-render progress bars
                this._updateProgressBars();
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
        
        // Reset the flag after a short delay to prevent rapid duplicates
        setTimeout(() => {
            this.isProcessingTask = false;
        }, 100);
    }

    toggleTask(taskId) {
        this.databaseService.toggleTaskCompletion(taskId);
        this.updateTasksModal();
        this.eventService.emit('tasksUpdated');
        // Update progress data and re-render progress bars
        this._updateProgressBars();
    }

    deleteTask(taskId) {
        try {
            this.databaseService.deleteTask(taskId);
            this.updateTasksModal();
            this.eventService.emit('tasksUpdated');
            // Update progress data and re-render progress bars
            this._updateProgressBars();
        } catch (error) {
            console.error('Error during task deletion:', error);
        }
    }

    showTasksModal() {
        this.updateTasksModal();
        this.uiService.showTasksModal();
        
        // Bind the enter key event listener after modal is shown
        this._bindTaskInputEventListener();
    }

    updateTasksModal() {
        const tasks = this.databaseService.getTasks();
        
        let html = '';

        // Task list section
        if (tasks.length === 0) {
            html += '<div class="text-muted text-center py-3 mb-4"><em>No tasks found. Add your first task below!</em></div>';
        } else {
            html += '<div class="task-list mb-4">';
            
            tasks.forEach(task => {
                const isCompleted = task.completed === 1;
                const completedClass = isCompleted ? 'text-decoration-line-through opacity-75' : 'text-light';
                const buttonClass = isCompleted ? 'btn-outline-success' : 'btn-outline-warning';
                const buttonText = isCompleted ? '✓' : '○';
                const buttonTitle = isCompleted ? 'Mark as incomplete' : 'Mark as complete';
                
                html += `
                    <div class="d-flex align-items-center justify-content-between p-2 border-bottom border-secondary">
                        <div class="flex-grow-1 ${completedClass}" style="word-break: break-word; color: ${isCompleted ? '#adb5bd' : '#f8f9fa'};">
                            ${this.escapeHtml(task.description)}
                        </div>
                        <div class="d-flex gap-2 ms-2">
                            <button 
                                class="btn btn-sm ${buttonClass}" 
                                data-task-id="${task.id}"
                                data-action="toggle"
                                title="${buttonTitle}"
                                style="min-width: 32px;"
                            >
                                ${buttonText}
                            </button>
                            <button 
                                class="btn btn-sm btn-outline-danger" 
                                data-task-id="${task.id}"
                                data-action="delete"
                                title="Delete task"
                                style="min-width: 32px;"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        const tasksContent = document.getElementById('tasksModalContent');
        if (tasksContent) {
            tasksContent.innerHTML = html;
            
            // Ensure event delegation is set up (only once per element)
            if (!tasksContent.hasAttribute('data-events-bound')) {
                this.bindModalEventListeners();
                tasksContent.setAttribute('data-events-bound', 'true');
            }
        }
    }

    bindModalEventListeners() {
        const tasksContent = document.getElementById('tasksModalContent');
        if (!tasksContent) {
            return;
        }
        
        // Use event delegation for better reliability with dynamic content
        tasksContent.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-task-id]');
            if (!button) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = parseInt(button.getAttribute('data-task-id'));
            const action = button.getAttribute('data-action');
            
            if (action === 'toggle') {
                this.toggleTask(taskId);
            } else if (action === 'delete') {
                this.deleteTask(taskId);
            }
        });
    }

    /**
     * Bind event listener to task input for enter key functionality
     * @private
     */
    _bindTaskInputEventListener() {
        const taskInput = document.getElementById('taskInput');
        if (taskInput) {
            // Check if we already have a bound handler to prevent duplicates
            if (this._boundKeypressHandler) {
                taskInput.removeEventListener('keypress', this._boundKeypressHandler);
            }
            
            // Create and store the bound function reference
            this._boundKeypressHandler = this._handleTaskInputKeypress.bind(this);
            taskInput.addEventListener('keypress', this._boundKeypressHandler);
        }
    }

    /**
     * Handle keypress events on task input
     * @private
     */
    _handleTaskInputKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.addTask();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTaskStats() {
        return this.databaseService.getTaskStats();
    }

    /**
     * Update progress bars by updating the global progress data
     * @private
     */
    _updateProgressBars() {
        try {
            // Update the global progress data with fresh task stats
            if (window.app && typeof window.app.getService === 'function') {
                const app = window.app;
                const taskStats = app.getService('database').getTaskStats();
                
                // Update the global progress data that React components read from
                if (window.getProgressData) {
                    const currentData = window.getProgressData();
                    currentData.tasks = taskStats;
                }
            }
            
            // Trigger a re-render of the progress bars
            if (window.renderProgressBars) {
                window.renderProgressBars();
            }
        } catch (error) {
            console.error('Error updating progress bars:', error);
        }
    }
}