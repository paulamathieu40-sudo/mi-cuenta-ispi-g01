const SUPABASE_URL = 'https://zkgtekqdralktgybzejb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_of5g50A0WrJ9NGEViC2QZQ_UyGg74c';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase conectado');

async function consultar() {
    var dniInput = document.getElementById('dniInput');
    var dni = dniInput ? dniInput.value.trim() : '';
    
    if (!dni) {
        alert('Por favor ingresa tu DNI');
        return;
    }
    
    try {
        var result = await supabaseClient
            .from('alumnos')
            .select('*')
            .eq('dni', dni)
            .single();
        
        var alumno = result.data;
        var error = result.error;
        
        if (error || !alumno) {
            alert('DNI no encontrado');
            return;
        }
        
        var cuotasResult = await supabaseClient
            .from('cuotas')
            .select('*')
            .eq('alumno_id', alumno.id);
        
        var cuotas = cuotasResult.data || [];
        
        mostrarDatos(alumno, cuotas);
        
    } catch (err) {
        console.error('Error:', err);
        alert('Error: ' + err.message);
    }
}

function mostrarDatos(alumno, cuotas) {
    document.getElementById('nombre').textContent = alumno.nombre + ' ' + alumno.apellido;
    document.getElementById('dni').textContent = alumno.dni;
    document.getElementById('carrera').textContent = alumno.carrera;
    document.getElementById('curso').textContent = alumno.Curso;
    
    var total = cuotas.length;
    var pagadas = 0;
    for (var i = 0; i < cuotas.length; i++) {
        if (cuotas[i].Pagado === true) {
            pagadas++;
        }
    }
    var pendientes = total - pagadas;
    
    document.getElementById('totalCuotas').textContent = total;
    document.getElementById('pagadas').textContent = pagadas;
    document.getElementById('pendientes').textContent = pendientes;
    
    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('resumenCard').style.display = 'block';
    document.getElementById('cuotasCard').style.display = 'block';
    
    var cuotasList = document.getElementById('cuotasList');
    cuotasList.innerHTML = '';
    
    for (var j = 0; j < cuotas.length; j++) {
        var cuota = cuotas[j];
        var item = document.createElement('div');
        item.className = 'cuota-item';
        
        var estado = cuota.Pagado ? 'pagada' : 'pendiente';
        var icono = cuota.Pagado ? 'check' : 'info';
        var texto = cuota.Pagado ? 'Pagada' : 'Pendiente';
        
        item.innerHTML = '<div class="cuota-icon ' + estado + '">' +
            '<span class="material-icons-round">' + icono + '</span></div>' +
            '<div class="cuota-info"><div class="mes">' + cuota.Concepto + '</div>' +
            '<div class="tipo">$' + cuota.importe + '</div></div>' +
            '<div class="cuota-status ' + estado + '">' + texto + '</div>';
        
        cuotasList.appendChild(item);
    }
    
    document.getElementById('infoCard').scrollIntoView({ behavior: 'smooth' });
}

window.consultar = consultar;