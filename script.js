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
// FUNCIONES DE LOS BOTONES
// ==========================================
function abrirHistorial() {
    if (!alumnoActual) { 
        alert('Primero consultá tu DNI.'); 
        return; 
    }
    
    mostrarSeccion('historialCard');
    
    const container = document.getElementById('historialContent') || document.getElementById('historialCard');
    container.innerHTML = '<p style="text-align:center; padding:20px; color:#cbd5e1;">Cargando historial...</p>';
    
    supabaseClient
        .from('cuotas')
        .select('*')
        .eq('alumno_id', alumnoActual.id)
        .eq('pagado', true)
        .order('vencimiento', { ascending: false })
        .then(({ data, error }) => {
            if (error) throw error;
            
            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">No hay pagos registrados aún.</p>';
                return;
            }
            
            let html = '<div style="padding: 20px;">';
            html += '<h3 style="margin-bottom: 15px; color: #f8fafc;">Historial de Pagos</h3>';
            html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
            
            data.forEach(cuota => {
                html += `
                    <div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: bold; color: #4ade80; display: block;">✓ ${cuota.concepto || 'Cuota'}</span>
                            <span style="font-size: 0.9em; color: #cbd5e1;">Vencimiento: ${new Date(cuota.vencimiento).toLocaleDateString('es-AR')}</span>
                        </div>
                        <span style="color: #4ade80; font-weight: bold; font-size: 1.2em;">$${cuota.importe || 0}</span>
                    </div>
                `;
            });
            
            html += '</div></div>';
            container.innerHTML = html;
        })
        .catch(err => {
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
        
        cuotasPagadas.forEach((cuota, index) => {
            html += `
                <div class="cuota-item pagada" style="display: flex; justify-content: space-between; align-items: center; background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #4ade80;">
                    <div class="cuota-info">
                        <span style="font-weight: bold; color: #4ade80; display: block;">✓ ${cuota.concepto || 'Cuota Mensual'}</span>
                        <span style="font-size: 0.9em; color: #cbd5e1;">Monto: $${cuota.importe || 0} | Vencimiento: ${new Date(cuota.vencimiento).toLocaleDateString('es-AR')}</span>
                    </div>
                    <button 
                        id="btn-descarga-${index}"
                        style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        ⬇ Descargar
                    </button>
                </div>
            `;
        });
        
        html += '</div></div>';
        container.innerHTML = html;
        
        // Ahora agregamos los eventos DESPUÉS de crear el HTML
        cuotasPagadas.forEach((cuota, index) => {
            const btn = document.getElementById(`btn-descarga-${index}`);
            if (btn) {
                btn.addEventListener('click', function() {
                    console.log('📥 Click en descargar:', cuota);
                    
                    if (!alumnoActual) {
                        alert('Error: No hay alumno seleccionado.');
                        return;
                    }

                    const fechaEmision = new Date().toLocaleDateString('es-AR');
                    const fechaVenc = new Date(cuota.vencimiento).toLocaleDateString('es-AR');
                    
                    const texto = `
========================================
       COMPROBANTE DE PAGO
========================================
Fecha de emisión: ${fechaEmision}

DATOS DEL ALUMNO:
Nombre: ${alumnoActual.nombre}
DNI: ${alumnoActual.dni}
Carrera: ${alumnoActual.carrera}

DETALLE DEL PAGO:
Concepto: ${cuota.concepto || 'Cuota'}
Importe: $${cuota.importe || 0}
Vencimiento: ${fechaVenc}
Estado: PAGADO
========================================
                    `.trim();

                    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Comprobante_${alumnoActual.dni}_${cuota.concepto || 'Cuota'}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 100);
                    
                    console.log('✅ Descarga iniciada');
                });
            }
        });
        
    } catch (err) {
        console.error('Error al cargar comprobantes:', err);
        container.innerHTML = '<p style="text-align:center; color:#ef4444; padding:20px;">Error al cargar los comprobantes.</p>';
    }
}

function abrirInfoAcademica() {
    if (!alumnoActual) {
        alert('Primero consultá tu DNI.');
        return;
    }
    const content = document.getElementById('infoAcademicaContent');
    content.innerHTML = `
        <div class="info-grid">
            <div class="info-item"><span class="info-label">Alumno:</span><span class="info-value">${alumnoActual.nombre || 'No disponible'}</span></div>
            <div class="info-item"><span class="info-label">DNI:</span><span class="info-value">${alumnoActual.dni || 'No disponible'}</span></div>
            <div class="info-item"><span class="info-label">Carrera:</span><span class="info-value">${alumnoActual.carrera || 'No disponible'}</span></div>
            <div class="info-item"><span class="info-label">Año/Curso:</span><span class="info-value">${alumnoActual.anio || alumnoActual.curso || 'No disponible'}</span></div>
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
    
    const container = document.getElementById('perfilContent') || document.getElementById('perfilCard');
    
    container.innerHTML = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 20px; color: #f8fafc;">Mi Perfil</h3>
            
            <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: bold;">
                        ${alumnoActual.nombre ? alumnoActual.nombre.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h4 style="color: #f8fafc; margin: 0; font-size: 1.3em;">${alumnoActual.nombre || 'No disponible'}</h4>
                        <p style="color: #94a3b8; margin: 5px 0 0 0;">Alumno</p>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; gap: 12px;">
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #94a3b8;">📄 DNI:</span>
                    <span style="color: #f8fafc; font-weight: bold;">${alumnoActual.dni || 'No disponible'}</span>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #94a3b8;">🎓 Carrera:</span>
                    <span style="color: #f8fafc; font-weight: bold;">${alumnoActual.carrera || 'No disponible'}</span>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #94a3b8;">📚 Curso/Año:</span>
                    <span style="color: #f8fafc; font-weight: bold;">${alumnoActual.curso || alumnoActual.anio || 'No disponible'}</span>
                </div>
                
                <div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #4ade80;">
                    <span style="color: #4ade80;">✓ Estado:</span>
                    <span style="color: #4ade80; font-weight: bold;">${document.getElementById('estadoActual')?.textContent || 'Al día'}</span>
                </div>
            </div>
        </div>
    `;
}
// ==========================================
// FUNCIÓN GLOBAL DE DESCARGA
// ==========================================
window.generarYDescargarComprobante = function(concepto, importe, vencimiento) {
    console.log(' [DEBUG] Función llamada con:', { concepto, importe, vencimiento });
    console.log(' [DEBUG] Alumno actual:', alumnoActual);
    
    if (!alumnoActual) {
        alert('Error: No hay alumno seleccionado.');
        return;
    }

    try {
        const fechaEmision = new Date().toLocaleDateString('es-AR');
        const fechaVenc = new Date(vencimiento).toLocaleDateString('es-AR');
        
        const texto = `
========================================
       COMPROBANTE DE PAGO
========================================
Fecha de emisión: ${fechaEmision}

DATOS DEL ALUMNO:
Nombre: ${alumnoActual.nombre}
DNI: ${alumnoActual.dni}
Carrera: ${alumnoActual.carrera}

DETALLE DEL PAGO:
Concepto: ${concepto}
Importe: $${importe}
Vencimiento: ${fechaVenc}
Estado: PAGADO
========================================
        `.trim();

        const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const nombreArchivo = `Comprobante_${alumnoActual.dni}_${Date.now()}.txt`;
        
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('✅ [DEBUG] Descarga iniciada:', nombreArchivo);
    } catch (err) {
        console.error('❌ [DEBUG] Error:', err);
        alert('Error al descargar: ' + err.message);
    }
};