# Script para crear issues en GitHub
# Requiere un token de GitHub con permisos de repo
# Uso: .\create-issues.ps1 -Token "tu_token_aqui"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    [string]$Owner = "FrancoVivass",
    [string]$Repo = "AS-Academic-System"
)

$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

$baseUrl = "https://api.github.com/repos/$Owner/$Repo/issues"

# Array de issues
$issues = @(
    @{
        title = "Bug en modo oscuro al poner credencial"
        body = "A la hora de poner credencial el modo oscuro está bugueado."
        labels = @("bug", "modo-oscuro", "alta-prioridad")
    },
    @{
        title = "Modo oscuro no funciona en inicio de sesión del centro universitario"
        body = "En la parte de iniciar sesión en el centro universitario no anda el modo oscuro."
        labels = @("bug", "modo-oscuro", "alta-prioridad")
    },
    @{
        title = "Cambiar color de la pestaña de redes sociales"
        body = "Cambiaría el color de la pestaña de las redes sociales."
        labels = @("mejora", "diseño", "media-prioridad")
    },
    @{
        title = "Eliminar tiempo en registro"
        body = "A la hora de registrarte sacaría el tiempo porque tapa las casillas para llenar y no queda muy piola."
        labels = @("mejora", "ui", "media-prioridad")
    },
    @{
        title = "Botón 'Olvidé mi contraseña' redirige incorrectamente"
        body = "Cuando tocas el botón de 'olvidé mi contraseña' te manda devuelta a la pantalla de inicio."
        labels = @("bug", "login", "alta-prioridad")
    },
    @{
        title = "Agregar apartado de mensajes en Dashboard Profesor"
        body = "En el 'Dashboard Profesor' agregaría un apartado para ver/Mandar mensajes a los alumnos."
        labels = @("feature", "dashboard", "media-prioridad")
    },
    @{
        title = "No aparecen alumnos en 'estados de mis curso' y 'mis materias'"
        body = "En 'estados de mis curso' y en 'mis materias' aparece que no tengo alumnos."
        labels = @("bug", "mis-materias", "alta-prioridad")
    },
    @{
        title = "Números de estadísticas muy grandes en gestión de alumnos"
        body = "En gestión de alumnos los números de estadísticas de la materia se ven muy grandes."
        labels = @("mejora", "ui", "media-prioridad")
    },
    @{
        title = "Espaciado entre opciones en gestión de alumnos"
        body = "En gestión de alumnos en la opción 'seleccione una carrera para ver a los alumnos' está muy cerca de la opción 'Filtrar por cursos'."
        labels = @("mejora", "ui", "baja-prioridad")
    },
    @{
        title = "Búsqueda de alumnos no funciona"
        body = "En gestión de alumnos cuando voy a la opción 'Buscar alumno' no me busca."
        labels = @("bug", "búsqueda", "alta-prioridad")
    },
    @{
        title = "Sistema de mensajería privada"
        body = "Estaría bueno que haya una opción para mandar mensajes privados a los alumnos, así también como al curso completo u otros profesores."
        labels = @("feature", "mensajería", "media-prioridad")
    },
    @{
        title = "Mejorar funcionalidad de 'Mis Materias'"
        body = "En 'mis materias' estaría bueno que sea más completo, como entrar al curso directamente, ver las tareas, nombre de los alumnos o que haya atajos que te lleven directamente ahí."
        labels = @("feature", "mis-materias", "media-prioridad")
    },
    @{
        title = "Opción en blanco en 'todos los cursos'"
        body = "En 'mis materias' cuando toco la opción 'todos los cursos' en vez de aparecerme el curso 'Marica' me aparece una opción en blanco."
        labels = @("bug", "mis-materias", "media-prioridad")
    },
    @{
        title = "Opción de carrera no se guarda al editar nota"
        body = "En 'Gestión de notas' a la hora de editar la nota debería guardarse la opción 'Seleccione una carrera'."
        labels = @("bug", "notas", "media-prioridad")
    },
    @{
        title = "Filtro por materia no funciona en reportes"
        body = "En 'Reportes y Estadísticas' la opción de 'Filtrar por materia' no anda."
        labels = @("bug", "reportes", "alta-prioridad")
    },
    @{
        title = "Abrir mensajes en mensajería"
        body = "En mensajería estaría para que se pudiera abrir los mensajes que te mandan o mandas."
        labels = @("feature", "mensajería", "media-prioridad")
    },
    @{
        title = "El modo oscuro de la página no funciona"
        body = "El modo oscuro de la página no funciona."
        labels = @("bug", "modo-oscuro", "alta-prioridad")
    },
    @{
        title = "Botón de asistencia al cliente cierra sesión"
        body = "En 'ayuda' el botón de asistencia al cliente te cierra sesión."
        labels = @("bug", "ayuda", "alta-prioridad")
    },
    @{
        title = "Fechas de eventos aparecen mal en calendario"
        body = "En calendario las fechas de los eventos aparecen mal."
        labels = @("bug", "calendario", "alta-prioridad")
    },
    @{
        title = "Eventos borrados siguen marcados en calendario"
        body = "En calendario quedan marcados eventos que ya se borraron, y a veces cuando haces un evento para el mes que viene no aparece el puntito en el calendario."
        labels = @("bug", "calendario", "alta-prioridad")
    },
    @{
        title = "Mensajería de soporte en ayuda"
        body = "En ayuda estaría bueno que haya una mensajería para contactarse con el soporte para enviar las dudas que uno tenga acerca de la página u otra cosa que no tenga que ver con el profesor."
        labels = @("feature", "ayuda", "baja-prioridad")
    },
    @{
        title = "Botón de configuración y perfil llevan al mismo lugar"
        body = "El botón de configuración y perfil te lleva al mismo lugar."
        labels = @("bug", "navegación", "media-prioridad")
    },
    @{
        title = "Agregar notificaciones/mensajes en header"
        body = "Pondría arriba a la derecha como un globito para ver los mensajes o notificaciones."
        labels = @("feature", "ui", "media-prioridad")
    },
    @{
        title = "Sistema de tareas para profesores y alumnos"
        body = "Agregaría una pestaña para que los profesores puedan cargar tareas y los alumnos subirlas."
        labels = @("feature", "tareas", "media-prioridad")
    }
)

Write-Host "Creando issues en GitHub..." -ForegroundColor Green
Write-Host "Total de issues a crear: $($issues.Count)" -ForegroundColor Yellow

foreach ($issue in $issues) {
    $body = @{
        title = $issue.title
        body = $issue.body
        labels = $issue.labels
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "✓ Issue creado: $($issue.title)" -ForegroundColor Green
        Start-Sleep -Milliseconds 500  # Rate limiting
    }
    catch {
        Write-Host "✗ Error al crear issue: $($issue.title)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nProceso completado!" -ForegroundColor Green

