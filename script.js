// CONFIGURACIÓN
const SUPABASE_URL = 'https://zkgtekqdralktgybzejb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50A0WrJ9NGEViC2QZQ_UyGg74c';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase inicializado');
console.log('URL:', SUPABASE_URL);

async function consultar() {
    const dniInput = document.getElementById('dniInput');
    const dni = dniInput ? dniInput.value.trim() : '';
    
    console.log('🔍 DNI ingresado:', dni);
    console.log('Tipo de dato:', typeof dni);
    
    if (!dni) {
        alert('Por favor ingresá tu DNI');
        return;
    }
    
    try {
        // PRUEBA 1: Buscar TODOS los alumnos
        console.log(' Buscando TODOS los alumnos...');
        const { data: todos, error: errorTodos } = await supabaseClient
            .from('alumnos')
            .select('*');
        
        console.log('✅ Alumnos encontrados:', todos?.length || 0);
        if (errorTodos) {
            console.error('❌ Error al buscar todos:', errorTodos);
            alert('Error al conectar con la base de datos: ' + errorTodos.message);
            return;
        }
        
        if (todos && todos.length > 0) {
            console.log('📋 Lista de DNIs en la base:');
            todos.forEach((alu, index) => {
                console.log(`  ${index + 1}. DNI: "${alu.dni}" (tipo: ${typeof alu.dni})`);
            });
        }
        
        // PRUEBA 2: Buscar el DNI específico
        console.log('📡 Buscando DNI específico:', dni);
        const { data: alumno, error: errorUno } = await supabaseClient
            .from('alumnos')
            .select('*')
            .eq('dni', dni);
        
        console.log('Resultado:', alumno);
        console.log('Error:', errorUno);
        
        if (errorUno) {
            console.error('❌ Error:', errorUno);
            alert('Error: ' + errorUno.message);
            return;
        }
        
        if (!alumno || alumno.length === 0) {
            console.log('❌ No se encontró el DNI');
            alert('DNI no encontrado. Probá con: 34567890');
            return;
        }
        
        console.log('✅ Alumno encontrado:', alumno[0]);
        
        // Buscar cuotas
        const { data: cuotas } = await supabaseClient
            .from('cuotas')
            .select('*')
            .eq('alumno_id', alumno[0].id);
        
        console.log('Cuotas:', cuotas);
        
        mostrarDatos(alumno[0], cuotas || []);
        
    } catch (err) {
        console.error('Error general:', err);
        alert('Error: ' + err.message);
    }
}

function mostrarDatos(alumno, cuotas) {
    document.getElementById('nombre').textContent = alumno.nombre + ' ' + alumno.apellido;
    document.getElementById('dni').textContent = alumno.dni;
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
    
    if (cuotas.length === 0) {
        cuotasList.innerHTML = '<p style="text-align:center; padding:20px; color:#8a94b8;">No hay cuotas</p>';
    } else {
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
    }
    
    document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth' });
}

window.consultar = consultar;