const SUPABASE_URL = 'https://zkgtekqdraiktgybzejb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50AOWrJ9NGEVIC2QZQ_UyGg74dx';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

let alumnoActual = null;
let cuotasActuales = [];

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

    ['infoCard', 'resumenCard', 'cuotasCard', 'perfilCard', 'historialCard', 'comprobantesCard', 'academicaCard', 'ayudaCard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

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

        alumnoActual = alumno;
        cuotasActuales = cuotas || [];

        mostrarDatos(alumno, cuotasActuales);

    } catch (err) {
        console.error('Error:', err);
        document.getElementById('error').textContent = 'Ocurrió un error al consultar.';
        document.getElementById('error').style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
        const btnFinal = document.getElementById('btnConsultar');
        btnFinal.innerHTML = textoOriginal;
        btnFinal.disabled = false;
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
        estadoEl.textContent = 'Al día';
        estadoEl.className = 'badge aldia';
    } else if (pendientes > 0) {
        estadoEl.textContent = 'Con deuda';
        estadoEl.className = 'badge condeuda';
    } else {
        estadoEl.textContent = 'Sin cuotas';
        estadoEl.className = 'badge';
    }

    const ultimoPago = cuotas.find(c => c.Pagado === true || c.Pagado === 'true' || c.pagado === true);
    document.getElementById('ultimoPago').textContent = ultimoPago
        ? new Date(ultimoPago.vencimiento).toLocaleDateString('es-AR')
        : 'Sin registros';

    const perfilInfo = document.getElementById('perfilInfo');
    if (perfilInfo) {
        perfilInfo.innerHTML = `
            <p><strong>Nombre:</strong> ${alumno.nombre || ''} ${alumno.apellido || ''}</p>
            <p><strong>DNI:</strong> ${alumno.dni || 'No especificado'}</p>
            <p><strong>Carrera:</strong> ${alumno.carrera || 'No especificada'}</p>
            <p><strong>Curso:</strong> ${alumno.curso || alumno.Curso || 'No especificado'}</p>
        `;
    }

    const historialList = document.getElementById('historialList');
    if (historialList) {
        historialList.innerHTML = '';
        if (cuotas.length === 0) {
            historialList.innerHTML = '<p style="text-align:center; color:#8a94b8; padding:20px;">No hay pagos registrados.</p>';
        } else {
            cuotas.forEach(cuota => {
                const estaPagada = cuota.Pagado === true || cuota.Pagado === 'true' || cuota.pagado === true;
                let fecha = 'Sin fecha';
                if (cuota.vencimiento) {
                    try { fecha = new Date(cuota.vencimiento).toLocaleDateString('es-AR'); } catch (e) { fecha = cuota.vencimiento; }
                }
                const item = document.createElement('div');
                item.style.cssText = 'background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';
                item.innerHTML = `
                    <div><strong>${cuota.Concepto || cuota.concepto || 'Cuota'}</strong><br><small style="color:#8a94b8;">Vence: ${fecha}</small></div>
                    <div style="color: ${estaPagada ? '#22c55e' : '#ef4444'}; font-weight:bold;">${estaPagada ? '✓ Pagada' : '⏳ Pendiente'}</div>
                `;
                historialList.appendChild(item);
            });
        }
    }

    const comprobantesList = document.getElementById('comprobantesList');
    if (comprobantesList) {
        comprobantesList.innerHTML = '';
        const cuotasPagadas = cuotas.filter(c => c.Pagado === true || c.Pagado === 'true' || c.pagado === true);
        if (cuotasPagadas.length === 0) {
            comprobantesList.innerHTML = '<p style="text-align:center; color:#8a94b8; padding:20px;">No hay comprobantes disponibles (solo cuotas pagadas tienen comprobante).</p>';
        } else {
            cuotasPagadas.forEach(cuota => {
                let fecha = 'Sin fecha';
                if (cuota.vencimiento) {
                    try { fecha = new Date(cuota.vencimiento).toLocaleDateString('es-AR'); } catch (e) { fecha = cuota.vencimiento; }
                }
                const item = document.createElement('div');
                item.style.cssText = 'background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;';
                item.innerHTML = `
                    <div><strong>${cuota.Concepto || cuota.concepto || 'Cuota'}</strong><br><small style="color:#8a94b8;">Fecha: ${fecha} - Importe: $${cuota.importe || '0'}</small></div>
                    <button class="btn-download" onclick="descargarComprobante('${alumno.dni}', '${cuota.Concepto || cuota.concepto}', '${fecha}', '${cuota.importe || '0'}')">📥 Descargar</button>
                `;
                comprobantesList.appendChild(item);
            });
        }
    }

    const cuotasList = document.getElementById('cuotasList');
    if (cuotasList) {
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
    }

    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'block';
    document.getElementById('cuotasCard').style.display = 'block';

    setTimeout(() => {
        document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function descargarComprobante(dni, concepto, fecha, importe) {
    const contenido = `
========================================
       COMPROBANTE DE PAGO - ISPI 4019
========================================

Alumno DNI: ${dni}
Concepto:   ${concepto}
Fecha:      ${fecha}
Importe:    $${importe}

Estado: PAGADO

========================================
    `.trim();

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_${dni}_${concepto.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function volverInicio() {
    document.querySelector('.search-card').style.display = 'block';
    document.querySelector('.accesos-card').style.display = 'block';

    ['infoCard', 'resumenCard', 'cuotasCard', 'historialCard', 'comprobantesCard', 'academicaCard', 'ayudaCard', 'perfilCard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function mostrarSeccion(idSeccion) {
    document.querySelector('.search-card').style.display = 'none';
    document.querySelector('.accesos-card').style.display = 'none';

    ['infoCard', 'resumenCard', 'cuotasCard', 'historialCard', 'comprobantesCard', 'academicaCard', 'ayudaCard', 'perfilCard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(idSeccion);
    if (target) {
        target.style.display = 'block';
    }
}

function irAEstado() {
    volverInicio();
    if (alumnoActual) {
        setTimeout(() => {
            document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }
}

function abrirHistorial() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }
    mostrarSeccion('historialCard');
}

function abrirComprobantes() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }
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
        <span class="info-label">Año:</span>
        <span class="info-value">${alumnoActual.anio || 'No disponible'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">División:</span>
        <span class="info-value">${alumnoActual.division || 'No disponible'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Estado:</span>
        <span class="info-value">${alumnoActual.estado || 'Activo'}</span>
      </div>
    </div>
  `;

  mostrarSeccion('infoAcademicaCard');
}

function volverAlInicio() {
  document.querySelectorAll('.card').forEach(card => {
    card.style.display = 'none';
  });
  const seccionPrincipal = document.querySelector('.main-section') || document.getElementById('consultaDNI');
  if (seccionPrincipal) {
    seccionPrincipal.style.display = 'block';
  }
}
    const academicaInfo = document.getElementById('academicaInfo');
    if (academicaInfo) {
        academicaInfo.innerHTML = `
            <p><strong>Nombre:</strong> ${alumnoActual.nombre || ''} ${alumnoActual.apellido || ''}</p>
            <p><strong>DNI:</strong> ${alumnoActual.dni || 'No especificado'}</p>
            <p><strong>Carrera:</strong> ${alumnoActual.carrera || 'No especificada'}</p>
            <p><strong>Curso:</strong> ${alumnoActual.curso || alumnoActual.Curso || 'No especificado'}</p>
        `;
    }
    mostrarSeccion('academicaCard');
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
// === FUNCIONES DE LOS NUEVOS BOTONES ===

function abrirInfoAcademica() {
  if (!alumnoActual) {
    alert('Primero consultá tu DNI.');
    return;
  }
  // Cambiá esto por lo que necesites
  alert('Mostrando información académica de: ' + alumnoActual.nombre);
  // O redirigir: window.location.href = '/info-academica';
}

function abrirAyudaContacto() {
  // Cambiá esto por lo que necesites
  alert('Sección: Ayuda y contacto');
  // O abrir WhatsApp: window.open('https://wa.me/5491112345678', '_blank');
}

function descargarComprobantes() {
  if (!alumnoActual) {
    alert('Primero consultá tu DNI.');
    return;
  }
  alert('Descargando comprobantes de: ' + alumnoActual.nombre);
  // O descargar archivo: window.location.href = '/api/descargar-comprobantes';
}
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnConsultar');
    if (btn) {
        btn.addEventListener('click', consultar);
    }
});