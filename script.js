// ============================================
// 🔑 CONFIGURACIÓN DE SUPABASE
// ============================================
// Reemplazá estos valores con los de tu proyecto
const SUPABASE_URL = 'https://zkgtekqdraiktgybzejb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50AOWrJ9NGEVIC2QZQ_UyGg74dx';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
//  FUNCIÓN PRINCIPAL: CONSULTAR DNI
// ============================================
async function consultar() {
    const dni = document.getElementById('dniInput').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    // Ocultar cards anteriores
    document.getElementById('infoCard').style.display = 'none';
    document.getElementById('resumenCard').style.display = 'none';
    document.getElementById('cuotasCard').style.display = 'none';
    error.style.display = 'none';
    
    // Validar DNI
    if (!dni) {
        mostrarError('Por favor ingresá tu DNI');
        return;
    }
    
    // Mostrar loading
    loading.style.display = 'block';
    
    try {
        // 1️⃣ Buscar alumno por DNI
        const { data: alumno, error: errorAlumno } = await supabase
            .from('Alumnos')
            .select('*')
            .eq('DNI', dni)
            .single();
        
        if (errorAlumno || !alumno) {
            mostrarError('DNI no encontrado. Verificá el número e intentá de nuevo.');
            loading.style.display = 'none';
            return;
        }
        
        // 2️⃣ Buscar todas las cuotas del alumno
        const { data: cuotas, error: errorCuotas } = await supabase
            .from('Cuotas')
            .select('*')
            .eq('alumno_id', alumno.id)
            .order('vencimiento', { ascending: true });
        
        if (errorCuotas) {
            console.error('Error al cargar cuotas:', errorCuotas);
        }
        
        // 3️⃣ Llenar la interfaz con los datos
        llenarDatos(alumno, cuotas || []);
        
    } catch (err) {
        console.error('Error:', err);
        mostrarError('Ocurrió un error al consultar. Intentá de nuevo.');
    }
    
    loading.style.display = 'none';
}

// ============================================
// 📊 LLENAR DATOS EN LA INTERFAZ
// ============================================
function llenarDatos(alumno, cuotas) {
    // Mostrar las cards
    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'block';
    document.getElementById('cuotasCard').style.display = 'block';
    
    // --- Información del alumno ---
    document.getElementById('nombre').textContent = `${alumno.nombre} ${alumno.apellido}`;
    document.getElementById('dni').textContent = alumno.DNI;
    document.getElementById('carrera').textContent = alumno.carrera;
    document.getElementById('curso').textContent = alumno.Curso;
    
    // --- Calcular estadísticas ---
    const total = cuotas.length;
    const pagadas = cuotas.filter(c => c.Pagado === true).length;
    const pendientes = total - pagadas;
    
    document.getElementById('totalCuotas').textContent = total;
    document.getElementById('pagadas').textContent = pagadas;
    document.getElementById('pendientes').textContent = pendientes;
    
    // --- Estado actual ---
    const estadoEl = document.getElementById('estadoActual');
    if (pendientes === 0) {
        estadoEl.textContent = '● Al día';
        estadoEl.className = 'badge aldia';
    } else {
        estadoEl.textContent = '● Con deuda';
        estadoEl.className = 'badge';
        estadoEl.style.background = 'rgba(249, 115, 22, 0.15)';
        estadoEl.style.color = '#f97316';
    }
    
    // --- Último pago ---
    const ultimaPagada = cuotas
        .filter(c => c.Pagado === true)
        .sort((a, b) => new Date(b.vencimiento) - new Date(a.vencimiento))[0];
    
    if (ultimaPagada) {
        document.getElementById('ultimoPago').textContent = '📅 ' + formatearFecha(ultimaPagada.vencimiento);
    } else {
        document.getElementById('ultimoPago').textContent = 'Sin pagos';
    }
    
    // --- Lista de cuotas ---
    const cuotasList = document.getElementById('cuotasList');
    cuotasList.innerHTML = '';
    
    if (cuotas.length === 0) {
        cuotasList.innerHTML = '<p style="text-align:center; color:#8a94b8; padding:20px;">No hay cuotas registradas</p>';
    } else {
        cuotas.forEach(cuota => {
            const item = document.createElement('div');
            item.className = 'cuota-item';
            
            const estadoClass = cuota.Pagado ? 'pagada' : 'pendiente';
            const estadoTexto = cuota.Pagado ? 'Pagada' : 'Pendiente';
            const icono = cuota.Pagado ? 'check' : 'info';
            const fechaTexto = cuota.Pagado 
                ? formatearFecha(cuota.vencimiento) 
                : 'Vence: ' + formatearFecha(cuota.vencimiento);
            
            item.innerHTML = `
                <div class="cuota-icon ${estadoClass}">
                    <span class="material-icons-round" style="font-size:18px;">
                        ${icono}
                    </span>
                </div>
                <div class="cuota-info">
                    <div class="mes">${cuota.Concepto}</div>
                    <div class="tipo">Importe: $${cuota.importe.toLocaleString('es-AR')}</div>
                </div>
                <div class="cuota-status ${estadoClass}">
                    ${estadoTexto}
                    <span class="fecha">${fechaTexto}</span>
                </div>
            `;
            cuotasList.appendChild(item);
        });
    }
    
    // Scroll suave
    document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// 🛠️ FUNCIONES AUXILIARES
// ============================================
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function mostrarError(mensaje) {
    const error = document.getElementById('error');
    error.textContent = mensaje;
    error.style.display = 'block';
    setTimeout(() => { error.style.display = 'none'; }, 4000);
}

// Buscar con Enter
document.getElementById('dniInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') consultar();
});