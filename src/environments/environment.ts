export const environment = {
  production: false,
  appUrl: 'http://localhost:4200', // Cambiar en producción
  supabase: {
    url: 'https://iujfqxfkpyeluqgtzdbd.supabase.co',
    anonKey: 'sb_publishable_vDB6DWBczNLrLI2Hf2GwSQ_GYGIQAFV',
    jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amZxeGZrcHllbHVxZ3R6ZGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDAwMDAsImV4cCI6MjA1Mjk3NjAwMH0.BFY0BTVl3dZugeRYD4aontyVuWeNw3kTI34yOmGz7Wo'
  },
  emailjs: {

    publicKey: 'dYIKVkc2A_BwY4QCV',
    serviceId: 'service_hr2es88',
    templateId: 'template_p0vv2rr', // Template para código de verificación
    templateIdPassword: 'template_5dwjv69', // Template para nueva contraseña
    logoUrl: 'https://i.imgur.com/YNHMzRs.png' // Logo de AcademicSystem
  }
};

