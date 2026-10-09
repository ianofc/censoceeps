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

async function testInsert() {
    const { data, error } = await supabase.from('lyka_posts').insert([{
        user_id: 'test',
        author_name: 'test',
        content: 'test content',
        type: 'user_post'
    }]);
    if (error) {
        console.error('Insert error:', error);
    } else {
        console.log('Insert success');
    }
}

testInsert();
