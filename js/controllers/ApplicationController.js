/**
 * ApplicationController - Main application controller
 * Follows Dependency Inversion Principle - depends on abstractions (services)
 * Coordinates between different controllers and services
 */
class ApplicationController {
    constructor() {
        this.services = {};
        this.controllers = {};
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Initialize each component separately to identify where failure occurs
            try {
                await this._initializeServices();
            } catch (servicesError) {
                throw new Error(`Services initialization failed: ${servicesError.message}`);
            }

            try {
                this._initializeControllers();
            } catch (controllersError) {
                throw new Error(`Controllers initialization failed: ${controllersError.message}`);
            }

            try {
                this._setupEventHandlers();
            } catch (eventsError) {
                throw new Error(`Event handlers setup failed: ${eventsError.message}`);
            }

            try {
                this._performInitialUpdates();
            } catch (updatesError) {
                throw new Error(`Initial updates failed: ${updatesError.message}`);
            }
            
            this.services.database.addLog(CONFIG.MESSAGES.INFO.PAGE_RELOADED);
            // Make controllers accessible globally for component callbacks
        window.applicationController = this;
        
        this.isInitialized = true;
            
            UtilsService.log('Application initialized successfully');
        } catch (error) {
            const errorMessage = `Failed to initialize application: ${error.message}`;
            UtilsService.log(errorMessage, 'error');
            alert(errorMessage);
            throw error;
        }
    }

    /**
     * Initialize all services
     */
    async _initializeServices() {
        // Core services
        this.services.database = new DatabaseService();
        this.services.dateCalculation = new DateCalculationService();
        this.services.ui = new UIService();
        this.services.event = new EventService();
        this.services.notification = new NotificationService();

        // Initialize database first
        await this.services.database.initialize();

        // Initialize progress calculation service (depends on dateCalculation and database)
        this.services.progressCalculation = new ProgressCalculationService(
            this.services.dateCalculation, 
            this.services.database
        );

        // Initialize chart service (depends on database and dateCalculation)
        this.services.chart = new ChartService(
            this.services.database,
            this.services.dateCalculation
        );

        // Inject dependencies
        this.services.ui.setNotificationService(this.services.notification);
        this.services.ui.setDatabaseService(this.services.database);
        this.services.ui.setProgressCalculationService(this.services.progressCalculation);
    }

    /**
     * Initialize all controllers
     */
    _initializeControllers() {
        this.controllers.modal = new ModalController(
            this.services.ui,
            this.services.database,
            this.services.progressCalculation
        );

        this.controllers.progress = new ProgressController(
            this.services.database,
            this.controllers.modal
        );

        this.controllers.tab = new TabController(
            this.services.ui,
            this.services.dateCalculation,
            this.services.database,
            this.services.progressCalculation,
            this.services.chart
        );

        this.controllers.button = new ButtonController(
            this.services.database,
            this.services.ui,
            this.controllers.tab,
            this.controllers.modal
        );

        this.controllers.budget = new BudgetController(
            this.services.database,
            this.services.ui,
            this.controllers.modal
        );

        this.controllers.task = new TaskController(
            this.services.database,
            this.services.ui,
            this.services.event
        );
    }

    /**
     * Setup event handlers
     */
    _setupEventHandlers() {
        this.services.event.initialize(this.controllers);
    }

    /**
     * Perform initial updates to the UI
     */
    _performInitialUpdates() {
        // Update details tab first
        this.controllers.tab.handleDetailsTabShown();
        
        // Then render progress bars after a short delay to ensure services are ready
        setTimeout(() => {
            if (window.renderProgressBars) {
                console.log('Rendering progress bars after initialization');
                window.renderProgressBars();
            }
        }, 100);
    }

    /**
     * Get service instance
     * @param {string} serviceName - Name of the service
     * @returns {Object} - Service instance
     */
    getService(serviceName) {
        return this.services[serviceName];
    }

    /**
     * Get controller instance
     * @param {string} controllerName - Name of the controller
     * @returns {Object} - Controller instance
     */
    getController(controllerName) {
        return this.controllers[controllerName];
    }

    /**
     * Get task controller
     */
    get taskController() {
        return this.controllers.task;
    }

    /**
     * Cleanup application resources
     */
    cleanup() {
        if (this.services.event) {
            this.services.event.cleanup();
        }
        this.isInitialized = false;
    }
}
