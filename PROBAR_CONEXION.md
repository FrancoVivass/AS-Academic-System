# 🧪 Probar la Conexión con Supabase

## ✅ Componente de Prueba Creado

He creado un componente especial para probar la conexión con Supabase.

---

## 🚀 Cómo Probar la Conexión

### Opción 1: Usar el Componente de Prueba (Recomendado)

1. **Inicia tu aplicación Angular:**
   ```bash
   npm start
   ```
   O si usas otro comando:
   ```bash
   ng serve
   ```

2. **Abre tu navegador y ve a:**
   ```
   http://localhost:4200/test-conexion
   ```

3. **El componente probará automáticamente la conexión** al cargar

4. **Verás uno de estos resultados:**

   ✅ **Conexión exitosa:**
   - Si las tablas están creadas: Verás "✅ Conexión exitosa con Supabase"
   - Si las tablas NO están creadas: Verás "✅ Conexión exitosa, pero las tablas aún no están creadas"

   ❌ **Error de conexión:**
   - Verás el mensaje de error específico
   - Revisa las credenciales en `src/environments/environment.ts`

---

### Opción 2: Probar desde la Consola del Navegador

1. Abre tu aplicación en el navegador
2. Abre las **Herramientas de Desarrollador** (F12)
3. Ve a la pestaña **Console**
4. Ejecuta este código:

```javascript
// Esto probará la conexión directamente
fetch('https://wvxvefwilbnjzpanaopl.supabase.co/rest/v1/instituciones?select=count', {
  headers: {
    'apikey': 'sb_publishable_uRE-ybQJF2HUDpatHim_Ug_JDIJCgfw',
    'Authorization': 'Bearer sb_publishable_uRE-ybQJF2HUDpatHim_Ug_JDIJCgfw'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Conexión exitosa!');
    return response.json();
  } else {
    console.error('❌ Error:', response.status, response.statusText);
    return response.text();
  }
})
.then(data => console.log('Datos:', data))
.catch(error => console.error('❌ Error de conexión:', error));
```

---

### Opción 3: Probar desde el Código TypeScript

Puedes probar la conexión desde cualquier componente:

```typescript
import { SupabaseService } from './services/supabase.service';

constructor(private supabase: SupabaseService) {}

async testConnection() {
  try {
    // Probar conexión básica
    const client = this.supabase.client;
    console.log('Cliente inicializado:', client ? '✅' : '❌');

    // Probar consulta
    const instituciones = await this.supabase.getAll('instituciones');
    console.log('✅ Conexión exitosa!', instituciones);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
```

---

## 🔍 Qué Buscar en los Resultados

### ✅ Conexión Exitosa (Tablas Creadas)
```
✅ Conexión exitosa con Supabase
Tipo: success
Mensaje: La conexión funciona correctamente y las tablas están creadas.
```

**Significa:** Todo está funcionando correctamente. Puedes empezar a usar la base de datos.

---

### ⚠️ Conexión Exitosa (Tablas NO Creadas)
```
✅ Conexión exitosa, pero las tablas aún no están creadas
Tipo: warning
Mensaje: La conexión funciona correctamente. Necesitas ejecutar los scripts SQL para crear las tablas.
```

**Significa:** 
- La conexión funciona ✅
- Pero necesitas ejecutar los scripts SQL
- Ve a `INSTRUCCIONES_SQL.md` para crear las tablas

---

### ❌ Error de Conexión
```
❌ Error de conexión con Supabase
Error: [mensaje de error]
```

**Posibles causas:**
1. **Credenciales incorrectas** - Verifica `src/environments/environment.ts`
2. **Problema de red** - Verifica tu conexión a internet
3. **Proyecto no activo** - Verifica que el proyecto esté activo en Supabase

---

## 🛠️ Solución de Problemas

### Error: "Failed to fetch" o "Network error"
- Verifica tu conexión a internet
- Verifica que el proyecto esté activo en Supabase
- Revisa la consola del navegador para más detalles

### Error: "Invalid API key"
- Verifica que las credenciales en `src/environments/environment.ts` sean correctas
- Asegúrate de usar el `anon key` (publishable key), no el `service_role key`

### Error: "relation does not exist"
- Esto significa que la conexión funciona, pero las tablas no están creadas
- Ejecuta los scripts SQL (ve a `INSTRUCCIONES_SQL.md`)

### Error: "JWT expired" o "Invalid JWT"
- Las credenciales pueden haber cambiado
- Verifica en Supabase Dashboard → Settings → API
- Actualiza `src/environments/environment.ts`

---

## 📝 Verificar Credenciales

Si necesitas verificar o actualizar las credenciales:

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Verifica:
   - **Project URL**: Debe coincidir con `environment.ts`
   - **anon/public key**: Debe coincidir con `environment.ts`

---

## ✅ Checklist de Verificación

- [ ] Aplicación Angular iniciada (`npm start`)
- [ ] Navegador abierto en `http://localhost:4200/test-conexion`
- [ ] Componente de prueba muestra resultado
- [ ] Si hay error, revisé las credenciales
- [ ] Si falta tablas, ejecuté los scripts SQL

---

## 🎯 Siguiente Paso

Una vez que la conexión funcione:

1. **Si las tablas NO están creadas:**
   - Ejecuta los scripts SQL (ve a `INSTRUCCIONES_SQL.md`)

2. **Si las tablas YA están creadas:**
   - Puedes empezar a migrar datos de localStorage
   - Actualizar servicios para usar Supabase
   - Implementar operaciones CRUD

---

¿Necesitas ayuda? Revisa los mensajes de error y consulta la documentación de Supabase: https://supabase.com/docs

