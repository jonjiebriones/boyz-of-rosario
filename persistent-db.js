const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { createClient } = require('@supabase/supabase-js');

const DB_FILE = 'boyz-of-rosario.sqlite';
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'boyz-data';

class PersistentSQLite {
  constructor(SQL, bytes, supabase, localPath = null) {
    this.SQL = SQL;
    this.supabase = supabase;
    this.localPath = localPath;
    this.db = new SQL.Database(bytes || undefined);
    this.persistTimer = null;
    this.persisting = false;
    this.persistAgain = false;
    this.initializing = false;
  }

  exec(sql) {
    const result = this.db.exec(sql);
    if (!this.initializing) this.schedulePersist();
    return result;
  }

  pragma() {
    // sql.js runs in-memory; SQLite pragmas related to WAL/foreign keys are
    // intentionally ignored here. Foreign-key enforcement is enabled below.
    try { this.db.exec('PRAGMA foreign_keys=ON'); } catch (_) {}
  }

  prepare(sql) {
    const owner = this;
    return {
      get(...params) {
        const stmt = owner.db.prepare(sql);
        try {
          stmt.bind(params);
          if (!stmt.step()) return undefined;
          return stmt.getAsObject();
        } finally { stmt.free(); }
      },
      all(...params) {
        const stmt = owner.db.prepare(sql);
        const rows = [];
        try {
          stmt.bind(params);
          while (stmt.step()) rows.push(stmt.getAsObject());
          return rows;
        } finally { stmt.free(); }
      },
      run(...params) {
        const stmt = owner.db.prepare(sql);
        try {
          stmt.bind(params);
          stmt.step();
          const changes = owner.db.getRowsModified();
          const row = owner.db.exec('SELECT last_insert_rowid() AS lastInsertRowid');
          const lastInsertRowid = row[0]?.values?.[0]?.[0] ?? 0;
          owner.schedulePersist();
          return { changes, lastInsertRowid };
        } finally { stmt.free(); }
      }
    };
  }

  transaction(fn) {
    const owner = this;
    return function transactionRunner(arg) {
      owner.db.exec('BEGIN');
      try {
        const result = fn(arg);
        owner.db.exec('COMMIT');
        owner.schedulePersist();
        return result;
      } catch (err) {
        try { owner.db.exec('ROLLBACK'); } catch (_) {}
        throw err;
      }
    };
  }

  schedulePersist() {
    if (this.initializing) return;
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistNow().catch(err => console.error('Supabase database save failed:', err.message));
    }, 350);
  }

  async persistNow() {
    if (!this.supabase && !this.localPath) return;
    if (this.persisting) {
      this.persistAgain = true;
      return;
    }
    this.persisting = true;
    try {
      const bytes = this.db.export();
      if (this.supabase) {
        const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
        const { error } = await this.supabase.storage.from(BUCKET).upload(DB_FILE, blob, {
          contentType: 'application/x-sqlite3',
          cacheControl: '0',
          upsert: true
        });
        if (error) throw error;
        console.log('Database saved to Supabase Storage.');
      } else if (this.localPath) {
        fs.mkdirSync(path.dirname(this.localPath), { recursive: true });
        fs.writeFileSync(this.localPath, Buffer.from(bytes));
      }
    } finally {
      this.persisting = false;
      if (this.persistAgain) {
        this.persistAgain = false;
        this.schedulePersist();
      }
    }
  }

  async close() {
    clearTimeout(this.persistTimer);
    await this.persistNow();
    try { this.db.close(); } catch (_) {}
  }
}

async function createPersistentSQLite() {
  const SQL = await initSqlJs({
    locateFile: file => require.resolve(`sql.js/dist/${file}`)
  });

  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  // Local development fallback. Render production should use Supabase.
  if (!url || !key) {
    const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, 'boyz.db');
    let bytes = null;
    if (fs.existsSync(dbPath)) bytes = new Uint8Array(fs.readFileSync(dbPath));
    const local = new PersistentSQLite(SQL, bytes, null, dbPath);
    local.initializing = true;
    local.pragma('foreign_keys=ON');
    local.initializing = false;
    return local;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
  if (bucketListError) throw bucketListError;
  if (!(buckets || []).some(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (error && !/already exists/i.test(error.message || '')) throw error;
  }

  let bytes = null;
  const { data, error } = await supabase.storage.from(BUCKET).download(DB_FILE);
  if (!error && data) {
    bytes = new Uint8Array(await data.arrayBuffer());
    console.log('Database loaded from Supabase Storage.');
  } else {
    console.log('No existing cloud database found. Starting a fresh Boyz of Rosario database.');
  }

  const db = new PersistentSQLite(SQL, bytes, supabase);
  db.initializing = true;
  db.pragma('foreign_keys=ON');
  db.initializing = false;
  return db;
}

module.exports = { createPersistentSQLite };
