import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), anonKeyMatch[1].trim());

async function testUpdateDelete() {
    // 1. Insert a dummy message
    const { data: insData, error: insErr } = await supabase.from('lyka_messages').insert({
        user_id: 'test',
        author_name: 'test',
        message: 'test delete me'
    }).select();
    
    if (insErr) {
        console.error("Insert failed:", insErr);
        return;
    }
    
    const id = insData[0].id;
    console.log("Inserted ID:", id);
    
    // 2. Try Update
    const { error: updErr } = await supabase.from('lyka_messages').update({ message: 'updated' }).eq('id', id);
    if (updErr) {
        console.error("Update failed:", updErr);
    } else {
        console.log("Update succeeded");
    }
    
    // 3. Try Delete
    const { error: delErr } = await supabase.from('lyka_messages').delete().eq('id', id);
    if (delErr) {
        console.error("Delete failed:", delErr);
    } else {
        console.log("Delete succeeded");
    }
}

testUpdateDelete();
