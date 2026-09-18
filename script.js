// 1. Busca el alumno
const { data: alumno } = await supabaseClient
    .from('alumnos')      // ← tabla en minúsculas
    .select('*')
    .eq('dni', dni)       // ← columna en minúsculas
    .single();            // ← trae un solo resultado

// 2. Muestra los datos
document.getElementById('nombre').textContent = alumno.nombre + ' ' + alumno.apellido;
// Resultado: "Emilia Bravo"