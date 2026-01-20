import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = 'c:/Users/paulo/OneDrive/Área de Trabalho/FLUOW AI2026/backend/.env';
dotenv.config({ path: envPath });

async function quickCheck() {
    let dbUrl = process.env.DATABASE_URL || '';
    
    // STRIP CONTEXT: Hard fix for the quotes I saw in logs
    if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
        dbUrl = dbUrl.substring(1, dbUrl.length - 1);
    }
    
    console.log('--- RESILIENT DB CHECK ---');
    console.log('DATABASE_URL starts with:', dbUrl.substring(0, 20) + '...');

    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();
        console.log('✅ Connected!');

        const res = await client.query('SELECT id, name, type, status, config FROM "Integration"');
        console.log(`\nIntegrations (${res.rows.length}):`);
        res.rows.forEach(r => console.log(`- [${r.type}] ${r.name}: ${r.status} (Instance: ${r.config?.instanceName})`));

        const ins = await client.query('SELECT username, status FROM "InstagramAccount"');
        console.log(`\nInsta Accounts (${ins.rows.length}):`);
        ins.rows.forEach(i => console.log(`- @${i.username}: ${i.status}`));

    } catch (err: any) {
        console.error('❌ DB ERROR:', err.message);
    } finally {
        await client.end();
    }
}

quickCheck();
