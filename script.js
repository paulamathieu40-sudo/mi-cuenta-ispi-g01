const SUPABASE_URL = 'https://zkgtekqdraiktgybzejb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50AOWrJ9NGEVIC2QZQ_UyGg74dx';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

let alumnoActual = null;
let cuotasActuales = [];
async function consultar() {
    const dniInput = document.getElementById('dniInput');
    const dni = dniInput.value.trim().replace(/[^0-9]/g, '');
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    // Ocultar resultados anteriores
    document.getElementById('infoCard').style.display = 'none';
    document.getElementById('resumenCard').style.display = 'none';
    document.getElementById('cuotasCard').style.display = 'none';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    if (!dni || dni.length < 7) {
        errorDiv.textContent = 'Por favor, ingresá un DNI válido (mínimo 7 dígitos).';
        errorDiv.style.display = 'block';
        return;
    }

    loading.style.display = 'block';
    try {
        // ⚠️ FIJATE QUE DIGA supabaseClient (con "Client" al final)
        const { data, error } = await supabaseClient
            .from('alumnos')
            .select('*')
            .eq('dni', dni)
            .single();

        if (error || !data) {
            throw new Error('DNI no encontrado. Verificá el número.');
        }

        alumnoActual = data;

        document.getElementById('nombre').textContent = data.nombre || 'No disponible';
        document.getElementById('dni').textContent = data.dni || 'No disponible';
        document.getElementById('carrera').textContent = data.carrera || 'No disponible';
        document.getElementById('curso').textContent = data.curso || data.anio || 'No disponible';
        // === CALCULAR Y MOSTRAR CIFRAS DE CUOTAS ===
        
        // Buscar las cuotas del alumno
        const { data: cuotasData } = await supabaseClient
            .from('cuotas')
            .select('*')
        .eq('alumno_id', alumnoActual.id)
            .order('vencimiento', { ascending: true });

        const totalCuotas = cuotasData ? cuotasData.length : 0;
        const cuotasPagadas = cuotasData ? cuotasData.filter(c => c.pagado === true).length : 0;
        const cuotasPendientes = totalCuotas - cuotasPagadas;

        // Estado actual y último pago
        let estadoActual = 'Al día';
        let ultimoPago = 'Sin pagos';

        if (cuotasData && cuotasData.length > 0) {
            const ultimoPagoData = cuotasData
                .filter(c => c.pagado === true)
                .sort((a, b) => new Date(b.vencimiento) - new Date(a.vencimiento))[0];

            if (ultimoPagoData) {
                ultimoPago = new Date(ultimoPagoData.vencimiento).toLocaleDateString('es-AR');
            }

            const hoy = new Date();
            const hayMora = cuotasData.some(c => 
                c.pagado === false && new Date(c.vencimiento) < hoy
            );

            if (hayMora) estadoActual = 'Con mora';
        }

        // Mostrar las cifras en el HTML
        document.getElementById('totalCuotas').textContent = totalCuotas;
        document.getElementById('pagadas').textContent = cuotasPagadas;
        document.getElementById('pendientes').textContent = cuotasPendientes;
        document.getElementById('estadoActual').textContent = estadoActual;
        document.getElementById('ultimoPago').textContent = ultimoPago;

        // Mostrar detalle de cuotas
        const cuotasList = document.getElementById('cuotasList');
        if (cuotasData && cuotasData.length > 0) {
            cuotasList.innerHTML = cuotasData.map(cuota => `
                <div class="cuota-item ${cuota.pagado ? 'pagada' : 'pendiente'}">
                    <div class="cuota-info">
                        <span class="cuota-concepto">${cuota.concepto || 'Cuota'}</span>
                        <span class="cuota-vencimiento">Vence: ${new Date(cuota.vencimiento).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div class="cuota-monto">
                        <span class="cuota-importe">$${cuota.importe || 0}</span>
                        <span class="cuota-estado ${cuota.pagado ? 'pagado' : 'pendiente'}">
                            ${cuota.pagado ? '✓ Pagada' : '⏳ Pendiente'}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            cuotasList.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay cuotas registradas</p>';
        }

        // === FIN DE CIFRAS DE CUOTAS ===
        document.getElementById('infoCard').style.display = 'block';
        document.getElementById('resumenCard').style.display = 'block';
        document.getElementById('cuotasCard').style.display = 'block';

    } catch (err) {
        console.error('Error al consultar:', err);
        errorDiv.textContent = err.message || 'Error al buscar. Intentá de nuevo.';
        errorDiv.style.display = 'block';
        alumnoActual = null;
    } finally {
        loading.style.display = 'none';
    }
}

// ==========================================
// FUNCIONES DE NAVEGACIÓN
// ==========================================
function mostrarSeccion(id) {
    const detalles = ['historialCard', 'comprobantesCard', 'infoAcademicaCard', 'ayudaCard', 'perfilCard'];
    detalles.forEach(cardId => {
        const el = document.getElementById(cardId);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(id);
    if (target) {
        target.style.display = 'block';
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function volverInicio() {
    const detalles = ['historialCard', 'comprobantesCard', 'infoAcademicaCard', 'ayudaCard', 'perfilCard'];
    detalles.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (alumnoActual) {
        document.getElementById('infoCard').style.display = 'block';
        document.getElementById('resumenCard').style.display = 'block';
        document.getElementById('cuotasCard').style.display = 'block';
    }
}

function irAEstado() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }
    document.getElementById('resumenCard').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// FUNCIONES DE LOS 4 BOTONES
// ==========================================

function abrirHistorial() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('historialCard');
}

function abrirComprobantes() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('comprobantesCard');
}

function abrirInfoAcademica() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }

    const content = document.getElementById('infoAcademicaContent');
    content.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Alumno:</span>
                <span class="info-value">${alumnoActual.nombre || 'No disponible'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">DNI:</span>
                <span class="info-value">${alumnoActual.dni || 'No disponible'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Carrera:</span>
                <span class="info-value">${alumnoActual.carrera || 'No disponible'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Año/Curso:</span>
                <span class="info-value">${alumnoActual.anio || alumnoActual.curso || 'No disponible'}</span>
            </div>
        </div>
    `;
    mostrarSeccion('infoAcademicaCard');
}

function abrirAyuda() {
    mostrarSeccion('ayudaCard');
}

function abrirPerfil() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }
    mostrarSeccion('perfilCard');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnConsultar');
    if (btn) {
        btn.addEventListener('click', consultar);
    }
    
    const input = document.getElementById('dniInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                consultar();
            }
        });
    }
});