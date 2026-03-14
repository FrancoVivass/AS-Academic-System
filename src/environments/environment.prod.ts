export const environment = {
  production: true,
  appUrl: 'https://academicsystem.com.ar', // Cambiar a tu dominio de producción
  supabase: {
    url: 'https://wvxvefwilbnjzpanaopl.supabase.co',
    anonKey: 'sb_publishable_uRE-ybQJF2HUDpatHim_Ug_JDIJCgfw'
  },
  emailjs: {
    publicKey: 'dYIKVkc2A_BwY4QCV',
    serviceId: 'service_hr2es88',
    templateId: 'template_p0vv2rr', // Template para código de verificación
    templateIdPassword: 'template_5dwjv69', // Template para nueva contraseña (usuario y contraseña)
    logoUrl: 'https://i.imgur.com/YNHMzRs.png' // Logo de AcademicSystem
  }
};

