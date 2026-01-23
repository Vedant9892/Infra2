// constants/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://luhlbbtzdxnzoegcefuv.supabase.co'; // Replace with yours
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aGxiYnR6ZHhuem9lZ2NlZnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjIzNDgsImV4cCI6MjA4NDQ5ODM0OH0.tiyWwSYb89-LW2ugfo0r7Jy5brl3zClBfSN_4P6WvPU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
