"use client";

import { createClient } from "@supabase/supabase-js";

// Temporalmente hardcodeadas hasta que se puedan usar variables de entorno correctamente
const supabaseUrl = "https://qnjlbyrgnbjvxmvkbayn.supabase.co/";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuamxieXJnbmJqdnhtdmtiYXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzg1NTcsImV4cCI6MjA3NjkxNDU1N30.cB4FFKuINlOi5_H9V7Q6f_g_pVD4-x7yswD-8MK6BTI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
