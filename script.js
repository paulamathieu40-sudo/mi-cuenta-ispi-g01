const SUPABASE_URL = 'https://zkgtekqdraiktgybzejb.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50AOWrJ9NGEVIC2QZQ_UyGg74dx';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function consultar() {
    const dniInput = document.getElementById('dniInput');
    const dni = dniInput ? dniInput.value.trim() : '';
    
    if (!dni) {
        alert('Por favor, ingresá tu DNI.');
        return;
    }

    const btn = document.getElementById('btnConsultar');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="material-icons-round">sync</span> Buscando...';
    btn.disabled = true;

    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('infoCard').style.display = 'none';
    document.getElementById('resumenCard').style.display = 'none';
    document.getElementById('cuotasCard').style.display = 'none';

    try {
        const { data: alumno, error: errorAlumno } = await supabaseClient
            .from('alumnos')
            .select('*')
            .eq('dni', dni)
            .maybeSingle();

        if (errorAlumno || !alumno) {
            document.getElementById('error').textContent = 'DNI no encontrado. Verificá el número.';
            document.getElementById('error').style.display = 'block';
            return;
        }

        const { data: cuotas } = await supabaseClient
            .from('cuotas')
            .select('*')
            .eq('alumno_id', alumno.id)
            .order('vencimiento', { ascending: false });

        mostrarDatos(alumno, cuotas || []);

    } catch (err) {
        console.error('Error:', err);
        document.getElementById('error').textContent = 'Ocurrió un error al consultar.';
        document.getElementById('error').style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
        const btn = document.getElementById('btnConsultar');
        btn.innerHTML = '<span class="material-icons-round">search</span> Consultar';
        btn.disabled = false;
    }
}

function mostrarDatos(alumno, cuotas) {
    document.getElementById('nombre').textContent = `${alumno.nombre || ''} ${alumno.apellido || ''}`.trim() || 'No especificado';
    document.getElementById('dni').textContent = alumno.dni || 'No especificado';
    document.getElementById('carrera').textContent = alumno.carrera || 'No especificada';
    document.getElementById('curso').textContent = alumno.curso || alumno.Curso || 'No especificado';

    const total = cuotas.length;
    const pagadas = cuotas.filter(c => c.Pagado === true || c.Pagado === 'true' || c.pagado === true).length;
    const pendientes = total - pagadas;

    document.getElementById('totalCuotas').textContent = total;
    document.getElementById('pagadas').textContent = pagadas;
    document.getElementById('pendientes').textContent = pendientes;

    const estadoEl = document.getElementById('estadoActual');
    if (pendientes === 0 && total > 0) {
        estadoEl.textContent = 'Al día'; estadoEl.className = 'badge aldia';
    } else if (pendientes > 0) {
        estadoEl.textContent = 'Con deuda'; estadoEl.className = 'badge condeuda';
    } else {
        estadoEl.textContent = 'Sin cuotas'; estadoEl.className = 'badge';
    }

    const ultimoPago = cuotas.find(c => c.Pagado === true || c.Pagado === 'true' || c.pagado === true);
    document.getElementById('ultimoPago').textContent = ultimoPago 
        ? new Date(ultimoPago.vencimiento).toLocaleDateString('es-AR') 
        : 'Sin registros';

    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'block';
    document.getElementById('cuotasCard').style.display = 'block';

    const cuotasList = document.getElementById('cuotasList');
    cuotasList.innerHTML = '';

    if (cuotas.length === 0) {
        cuotasList.innerHTML = '<p style="text-align:center; color:#8a94b8; padding:20px;">No hay cuotas registradas.</p>';
    } else {
        cuotas.forEach(cuota => {
            const item = document.createElement('div');
            item.className = 'cuota-item';
            const estaPagada = cuota.Pagado === true || cuota.Pagado === 'true' || cuota.pagado === true;
            const estadoClase = estaPagada ? 'pagada' : 'pendiente';
            const icono = estaPagada ? 'check' : 'info';
            const textoEstado = estaPagada ? 'Pagada' : 'Pendiente';
            
            let fecha = 'Sin fecha';
            if (cuota.vencimiento) {
                try { fecha = new Date(cuota.vencimiento).toLocaleDateString('es-AR'); } 
                catch (e) { fecha = cuota.vencimiento; }
            }

            item.innerHTML = `
                <div class="cuota-icon ${estadoClase}"><span class="material-icons-round">${icono}</span></div>
                <div class="cuota-info">
                    <div class="mes">${cuota.Concepto || cuota.concepto || 'Cuota'}</div>
                    <div class="tipo">Importe: $${cuota.importe || '0'}</div>
                    <div class="tipo" style="font-size:11px; margin-top:2px;">Vence: ${fecha}</div>
                </div>
                <div class="cuota-status ${estadoClase}">${textoEstado}</div>
            `;
            cuotasList.appendChild(item);
        });
    }
    
    setTimeout(() => {
        document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ACÁ ESTÁ LA CLAVE: Asignamos el evento al botón directamente desde JS
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnConsultar');
    if (btn) {
        btn.addEventListener('click', consultar);
    }
});
// Función para volver al inicio
function volverInicio() {
    document.querySelectorAll('.card').forEach(card => {
        if (!card.classList.contains('search-card') && !card.classList.contains('accesos-card')) {
            card.style.display = 'none';
        }
    });
    document.querySelector('.search-card').style.display = 'block';
    document.querySelector('.accesos-card').style.display = 'block';
}

// Función para mostrar una sección específica
function mostrarSeccion(idSeccion) {
    document.querySelector('.search-card').style.display = 'none';
    document.querySelector('.accesos-card').style.display = 'none';
    document.querySelectorAll('.card').forEach(card => {
        if (card.id !== idSeccion) card.style.display = 'none';
    });
    document.getElementById(idSeccion).style.display = 'block';
}

// Conectar botones de accesos rápidos
document.addEventListener('DOMContentLoaded', () => {
    const quickBtns = document.querySelectorAll('.quick-btn');
    if (quickBtns[0]) quickBtns[0].onclick = () => mostrarSeccion('historialCard');
    if (quickBtns[1]) quickBtns[1].onclick = () => mostrarSeccion('comprobantesCard');
    if (quickBtns[2]) quickBtns[2].onclick = () => mostrarSeccion('academicaCard');
    if (quickBtns[3]) quickBtns[3].onclick = () => mostrarSeccion('ayudaCard');
});

// Función para descargar comprobante
function descargarComprobante(dni, concepto, fecha, importe) {
    const contenido = `COMPROBANTE DE PAGO\n===================\n\nAlumno DNI: ${dni}\nConcepto: ${concepto}\nFecha: ${fecha}\nImporte: $${importe}\n\nEstado: PAGADO\n===================\nGenerado el: ${new Date().toLocaleDateString('es-AR')}`;
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_${dni}_${concepto.replace(/\s/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}