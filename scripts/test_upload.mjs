import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/); // Note: using anon key like frontend

const supabase = createClient(urlMatch[1].trim(), anonKeyMatch[1].trim());

async function testUpload() {
    const dummyContent = "Hello World";
    const { data, error } = await supabase.storage.from('lyka_media').upload('test.txt', dummyContent, { upsert: true });
    if (error) {
        console.error("Upload failed:", error.message);
    } else {
        console.log("Upload succeeded:", data);
        // Try getting public URL
        const { data: pubData } = supabase.storage.from('lyka_media').getPublicUrl('test.txt');
        console.log("Public URL:", pubData.publicUrl);
    }
}
testUpload();
