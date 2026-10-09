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

        const { data: cuotasData } = await supabaseClient
            .from('cuotas')
            .select('*')
            .eq('alumno_id', alumnoActual.id)
            .order('vencimiento', { ascending: true });

        const totalCuotas = cuotasData ? cuotasData.length : 0;
        const cuotasPagadas = cuotasData ? cuotasData.filter(c => c.pagado === true).length : 0;
        const cuotasPendientes = totalCuotas - cuotasPagadas;

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
            const hayMora = cuotasData.some(c => c.pagado === false && new Date(c.vencimiento) < hoy);
            if (hayMora) estadoActual = 'Con mora';
        }

        document.getElementById('totalCuotas').textContent = totalCuotas;
        document.getElementById('pagadas').textContent = cuotasPagadas;
        document.getElementById('pendientes').textContent = cuotasPendientes;
        document.getElementById('estadoActual').textContent = estadoActual;
        document.getElementById('ultimoPago').textContent = ultimoPago;

        const cuotasList = document.getElementById('cuotasList');
        if (cuotasData && cuotasData.length > 0) {
            cuotasList.innerHTML = cuotasData.map(cuota => {
                const estado = cuota.pagado ? 'pagada' : 'pendiente';
                const concepto = cuota.concepto || 'Cuota';
                const vencimiento = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
                const importe = cuota.importe || 0;
                const estadoTexto = cuota.pagado ? '✓ Pagada' : '⏳ Pendiente';
                const estadoClase = cuota.pagado ? 'pagado' : 'pendiente';
                return '<div class="cuota-item ' + estado + '">' +
                    '<div class="cuota-info">' +
                    '<span class="cuota-concepto">' + concepto + '</span>' +
                    '<span class="cuota-vencimiento">Vence: ' + vencimiento + '</span>' +
                    '</div>' +
                    '<div class="cuota-monto">' +
                    '<span class="cuota-importe">$' + importe + '</span>' +
                    '<span class="cuota-estado ' + estadoClase + '">' + estadoTexto + '</span>' +
                    '</div></div>';
            }).join('');
        } else {
            cuotasList.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay cuotas registradas</p>';
        }

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

function abrirHistorial() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }
    mostrarSeccion('historialCard');

    const container = document.getElementById('historialContent') || document.getElementById('historialCard');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#cbd5e1;">Cargando historial...</p>';

    supabaseClient
        .from('cuotas')
        .select('*')
        .eq('alumno_id', alumnoActual.id)
        .eq('pagado', true)
        .order('vencimiento', { ascending: false })
        .then(function(respuesta) {
            const data = respuesta.data;
            const error = respuesta.error;
            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay pagos registrados aún.</p>';
                return;
            }

            let html = '<div style="padding: 20px;">';
            html += '<h3 style="margin-bottom: 15px; color: #f8fafc;">Historial de Pagos</h3>';
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';

            data.forEach(function(cuota) {
                const concepto = cuota.concepto || 'Cuota';
                const vencimiento = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
                const importe = cuota.importe || 0;
                html += '<div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80; display: flex; justify-content: space-between; align-items: center;">';
                html += '<div><span style="font-weight: bold; color: #4ade80; display: block;">✓ ' + concepto + '</span>';
                html += '<span style="font-size: 0.9em; color: #cbd5e1;">Vencimiento: ' + vencimiento + '</span></div>';
                html += '<span style="color: #4ade80; font-weight: bold; font-size: 1.2em;">$' + importe + '</span>';
                html += '</div>';
            });

            html += '</div></div>';
            container.innerHTML = html;
        })
        .catch(function(err) {
            console.error('Error al cargar historial:', err);
            container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar el historial.</p>';
        });
}

