// Re-export the single Supabase client so all modules share one instance.
import { supabase } from "./dataClient.js";
export { supabase };
