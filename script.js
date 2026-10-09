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
        if (error || !data) { throw new Error('DNI no encontrado. Verificá el número.'); }
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
        console.error('Error al consultar:', err);
        errorDiv.textContent = err.message || 'Error al buscar. Intentá de nuevo.';
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

function abrirHistorial() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('historialCard');
    var container = document.getElementById('historialContent') || document.getElementById('historialCard');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#cbd5e1;">Cargando historial...</p>';
    supabaseClient.from('cuotas').select('*').eq('alumno_id', alumnoActual.id).eq('pagado', true).order('vencimiento', { ascending: false }).then(function(respuesta) {
        var data = respuesta.data;
        var error = respuesta.error;
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay pagos registrados aún.</p>';
            return;
        }
        var html = '<div style="padding: 20px;"><h3 style="margin-bottom: 15px; color: #f8fafc;">Historial de Pagos</h3><div style="display: flex; flex-direction: column; gap: 10px;">';
        for (var i = 0; i < data.length; i++) {
            var cuota = data[i];
            var concepto = cuota.concepto || 'Cuota';
            var vencimiento = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
            var importe = cuota.importe || 0;
            html += '<div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80; display: flex; justify-content: space-between; align-items: center;"><div><span style="font-weight: bold; color: #4ade80; display: block;">✓ ' + concepto + '</span><span style="font-size: 0.9em; color: #cbd5e1;">Vencimiento: ' + vencimiento + '</span></div><span style="color: #4ade80; font-weight: bold; font-size: 1.2em;">$' + importe + '</span></div>';
        }
        html += '</div></div>';
        container.innerHTML = html;
    }).catch(function(err) {
        console.error('Error al cargar historial:', err);
        container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar el historial.</p>';
    });
}

function abrirComprobantes() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('comprobantesCard');
    var container = document.getElementById('comprobantesListContainer') || document.getElementById('comprobantesCard');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#cbd5e1;">Cargando comprobantes...</p>';
    supabaseClient.from('cuotas').select('*').eq('alumno_id', alumnoActual.id).eq('pagado', true).order('vencimiento', { ascending: false }).then(function(respuesta) {
        var data = respuesta.data;
        var error = respuesta.error;
        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No tenés comprobantes de pago disponibles aún.</p>';
            return;
        }
        var html = '<div style="padding: 20px;"><h3 style="margin-bottom: 15px; color: #f8fafc;">Tus Comprobantes de Pago</h3><div style="display: flex; flex-direction: column; gap: 10px;">';
        for (var i = 0; i < data.length; i++) {
            var cuota = data[i];
            var concepto = cuota.concepto || 'Cuota Mensual';
            var importe = cuota.importe || 0;
            var vencimiento = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
            var btnId = 'btn-descarga-' + i;
            html += '<div style="display: flex; justify-content: space-between; align-items: center; background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80;"><div><span style="font-weight: bold; color: #4ade80; display: block;">✓ ' + concepto + '</span><span style="font-size: 0.9em; color: #cbd5e1;">Monto: $' + importe + ' | Vencimiento: ' + vencimiento + '</span></div><button id="' + btnId + '" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">⬇ Descargar</button></div>';
        }
        html += '</div></div>';
        container.innerHTML = html;
        for (var i = 0; i < data.length; i++) {
            var btn = document.getElementById('btn-descarga-' + i);
            if (btn) {
                btn.addEventListener('click', function() {
                    var concepto = this.parentElement.querySelector('span').textContent.replace('✓ ', '');
                    var importe = this.parentElement.querySelector('span:nth-child(2)').textContent.match(/\$(\d+)/)[1];
                    var vencimiento = this.parentElement.querySelector('span:nth-child(2)').textContent.match(/Vencimiento: (.+)/)[1];
                    var texto = '========================================\n       COMPROBANTE DE PAGO\n========================================\nFecha de emisión: ' + new Date().toLocaleDateString('es-AR') + '\n\nDATOS DEL ALUMNO:\nNombre: ' + alumnoActual.nombre + '\nDNI: ' + alumnoActual.dni + '\nCarrera: ' + alumnoActual.carrera + '\n\nDETALLE DEL PAGO:\nConcepto: ' + concepto + '\nImporte: $' + importe + '\nVencimiento: ' + vencimiento + '\nEstado: PAGADO\n========================================';
                    var blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'Comprobante_' + alumnoActual.dni + '_' + Date.now() + '.txt';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(function() { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
                });
            }
        }
    }).catch(function(err) {
        console.error('Error al cargar comprobantes:', err);
        container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar los comprobantes.</p>';
    });
}

function abrirInfoAcademica() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('infoAcademicaCard');
    var content = document.getElementById('infoAcademicaContent');
    if (!content) return;
    var nombre = alumnoActual.nombre || 'No disponible';
    var dni = alumnoActual.dni || 'No disponible';
    var carrera = alumnoActual.carrera || 'No disponible';
    var anio = alumnoActual.anio || alumnoActual.curso || 'No disponible';
    content.innerHTML = '<div class="info-grid"><div class="info-item"><span class="info-label">Alumno:</span><span class="info-value">' + nombre + '</span></div><div class="info-item"><span class="info-label">DNI:</span><span class="info-value">' + dni + '</span></div><div class="info-item"><span class="info-label">Carrera:</span><span class="info-value">' + carrera + '</span></div><div class="info-item"><span class="info-label">Año/Curso:</span><span class="info-value">' + anio + '</span></div></div>';
}

function abrirAyuda() {
    mostrarSeccion('ayudaCard');
}

function abrirPerfil() {
    if (!alumnoActual) { alert('Primero consultá tu DNI.'); return; }
    mostrarSeccion('perfilCard');
    var container = document.getElementById('perfilInfo') || document.getElementById('perfilContent') || document.getElementById('perfilCard');
    if (!container) return;
    var nombre = alumnoActual.nombre || 'No disponible';
    var dni = alumnoActual.dni || 'No disponible';
    var carrera = alumnoActual.carrera || 'No disponible';
    var anio = alumnoActual.curso || alumnoActual.anio || 'No disponible';
    var inicial = nombre.charAt(0).toUpperCase();
    var estado = document.getElementById('estadoActual') ? document.getElementById('estadoActual').textContent : 'Al día';
    container.innerHTML = '<div style="padding: 20px;"><div style="text-align: center; margin-bottom: 20px;"><div style="width: 80px; height: 80px; background: #3b82f6; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; color: white; font-weight: bold;">' + inicial + '</div></div><h4 style="color: #f8fafc; text-align: center; margin-bottom: 5px;">' + nombre + '</h4><p style="color: #94a3b8; text-align: center; margin-bottom: 20px;">Alumno</p><div style="display: grid; gap: 12px;"><div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;"><span style="color: #94a3b8; display: block; font-size: 0.9em;">DNI</span><span style="color: #f8fafc; font-weight: bold; font-size: 1.1em;">' + dni + '</span></div><div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;"><span style="color: #94a3b8; display: block; font-size: 0.9em;">Carrera</span><span style="color: #f8fafc; font-weight: bold; font-size: 1.1em;">' + carrera + '</span></div><div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;"><span style="color: #94a3b8; display: block; font-size: 0.9em;">Curso/Año</span><span style="color: #f8fafc; font-weight: bold; font-size: 1.1em;">' + anio + '</span></div><div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80;"><span style="color: #4ade80; display: block; font-size: 0.9em;">Estado de cuenta</span><span style="color: #4ade80; font-weight: bold; font-size: 1.1em;">' + estado + '</span></div></div></div>';
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