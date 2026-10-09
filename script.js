var SUPABASE_URL = 'https://zkgtekqdraiktgybzejb.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_of5g50AOWrJ9NGEVIC2QZQ_UyGg74dx';
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
var alumnoActual = null;

async function consultar() {
    var dniInput = document.getElementById('dniInput');
    var dni = dniInput.value.trim().replace(/[^0-9]/g, '');
    var loading = document.getElementById('loading');
    var errorDiv = document.getElementById('error');
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
        var result = await supabaseClient.from('alumnos').select('*').eq('dni', dni).single();
        var data = result.data;
        var error = result.error;
        if (error || !data) { throw new Error('DNI no encontrado.'); }
        alumnoActual = data;
        document.getElementById('nombre').textContent = data.nombre || 'No disponible';
        document.getElementById('dni').textContent = data.dni || 'No disponible';
        document.getElementById('carrera').textContent = data.carrera || 'No disponible';
        document.getElementById('curso').textContent = data.curso || data.anio || 'No disponible';
        var cuotasResult = await supabaseClient.from('cuotas').select('*').eq('alumno_id', alumnoActual.id).order('vencimiento', { ascending: true });
        var cuotasData = cuotasResult.data;
        var totalCuotas = cuotasData ? cuotasData.length : 0;
        var cuotasPagadas = cuotasData ? cuotasData.filter(function(c) { return c.pagado === true; }).length : 0;
        var cuotasPendientes = totalCuotas - cuotasPagadas;
        var estadoActual = 'Al día';
        var ultimoPago = 'Sin pagos';
        if (cuotasData && cuotasData.length > 0) {
            var pagadas = cuotasData.filter(function(c) { return c.pagado === true; });
            if (pagadas.length > 0) {
                pagadas.sort(function(a, b) { return new Date(b.vencimiento) - new Date(a.vencimiento); });
                ultimoPago = new Date(pagadas[0].vencimiento).toLocaleDateString('es-AR');
            }
            var hoy = new Date();
            var hayMora = cuotasData.some(function(c) { return c.pagado === false && new Date(c.vencimiento) < hoy; });
            if (hayMora) estadoActual = 'Con mora';
        }
        document.getElementById('totalCuotas').textContent = totalCuotas;
        document.getElementById('pagadas').textContent = cuotasPagadas;
        document.getElementById('pendientes').textContent = cuotasPendientes;
        document.getElementById('estadoActual').textContent = estadoActual;
        document.getElementById('ultimoPago').textContent = ultimoPago;
        var cuotasList = document.getElementById('cuotasList');
        if (cuotasData && cuotasData.length > 0) {
            var html = '';
            for (var i = 0; i < cuotasData.length; i++) {
                var cuota = cuotasData[i];
                var estado = cuota.pagado ? 'pagada' : 'pendiente';
                var concepto = cuota.concepto || 'Cuota';
                var vencimiento = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
                var importe = cuota.importe || 0;
                var estadoTexto = cuota.pagado ? 'Pagada' : 'Pendiente';
                html += '<div class="cuota-item ' + estado + '"><div class="cuota-info"><span class="cuota-concepto">' + concepto + '</span><span class="cuota-vencimiento">Vence: ' + vencimiento + '</span></div><div class="cuota-monto"><span class="cuota-importe">$' + importe + '</span><span class="cuota-estado">' + estadoTexto + '</span></div></div>';
            }
            cuotasList.innerHTML = html;
        } else {
            cuotasList.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay cuotas registradas</p>';
        }
        document.getElementById('infoCard').style.display = 'block';
        document.getElementById('resumenCard').style.display = 'block';
        document.getElementById('cuotasCard').style.display = 'block';
    } catch (err) {
        console.error('Error:', err);
        errorDiv.textContent = err.message || 'Error al buscar.';
        errorDiv.style.display = 'block';
        alumnoActual = null;
    } finally {
        loading.style.display = 'none';
    }
}

function mostrarSeccion(id) {
    var detalles = ['historialCard', 'comprobantesCard', 'infoAcademicaCard', 'ayudaCard', 'perfilCard'];
    for (var i = 0; i < detalles.length; i++) {
        var el = document.getElementById(detalles[i]);
        if (el) el.style.display = 'none';
    }
    var target = document.getElementById(id);
    if (target) {
        target.style.display = 'block';
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function volverInicio() {
    var detalles = ['historialCard', 'comprobantesCard', 'infoAcademicaCard', 'ayudaCard', 'perfilCard'];
    for (var i = 0; i < detalles.length; i++) {
        var el = document.getElementById(detalles[i]);
        if (el) el.style.display = 'none';
    }
    if (alumnoActual) {
        document.getElementById('infoCard').style.display = 'block';
        document.getElementById('resumenCard').style.display = 'block';
        document.getElementById('cuotasCard').style.display = 'block';
    }
}

function irAEstado() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    document.getElementById('resumenCard').scrollIntoView({ behavior: 'smooth' });
}

function abrirHistorial() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('historialCard');
}

function abrirComprobantes() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('comprobantesCard');
}

function abrirInfoAcademica() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('infoAcademicaCard');
}

function abrirAyuda() {
    mostrarSeccion('ayudaCard');
}

function abrirPerfil() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('perfilCard');
    var container = document.getElementById('perfilInfo');
    if (!container) return;
    var nombre = alumnoActual.nombre || 'No disponible';
    var dni = alumnoActual.dni || 'No disponible';
    var carrera = alumnoActual.carrera || 'No disponible';
    var anio = alumnoActual.curso || alumnoActual.anio || 'No disponible';
    var inicial = nombre.charAt(0).toUpperCase();
    container.innerHTML = '<div style="padding:20px;"><div style="text-align:center;margin-bottom:20px;"><div style="width:80px;height:80px;background:#3b82f6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:white;font-weight:bold;">' + inicial + '</div></div><h4 style="color:#f8fafc;text-align:center;margin-bottom:5px;">' + nombre + '</h4><p style="color:#94a3b8;text-align:center;margin-bottom:20px;">Alumno</p><div style="display:grid;gap:12px;"><div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;"><span style="color:#94a3b8;display:block;font-size:0.9em;">DNI</span><span style="color:#f8fafc;font-weight:bold;font-size:1.1em;">' + dni + '</span></div><div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;"><span style="color:#94a3b8;display:block;font-size:0.9em;">Carrera</span><span style="color:#f8fafc;font-weight:bold;font-size:1.1em;">' + carrera + '</span></div><div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;"><span style="color:#94a3b8;display:block;font-size:0.9em;">Curso/Año</span><span style="color:#f8fafc;font-weight:bold;font-size:1.1em;">' + anio + '</span></div></div></div>';
}

document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('btnConsultar');
    if (btn) { btn.addEventListener('click', consultar); }
    var input = document.getElementById('dniInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') { consultar(); }
        });
    }
});