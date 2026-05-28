import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fuqfoykavefsfjplbcyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cWZveWthdmVmc2ZqcGxiY3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTA5MDIsImV4cCI6MjA4OTQ2NjkwMn0.xlN4SFJUnFDpHf9FdCPisZtIKLiztww2h8U2BIu9mFE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);