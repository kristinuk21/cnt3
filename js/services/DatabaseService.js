/**
 * DatabaseService - Handles all database operations
 * Follows Single Responsibility Principle - only responsible for database operations
 */
class DatabaseService {
    /**
     * Reset all early_starts and breaks for today
     */
    resetToday() {
        if (!this.db) return;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        // Remove today's early_starts
        this.db.run("DELETE FROM early_starts WHERE date LIKE ?", [`${todayStr}%`]);
        // Remove today's breaks
        this.db.run("DELETE FROM breaks WHERE start LIKE ?", [`${todayStr}%`]);
        this._saveDatabase();
    }
    /**
     * Get today's early start time (if any)
     * @returns {Date|null}
     */
    getTodayEarlyStartTime() {
        if (!this.db) return null;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const stmt = this.db.prepare("SELECT date FROM early_starts ORDER BY id DESC");
        let result = null;
        while (stmt.step()) {
            const row = stmt.getAsObject();
            if (row.date && row.date.startsWith(todayStr)) {
                result = new Date(row.date);
                break;
            }
        }
        stmt.free();
        return result;
    }

    /**
     * Get total break duration (in ms) for today
     * @returns {number}
     */
    getTodayBreakDurationMs() {
        if (!this.db) return 0;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const stmt = this.db.prepare("SELECT start, end FROM breaks");
        let totalMs = 0;
        while (stmt.step()) {
            const row = stmt.getAsObject();
            if (row.start && row.start.startsWith(todayStr)) {
                const start = new Date(row.start);
                const end = row.end ? new Date(row.end) : new Date();
                totalMs += Math.max(0, end - start);
            }
        }
        stmt.free();
        return totalMs;
    }
    constructor() {
        this.db = null;
        this.LOCALSTORAGE_KEY = CONFIG.DATABASE.LOCALSTORAGE_KEY;
    }

    async initialize() {
        try {
            // Check SQL.js availability
            if (typeof window.initSqlJs !== 'function') {
                throw new Error('SQL.js initialization function not found. Try clearing browser cache and reloading.');
            }

            // Check if localStorage is available
            if (!window.localStorage) {
                throw new Error('localStorage is not available. Make sure your browser supports it and is not in private browsing mode.');
            }

            try {
                const SQL = await window.initSqlJs({ 
                    locateFile: file => `${CONFIG.DATABASE.ASSETS_PATH}${file}` 
                });

                const dbData = localStorage.getItem(this.LOCALSTORAGE_KEY);

                if (dbData) {
                    try {
                        const binaryArray = Uint8Array.from(atob(dbData), c => c.charCodeAt(0));
                        this.db = new SQL.Database(binaryArray);
                    } catch (dbLoadError) {
                        throw new Error(`Failed to load existing database: ${dbLoadError.message}. Try clearing browser data.`);
                    }
                    this._migrateTables();
                } else {
                    this.db = new SQL.Database();
                    this._createTables();
                    this._saveDatabase();
                }

                UtilsService.log('Database initialized successfully');
                return this.db;

            } catch (sqlError) {
                throw new Error(`Failed to initialize SQL.js: ${sqlError.message}. Check your internet connection and try again.`);
            }

        } catch (error) {
            const errorMessage = `Database initialization failed: ${error.message}`;
            UtilsService.log(errorMessage, 'error');
            throw new Error(errorMessage);
        }
    }

