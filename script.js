// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://zkgtekqdralktgybzejb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50A0WrJ9NGEViC2QZQ_UyGg74c';

// Inicializar Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase conectado');

async function consultar() {
    console.log('🔍 Consultando DNI...');
    
    const dniInput = document.getElementById('dniInput');
    const dni = dniInput ? dniInput.value.trim() : '';
    
    if (!dni) {
        alert('Por favor ingresá tu DNI');
        return;
    }
    
    try {
        const { data: alumno, error } = await supabaseClient
            .from('Alumnos')
            .select('*')
            .eq('DNI', dni)
            .single();
        
        if (error || !alumno) {
            alert('DNI no encontrado');
            return;
        }
        
        const { data: cuotas } = await supabaseClient
            .from('Cuotas')
            .select('*')
            .eq('alumno_id', alumno.id);
        
        mostrarDatos(alumno, cuotas || []);
        
    } catch (err) {
        console.error('Error:', err);
        alert('Error: ' + err.message);
    }
}

function mostrarDatos(alumno, cuotas) {
    document.getElementById('nombre').textContent = alumno.nombre + ' ' + alumno.apellido;
    document.getElementById('dni').textContent = alumno.DNI;
    document.getElementById('carrera').textContent = alumno.carrera;
    document.getElementById('curso').textContent = alumno.Curso;
    
    const total = cuotas.length;
    const pagadas = cuotas.filter(c => c.Pagado === true).length;
    const pendientes = total - pagadas;
    
    document.getElementById('totalCuotas').textContent = total;
    document.getElementById('pagadas').textContent = pagadas;
    document.getElementById('pendientes').textContent = pendientes;
    
    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'block';
    document.getElementById('cuotasCard').style.display = 'block';
    
    const cuotasList = document.getElementById('cuotasList');
    cuotasList.innerHTML = '';
    
    cuotas.forEach(cuota => {
        const item = document.createElement('div');
        item.className = 'cuota-item';
        item.innerHTML = `
            <div class="cuota-icon ${cuota.Pagado ? 'pagada' : 'pendiente'}">
                <span class="material-icons-round">${cuota.Pagado ? 'check' : 'info'}</span>
            </div>
            <div class="cuota-info">
                <div class="mes">${cuota.Concepto}</div>
                <div class="tipo">$${cuota.importe}</div>
            </div>
            <div class="cuota-status ${cuota.Pagado ? 'pagada' : 'pendiente'}">
                ${cuota.Pagado ? 'Pagada' : 'Pendiente'}
            </div>
        `;
        cuotasList.appendChild(item);
    });
    
    document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth' });
}

window.consultar = consultar;