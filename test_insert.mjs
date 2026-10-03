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

async function fixPosts() {
    console.log("Inserindo post de teste...");
    const { data, error } = await supabase.from('lyka_posts').insert([{
        user_id: '123',
        author_name: 'Sistema',
        content: 'Bem-vindo ao Feed!',
        type: 'user_post'
    }]);
    console.log("Insert result:", error ? error : "OK");
}
fixPosts();