async function abrirComprobantes() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }

    mostrarSeccion('comprobantesCard');

    const container = document.getElementById('comprobantesListContainer') || document.getElementById('comprobantesCard');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#cbd5e1;">Cargando comprobantes...</p>';

    try {
        const { data: cuotasPagadas, error } = await supabaseClient
            .from('cuotas')
            .select('*')
            .eq('alumno_id', alumnoActual.id)
            .eq('pagado', true)
            .order('vencimiento', { ascending: false });

        if (error) throw error;

        if (!cuotasPagadas || cuotasPagadas.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No tenés comprobantes de pago disponibles aún.</p>';
            return;
        }

        let html = '<div style="padding: 20px;">';
        html += '<h3 style="margin-bottom: 15px; color: #f8fafc;">Tus Comprobantes de Pago</h3>';
        html += '<div style="display: flex; flex-direction: column; gap: 10px;">';

        cuotasPagadas.forEach(function(cuota, index) {
            const concepto = cuota.concepto || 'Cuota Mensual';
            const importe = cuota.importe || 0;
            const vencimiento = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
            const btnId = 'btn-descarga-' + index;

            html += '<div class="cuota-item pagada" style="display: flex; justify-content: space-between; align-items: center; background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80;">';
            html += '<div class="cuota-info">';
            html += '<span style="font-weight: bold; color: #4ade80; display: block;">✓ ' + concepto + '</span>';
            html += '<span style="font-size: 0.9em; color: #cbd5e1;">Monto: $' + importe + ' | Vencimiento: ' + vencimiento + '</span>';
            html += '</div>';
            html += '<button id="' + btnId + '" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">⬇ Descargar</button>';
            html += '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;

        cuotasPagadas.forEach(function(cuota, index) {
            const btn = document.getElementById('btn-descarga-' + index);
            if (btn) {
                btn.addEventListener('click', function() {
                    generarYDescargarComprobante(cuota.concepto || 'Cuota', cuota.importe || 0, cuota.vencimiento);
                });
            }
        });

    } catch (err) {
        console.error('Error al cargar comprobantes:', err);
        container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar los comprobantes.</p>';
    }
}

function generarYDescargarComprobante(concepto, importe, vencimiento) {
    if (!alumnoActual) {
        alert('Error: No hay alumno seleccionado.');
        return;
    }

    const fechaEmision = new Date().toLocaleDateString('es-AR');
    const fechaVenc = new Date(vencimiento).toLocaleDateString('es-AR');

    const texto = '========================================\n' +
        '       COMPROBANTE DE PAGO\n' +
        '========================================\n' +
        'Fecha de emisión: ' + fechaEmision + '\n\n' +
        'DATOS DEL ALUMNO:\n' +
        'Nombre: ' + (alumnoActual.nombre || 'N/A') + '\n' +
        'DNI: ' + (alumnoActual.dni || 'N/A') + '\n' +
        'Carrera: ' + (alumnoActual.carrera || 'N/A') + '\n\n' +
        'DETALLE DEL PAGO:\n' +
        'Concepto: ' + concepto + '\n' +
        'Importe: $' + importe + '\n' +
        'Vencimiento: ' + fechaVenc + '\n' +
        'Estado: PAGADO\n' +
        '========================================';

    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nombreArchivo = 'Comprobante_' + alumnoActual.dni + '_' + Date.now() + '.txt';

    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();

    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function abrirInfoAcademica() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }

    const content = document.getElementById('infoAcademicaContent');
    if (!content) {
        mostrarSeccion('infoAcademicaCard');
        return;
    }

    const nombre = alumnoActual.nombre || 'No disponible';
    const dni = alumnoActual.dni || 'No disponible';
    const carrera = alumnoActual.carrera || 'No disponible';
    const anio = alumnoActual.anio || alumnoActual.curso || 'No disponible';

    content.innerHTML = '<div class="info-grid">' +
        '<div class="info-item"><span class="info-label">Alumno:</span><span class="info-value">' + nombre + '</span></div>' +
        '<div class="info-item"><span class="info-label">DNI:</span><span class="info-value">' + dni + '</span></div>' +
        '<div class="info-item"><span class="info-label">Carrera:</span><span class="info-value">' + carrera + '</span></div>' +
        '<div class="info-item"><span class="info-label">Año/Curso:</span><span class="info-value">' + anio + '</span></div>' +
        '</div>';

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

    const container = document.getElementById('perfilInfo') || document.getElementById('perfilContent') || document.getElementById('perfilCard');
    if (!container) {
        console.error('No se encontró el contenedor de perfil');
        return;
    }

    const nombre = alumnoActual.nombre || 'No disponible';
    const dni = alumnoActual.dni || 'No disponible';
    const carrera = alumnoActual.carrera || 'No disponible';
    const anio = alumnoActual.curso || alumnoActual.anio || 'No disponible';
    const inicial = nombre.charAt(0).toUpperCase();
    const estado = document.getElementById('estadoActual') ? document.getElementById('estadoActual').textContent : 'Al día';

    container.innerHTML = '<div style="padding: 20px;">' +
        '<div style="text-align: center; margin-bottom: 20px;">' +
        '<div style="width: 80px; height: 80px; background: #3b82f6; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; color: white; font-weight: bold;">' + inicial + '</div>' +
        '</div>' +
        '<h4 style="color: #f8fafc; text-align: center; margin-bottom: 5px;">' + nombre + '</h4>' +
        '<p style="color: #94a3b8; text-align: center; margin-bottom: 20px;">Alumno</p>' +
        '<div style="display: grid; gap: 12px;">' +
        '<div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">' +
        '<span style="color: #94a3b8; display: block; font-size: 0.9em;">DNI</span>' +
        '<span style="color: #f8fafc; font-weight: bold; font-size: 1.1em;">' + dni + '</span>' +
        '</div>' +
        '<div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">' +
        '<span style="color: #94a3b8; display: block; font-size: 0.9em;">Carrera</span>' +
        '<span style="color: #f8fafc; font-weight: bold; font-size: 1.1em;">' + carrera + '</span>' +
        '</div>' +
        '<div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">' +
        '<span style="color: #94a3b8; display: block; font-size: 0.9em;">Curso/Año</span>' +
        '<span style="color: #f8fafc; font-weight: bold; font-size: 1.1em;">' + anio + '</span>' +
        '</div>' +
        '<div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80;">' +
        '<span style="color: #4ade80; display: block; font-size: 0.9em;">Estado de cuenta</span>' +
        '<span style="color: #4ade80; font-weight: bold; font-size: 1.1em;">' + estado + '</span>' +
        '</div>' +
        '</div></div>';
}

document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btnConsultar');
    if (btn) {
        btn.addEventListener('click', consultar);
    }

    const input = document.getElementById('dniInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                consultar();
            }
        });
    }
});