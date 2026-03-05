export const environment = {
  production: true,
  appUrl: 'https://academicsystem.com.ar', // Cambiar a tu dominio de producción
  supabase: {
    url: 'https://wvxvefwilbnjzpanaopl.supabase.co',
    anonKey: 'sb_publishable_uRE-ybQJF2HUDpatHim_Ug_JDIJCgfw'
  },
  emailjs: {
    publicKey: 'IPcjBSET9_X2QTrBM',
    serviceId: 'service_vbg0icf',
    templateId: 'template_37vdhg5', // Template para código de verificación
    templateIdPassword: 'template_lgd3pxf', // Template para nueva contraseña (usuario y contraseña)
    logoUrl: 'https://i.imgur.com/YNHMzRs.png' // Logo de AcademicSystem
  }
};

