import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
        return {
            url: urlMatch ? urlMatch[1].trim() : '',
            key: keyMatch ? keyMatch[1].trim() : ''
        };
    } catch(e) {
        return { url: '', key: '' };
    }
}

const envVars = loadEnv();
const supabase = createClient(envVars.url, envVars.key);

async function testQuery() {
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'lyka_posts' });
    console.log('Policies via RPC (if exists):', data, error);
}

testQuery();
