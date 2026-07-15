import neutralino from '@neutralinojs/lib';
import { mount } from 'svelte';
import App from './index.svelte';

import { SQLiteExtension } from './libs/CSqliteExtension';

neutralino.init();

// Instantiate the SQLite extension helper
const db = new SQLiteExtension('TheCelesteTracker_DB.db');

// Expose query helper to browser console for easy testing
(window as any).runSql = async (sql = 'SELECT sqlite_version() AS version;') => {
	console.log('⚡ Running query via SQLiteExtension helper:', sql);
	try {
		const result = await db.execute(sql);
		console.log('📬 SQLite Extension Result:', result);
		return result;
	} catch (error) {
		console.error('❌ SQLite Extension Error:', error);
		throw error;
	}
};

const target = document.getElementById('app');

if (!target) {
	throw new Error("Could not find element with id 'app'");
}

const app = mount(App, {
	target,
});

export default app;
