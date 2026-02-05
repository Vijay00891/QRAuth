
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdrllgpsllkflrkfxljl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcmxsZ3BzbGxrZmxya2Z4bGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTIyNDAsImV4cCI6MjA4Mzk4ODI0MH0.IWJeo2rRCr7Y-Ucg7X-ywHi7ySwUByCsj4C-ZZl7-oA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
