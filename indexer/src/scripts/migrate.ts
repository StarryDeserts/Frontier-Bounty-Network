import { openDatabase } from '../db/client.js';
import { config } from '../config.js';

const db = openDatabase(config.dbPath);
console.log(`[db:migrate] schema ensured at ${config.dbPath}`);
db.close();