    /**
     * Ensure all required tables exist in the database (migration for old DBs)
     */
    _migrateTables() {
        // Check for logs table
        try {
            this.db.exec("SELECT 1 FROM logs LIMIT 1");
        } catch (e) {
            this.db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, timestamp TEXT)");
        }
        // Check for breaks table
        try {
            this.db.exec("SELECT 1 FROM breaks LIMIT 1");
        } catch (e) {
            this.db.run("CREATE TABLE IF NOT EXISTS breaks (id INTEGER PRIMARY KEY AUTOINCREMENT, start TEXT, end TEXT)");
        }
        // Check for early_starts table
        try {
            this.db.exec("SELECT 1 FROM early_starts LIMIT 1");
        } catch (e) {
            this.db.run("CREATE TABLE IF NOT EXISTS early_starts (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT)");
        }
        // Check for budgets table
        try {
            this.db.exec("SELECT 1 FROM budgets LIMIT 1");
        } catch (e) {
            this.db.run("CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL DEFAULT 0, timestamp TEXT, action TEXT)");
        }
        // Check for tasks table
        try {
            this.db.exec("SELECT 1 FROM tasks LIMIT 1");
        } catch (e) {
            this.db.run("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, completed INTEGER DEFAULT 0, timestamp TEXT)");
        }
        this._saveDatabase();
    }

    _createTables() {
        this.db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, timestamp TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS breaks (id INTEGER PRIMARY KEY AUTOINCREMENT, start TEXT, end TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS early_starts (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL DEFAULT 0, timestamp TEXT, action TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, completed INTEGER DEFAULT 0, timestamp TEXT)");
    }

    _saveDatabase() {
        if (!this.db) return;
        const data = this.db.export();
        const b64 = btoa(String.fromCharCode(...data));
        localStorage.setItem(this.LOCALSTORAGE_KEY, b64);
    }

    // Log operations
    addLog(message) {
        if (!this.db) {
            console.error('addLog: Database not available');
            return;
        }
        console.log('addLog: Adding log entry:', message);
        const timestamp = new Date().toISOString();
        this.db.run("INSERT INTO logs (message, timestamp) VALUES (?, ?)", [message, timestamp]);
        this._saveDatabase();
        console.log('addLog: Log entry saved successfully');
    }

    getLogs() {
        if (!this.db) return [];
        const stmt = this.db.prepare("SELECT * FROM logs ORDER BY id DESC");
        const logs = [];
        while (stmt.step()) {
            logs.push(stmt.getAsObject());
        }
        stmt.free();
        return logs;
    }

    resetLogs() {
        if (!this.db) return;
        this.db.run("DELETE FROM logs");
        this.db.run("DELETE FROM sqlite_sequence WHERE name='logs'");
        this._saveDatabase();
    }

    // Break operations

    startBreak() {
        if (!this.db) return;
        const now = new Date();
        // First check if there's already an active break
        if (this.isBreakActive()) {
            console.warn('Cannot start break: Another break is already active');
            return;
        }
        // Add the new break
        try {
            this.db.run("INSERT INTO breaks (start, end) VALUES (?, NULL)", [now.toISOString()]);
            this._saveDatabase();
            const timeStr = UtilsService.formatDate(now, 'time');
            this.addLog(`Break started at ${timeStr}`);
            console.log('Break started successfully at:', timeStr);
            return true;
        } catch (error) {
            console.error('Error starting break:', error);
            return false;
        }
    }


    endBreak() {
        if (!this.db) return;
        const now = new Date();
        const nowIso = now.toISOString();
        const stmt = this.db.prepare("SELECT id, start FROM breaks WHERE end IS NULL ORDER BY id DESC LIMIT 1");
        let breakId = null;
        let breakStart = null;
        if (stmt.step()) {
            const obj = stmt.getAsObject();
            breakId = obj.id;
            breakStart = obj.start;
        }
        stmt.free();
        if (breakId !== null) {
            this.db.run("UPDATE breaks SET end = ? WHERE id = ?", [nowIso, breakId]);
            this._saveDatabase();
            const startTime = breakStart ? UtilsService.formatDate(new Date(breakStart), 'time') : '';
            const endTime = UtilsService.formatDate(now, 'time');
            this.addLog(`Break ended at ${endTime} (started at ${startTime})`);
        }
    }

    getBreaks() {
        if (!this.db) return [];
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const stmt = this.db.prepare("SELECT * FROM breaks WHERE start LIKE ? ORDER BY id DESC");
        stmt.bind([`${todayStr}%`]);  // Bind the parameter for the LIKE query
        const breaks = [];
        while (stmt.step()) {
            breaks.push(stmt.getAsObject());
        }
        stmt.free();
        return breaks;
    }

    isBreakActive() {
        if (!this.db) return false;
        const stmt = this.db.prepare("SELECT COUNT(*) as cnt FROM breaks WHERE end IS NULL");
        let active = false;
        if (stmt.step()) {
            active = stmt.getAsObject().cnt > 0;
        }
        stmt.free();
        return active;
    }

    // Early start operations
    startEarlyDay() {
        if (!this.db) return;
        const now = new Date();
        this.db.run("INSERT INTO early_starts (date) VALUES (?)", [now.toISOString()]);
        this._saveDatabase();
        const timeStr = UtilsService.formatDate(now, 'time');
        this.addLog(`Started day early at ${timeStr}`);
    }

    // Budget operations
    getCurrentBudget() {
        if (!this.db) return 0;
        const stmt = this.db.prepare("SELECT amount FROM budgets ORDER BY id DESC LIMIT 1");
        let budget = 0;
        if (stmt.step()) {
            budget = stmt.getAsObject().amount || 0;
        }
        stmt.free();
        return budget;
    }

    setBudget(amount, action = 'set') {
        if (!this.db) return;
        const timestamp = new Date().toISOString();
        this.db.run("INSERT INTO budgets (amount, timestamp, action) VALUES (?, ?, ?)", [amount, timestamp, action]);
        this._saveDatabase();
        this.addLog(`Budget ${action}: ${amount} RON`);
    }

    adjustBudget(adjustment, action) {
        const currentBudget = this.getCurrentBudget();
        const newBudget = Math.max(0, currentBudget + adjustment);
        this.setBudget(newBudget, action);
        return newBudget;
    }

    getBudgetHistory() {
        if (!this.db) return [];
        const stmt = this.db.prepare("SELECT * FROM budgets ORDER BY id DESC");
        const history = [];
        while (stmt.step()) {
            history.push(stmt.getAsObject());
        }
        stmt.free();
        return history;
    }

    // Task management methods
    addTask(description) {
        if (!this.db) return null;
        
        const timestamp = new Date().toISOString();
        
        try {
            this.db.run("INSERT INTO tasks (description, completed, timestamp) VALUES (?, 0, ?)", [description, timestamp]);
            this._saveDatabase();
            this.addLog(`Task added: ${description}`);
            
            const taskId = this.getLastInsertedTaskId();
            
            // If last_insert_rowid() returns 0, let's verify the task was actually added
            if (taskId === 0) {
                // Get the most recent task with this description and timestamp
                const stmt = this.db.prepare("SELECT id FROM tasks WHERE description = ? AND timestamp = ? ORDER BY id DESC LIMIT 1");
                stmt.bind([description, timestamp]);
                if (stmt.step()) {
                    const row = stmt.getAsObject();
                    const verifiedId = row.id;
                    stmt.free();
                    return verifiedId;
                } else {
                    stmt.free();
                    return null;
                }
            }
            
            return taskId;
        } catch (error) {
            console.error('Error adding task:', error);
            return null;
        }
    }

    getTasks() {
        if (!this.db) return [];
        const stmt = this.db.prepare("SELECT * FROM tasks ORDER BY completed ASC, timestamp DESC");
        const tasks = [];
        while (stmt.step()) {
            tasks.push(stmt.getAsObject());
        }
        stmt.free();
        return tasks;
    }

    toggleTaskCompletion(taskId) {
        if (!this.db) return;
        const stmt = this.db.prepare("SELECT completed, description FROM tasks WHERE id = ?");
        stmt.bind([taskId]);
        if (stmt.step()) {
            const task = stmt.getAsObject();
            const newCompleted = task.completed ? 0 : 1;
            this.db.run("UPDATE tasks SET completed = ? WHERE id = ?", [newCompleted, taskId]);
            this._saveDatabase();
            this.addLog(`Task ${newCompleted ? 'completed' : 'uncompleted'}: ${task.description}`);
        }
        stmt.free();
    }

    deleteTask(taskId) {
        if (!this.db) {
            console.error('Database not available for deleteTask');
            return;
        }
        
        console.log('deleteTask: Starting deletion for taskId:', taskId);
        
        const stmt = this.db.prepare("SELECT description FROM tasks WHERE id = ?");
        stmt.bind([taskId]);
        let description = '';
        if (stmt.step()) {
            description = stmt.getAsObject().description;
            console.log('deleteTask: Found task to delete:', description);
        } else {
            console.warn('deleteTask: No task found with id:', taskId);
        }
        stmt.free();
        
        console.log('deleteTask: Executing DELETE query');
        this.db.run("DELETE FROM tasks WHERE id = ?", [taskId]);
        this._saveDatabase();
        
        if (description) {
            console.log('deleteTask: Adding log entry for deleted task');
            this.addLog(`Task deleted: ${description}`);
        } else {
            console.warn('deleteTask: No description found, not logging');
        }
        
        console.log('deleteTask: Deletion completed');
    }

    getTaskStats() {
        if (!this.db) return { total: 0, completed: 0, remaining: 0, percentage: 0 };
        
        const totalStmt = this.db.prepare("SELECT COUNT(*) as count FROM tasks");
        totalStmt.step();
        const total = totalStmt.getAsObject().count;
        totalStmt.free();
        
        const completedStmt = this.db.prepare("SELECT COUNT(*) as count FROM tasks WHERE completed = 1");
        completedStmt.step();
        const completed = completedStmt.getAsObject().count;
        completedStmt.free();
        
        const remaining = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { total, completed, remaining, percentage };
    }

    getLastInsertedTaskId() {
        if (!this.db) return null;
        
        try {
            const stmt = this.db.prepare("SELECT last_insert_rowid() as id");
            const hasResult = stmt.step();
            
            if (hasResult) {
                const row = stmt.getAsObject();
                const result = row.id;
                stmt.free();
                return result;
            } else {
                stmt.free();
                return null;
            }
        } catch (error) {
            console.error('Error getting last inserted task ID:', error);
            return null;
        }
    }
}
