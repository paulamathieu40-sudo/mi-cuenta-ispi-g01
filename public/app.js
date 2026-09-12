const form = document.getElementById('formConsulta');
const resultado = document.getElementById('resultado');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const dni = document.getElementById('dni').value.trim();

  if (!/^\d{7,8}$/.test(dni)) {
    resultado.innerHTML = '<p>Ingrese un DNI válido.</p>';
    return;
  }

  resultado.innerHTML = '<p>Consultando...</p>';

  try {
    const respuesta = await fetch(`/api/cuenta/${dni}`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      resultado.innerHTML = `<p>${datos.error}</p>`;
      return;
    }

    mostrarCuenta(datos);
  } catch (error) {
    console.error(error);
    resultado.innerHTML = '<p>No fue posible realizar la consulta.</p>';
  }
});

function mostrarCuenta(datos) {
  const { alumno, cuotas, saldo } = datos;

  const filas = cuotas.map(cuota => `
    <article class="cuota">
      <strong>${cuota.concepto}</strong>
      <span>Vence: ${cuota.vencimiento ?? '-'}</span>
      <span>$${Number(cuota.importe).toLocaleString('es-AR')}</span>
      <span>${cuota.pagado ? 'PAGADO' : 'PENDIENTE'}</span>
    </article>
  `).join('');

  resultado.innerHTML = `
    <h2>Hola, ${alumno.nombre} ${alumno.apellido}</h2>
    <p>${alumno.carrera ?? ''} - ${alumno.curso ?? ''}º Año</p>
    <h3>Estado de cuenta</h3>
    ${filas}
    <div class="saldo">Saldo pendiente: $${saldo.toLocaleString('es-AR')}</div>
    <button id="volver">VOLVER</button>
  `;

  document.getElementById('volver').addEventListener('click', () => {
    resultado.innerHTML = '';
    form.reset();
    document.getElementById('dni').focus();
  });
}