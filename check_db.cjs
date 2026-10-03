const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDQzNjcwMCwiZXhwIjoyMTA2MDEyNzAwfQ.IQSpHDUwuUP5a83YV9L-1qxjMma9iQAopVOFpFcWwpw';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRows() {
    const { data, error } = await supabase.from('pessoas').select('papel').limit(5);
    console.log(data, error);
}
checkRows();
