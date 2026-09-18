// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE (¡REEMPLAZÁ ESTO!)
// ==========================================
const SUPABASE_URL = 'https://zkgtekqdraiktgybzejb.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50AOWrJ9NGEVIC2QZQ_UyGg74dx';

// Inicializar cliente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Script cargado. URL:', SUPABASE_URL);

// ==========================================
// 2. FUNCIÓN PRINCIPAL: CONSULTAR
// ==========================================
async function consultar() {
    console.log('🔍 Iniciando consulta...');
    
    const dniInput = document.getElementById('dniInput');
    const dni = dniInput ? dniInput.value.trim() : '';
    
    if (!dni) {
        alert('Por favor, ingresá tu DNI.');
        return;
    }

    // Efecto visual en el botón
    const btn = document.querySelector('.btn-primary');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="material-icons-round">sync</span> Buscando...';
    btn.disabled = true;

    try {
        // 1. Buscar el alumno en la tabla 'alumnos'
        const { data: alumno, error: errorAlumno } = await supabase
            .from('alumnos')
            .select('*')
            .eq('dni', dni)
            .single();

        if (errorAlumno || !alumno) {
            console.error('❌ Error al buscar alumno:', errorAlumno);
            alert('DNI no encontrado. Verificá el número e intentá de nuevo.');
            return;
        }

        console.log('✅ Alumno encontrado:', alumno);

        // 2. Buscar las cuotas del alumno en la tabla 'cuotas'
        const { data: cuotas, error: errorCuotas } = await supabase
            .from('cuotas')
            .select('*')
            .eq('alumno_id', alumno.id)
            .order('vencimiento', { ascending: false });

        if (errorCuotas) {
            console.error('⚠️ Error al buscar cuotas:', errorCuotas);
        }

        console.log('📊 Cuotas encontradas:', cuotas ? cuotas.length : 0);

        // 3. Mostrar los datos en la pantalla
        mostrarDatos(alumno, cuotas || []);

    } catch (err) {
        console.error('💥 Error inesperado:', err);
        alert('Ocurrió un error al consultar. Revisá la consola (F12).');
    } finally {
        // Restaurar botón
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// 3. FUNCIÓN: MOSTRAR DATOS EN PANTALLA
// ==========================================
function mostrarDatos(alumno, cuotas) {
    console.log('🎨 Actualizando la interfaz...');

    // 1. Datos del alumno
    document.getElementById('nombre').textContent = `${alumno.nombre} ${alumno.apellido}`;
    document.getElementById('dni').textContent = alumno.dni;
    document.getElementById('carrera').textContent = alumno.carrera || 'No especificada';
    document.getElementById('curso').textContent = alumno.Curso || 'No especificado';

    // 2. Calcular estadísticas de cuotas
    const total = cuotas.length;
    const pagadas = cuotas.filter(c => c.Pagado === true).length;
    const pendientes = total - pagadas;

    document.getElementById('totalCuotas').textContent = total;
    document.getElementById('pagadas').textContent = pagadas;
    document.getElementById('pendientes').textContent = pendientes;

    // 3. Estado actual
    const estadoEl = document.getElementById('estadoActual');
    if (pendientes === 0 && total > 0) {
        estadoEl.textContent = 'Al día';
        estadoEl.className = 'badge aldia';
    } else if (pendientes > 0) {
        estadoEl.textContent = 'Con deuda';
        estadoEl.className = 'badge condeuda';
    } else {
        estadoEl.textContent = 'Sin cuotas';
        estadoEl.className = 'badge';
    }

    // 4. Último pago
    const ultimoPago = cuotas.find(c => c.Pagado === true);
    document.getElementById('ultimoPago').textContent = ultimoPago 
        ? new Date(ultimoPago.vencimiento).toLocaleDateString('es-AR') 
        : 'Sin registros';

    // 5. Mostrar las tarjetas (que estaban ocultas con display:none)
    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'block';
    document.getElementById('cuotasCard').style.display = 'block';

    // 6. Renderizar la lista de cuotas
    const cuotasList = document.getElementById('cuotasList');
    cuotasList.innerHTML = ''; // Limpiar lista anterior

    if (cuotas.length === 0) {
        cuotasList.innerHTML = '<p style="text-align:center; color:#8a94b8; padding:20px;">No hay cuotas registradas.</p>';
    } else {
        cuotas.forEach(cuota => {
            const item = document.createElement('div');
            item.className = 'cuota-item';
            
            const estaPagada = cuota.Pagado === true;
            const estadoClase = estaPagada ? 'pagada' : 'pendiente';
            const icono = estaPagada ? 'check' : 'info';
            const textoEstado = estaPagada ? 'Pagada' : 'Pendiente';
            const fecha = cuota.vencimiento ? new Date(cuota.vencimiento).toLocaleDateString('es-AR') : 'Sin fecha';

            item.innerHTML = `
                <div class="cuota-icon ${estadoClase}">
                    <span class="material-icons-round">${icono}</span>
                </div>
                <div class="cuota-info">
                    <div class="mes">${cuota.Concepto || 'Cuota'}</div>
                    <div class="tipo">Importe: $${cuota.importe || '0'}</div>
                    <div class="tipo" style="font-size:11px; margin-top:2px;">Vence: ${fecha}</div>
                </div>
                <div class="cuota-status ${estadoClase}">
                    ${textoEstado}
                </div>
            `;
            cuotasList.appendChild(item);
        });
    }

    // 7. Scroll suave hacia la información
    setTimeout(() => {
        document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    console.log('✅ Interfaz actualizada con éxito');
}

// Hacer la función disponible globalmente para el onclick del HTML
window.consultar = consultar;