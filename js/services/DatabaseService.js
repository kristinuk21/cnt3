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
        if (!window.initSqlJs) {
            throw new Error(CONFIG.MESSAGES.ERROR.SQL_JS_NOT_LOADED);
        }

        const SQL = await window.initSqlJs({ locateFile: file => `${CONFIG.DATABASE.ASSETS_PATH}${file}` });
        const dbData = localStorage.getItem(this.LOCALSTORAGE_KEY);

        if (dbData) {
            this.db = new SQL.Database(Uint8Array.from(atob(dbData), c => c.charCodeAt(0)));
            this._migrateTables();
        } else {
            this.db = new SQL.Database();
            this._createTables();
            this._saveDatabase();
        }

        UtilsService.log('Database initialized successfully');
        return this.db;
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
        this._saveDatabase();
    }

    _createTables() {
        this.db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, timestamp TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS breaks (id INTEGER PRIMARY KEY AUTOINCREMENT, start TEXT, end TEXT)");
        this.db.run("CREATE TABLE IF NOT EXISTS early_starts (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT)");
    }

    _saveDatabase() {
        if (!this.db) return;
        const data = this.db.export();
        const b64 = btoa(String.fromCharCode(...data));
        localStorage.setItem(this.LOCALSTORAGE_KEY, b64);
    }

    // Log operations
    addLog(message) {
        if (!this.db) return;
        const timestamp = new Date().toISOString();
        this.db.run("INSERT INTO logs (message, timestamp) VALUES (?, ?)", [message, timestamp]);
        this._saveDatabase();
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
        this.db.run("INSERT INTO breaks (start, end) VALUES (?, NULL)", [now.toISOString()]);
        this._saveDatabase();
        const timeStr = UtilsService.formatDate(now, 'time');
        this.addLog(`Break started at ${timeStr}`);
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
        const stmt = this.db.prepare("SELECT * FROM breaks ORDER BY id DESC");
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
}
