// config.js
window.Config = {
    // 1. Base de Datos y Autenticación
    SUPABASE_URL: "https://supabase1.myserver.pt",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjEyMzQ1Njc4LCJleHAiOjI2MTIzNDU2Nzh9.szPPmYS9Pa9WENwHSgsrd7i_YaYLmmORiVqA9jguyGc",

    // 2. Tablas
    TABLES: {
        PORTAL_LINKS: 'portal_links'
    },

    // 3. UI Config
    UI: {
        MOBILE_BREAKPOINT: 768
    }
};

window.supabaseClient = supabase.createClient(
    window.Config.SUPABASE_URL, 
    window.Config.SUPABASE_ANON_KEY
);