// Datos reales de la base de datos
const alumnos = [
  {
    dni: "34567890",
    nombre: "Juan",
    apellido: "Pérez",
    carrera: "Tecnicatura Superior en Infraestructura",
    curso: "2"
  },
  {
    dni: "46999030",
    nombre: "Paula",
    apellido: "Mathieu",
    carrera: "Tecnicatura Superior en Infraestructura",
    curso: "2"
  },
  {
    dni: "30761026",
    nombre: "Emilia",
    apellido: "Bravo",
    carrera: "Tecnicatura Superior en Infraestructura",
    curso: "2"
  },
  {
    dni: "36726523",
    nombre: "Facundo",
    apellido: "Garay",
    carrera: "Tecnicatura Superior en Infraestructura",
    curso: "2"
  },
  {
    dni: "24566710",
    nombre: "Florencia",
    apellido: "Fernández",
    carrera: "Tecnicatura Superior en Infraestructura",
    curso: "2"
  },
  {
    dni: "12345675",
    nombre: "qwewrrrrr",
    apellido: "assddfgggghhh",
    carrera: "jjjj",
    curso: "3"
  }
];

// Cuotas de ejemplo
const cuotas = [
  {
    concepto: "Matrícula 2026",
    vencimiento: "2026-03-15",
    importe: 15000,
    pagado: true
  },
  {
    concepto: "Cuota Marzo 2026",
    vencimiento: "2026-03-31",
    importe: 5000,
    pagado: true
  },
  {
    concepto: "Cuota Abril 2026",
    vencimiento: "2026-04-30",
    importe: 5000,
    pagado: false
  },
  {
    concepto: "Cuota Mayo 2026",
    vencimiento: "2026-05-31",
    importe: 5000,
    pagado: false
  }
];

// Evento del formulario
document.getElementById('formConsulta').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const dniIngresado = document.getElementById('dni').value;
  const resultado = document.getElementById('resultado');
  
  // Buscar alumno por DNI
  const alumno = alumnos.find(a => a.dni === dniIngresado);
  
  if (!alumno) {
    resultado.innerHTML = `
      <div style="color: red; padding: 20px; text-align: center; margin-top: 20px;">
        <h3>❌ Alumno no encontrado</h3>
        <p>El DNI ${dniIngresado} no está registrado.</p>
        <p><strong>DNIs válidos:</strong> 34567890, 46999030, 30761026, 36726523, 24566710, 12345675</p>
      </div>
    `;
    return;
  }
  
  // Calcular saldo pendiente
  const saldoPendiente = cuotas
    .filter(c => !c.pagado)
    .reduce((total, c) => total + c.importe, 0);
  
  // Generar HTML de las cuotas
  const filas = cuotas.map(cuota => `
    <article class="cuota" style="
      background: ${cuota.pagado ? '#d4edda' : '#fff3cd'};
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      border-left: 4px solid ${cuota.pagado ? '#28a745' : '#ffc107'};
    ">
      <strong>${cuota.concepto}</strong><br>
      <span>Vence: ${cuota.vencimiento}</span><br>
      <span>Importe: $${cuota.importe.toLocaleString('es-AR')}</span><br>
      <span style="font-weight: bold; color: ${cuota.pagado ? 'green' : 'red'}">
        ${cuota.pagado ? '✓ PAGADO' : ' PENDIENTE'}
      </span>
    </article>
  `).join('');
  
  // Mostrar resultado
  resultado.innerHTML = `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
      <h2 style="color: #333; margin-top: 0;"> ${alumno.nombre} ${alumno.apellido}</h2>
      <p><strong>DNI:</strong> ${alumno.dni}</p>
      <p><strong>Carrera:</strong> ${alumno.carrera}</p>
      <p><strong>Año:</strong> ${alumno.curso}</p>
      
      <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-top: 20px;">
        📋 Estado de Cuenta
      </h3>
      
      ${filas}
      
      <div style="
        background: ${saldoPendiente > 0 ? '#f8d7da' : '#d4edda'};
        padding: 15px;
        margin-top: 20px;
        border-radius: 5px;
        text-align: center;
        font-size: 1.2em;
        font-weight: bold;
        color: ${saldoPendiente > 0 ? '#721c24' : '#155724'};
      ">
        💰 Saldo Pendiente: $${saldoPendiente.toLocaleString('es-AR')}
      </div>
      
      <button onclick="volver()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
      ">
        ⬅ Volver
      </button>
    </div>
  `;
});

// Función volver
function volver() {
  document.getElementById('resultado').innerHTML = '';
  document.getElementById('dni').value = '';
}