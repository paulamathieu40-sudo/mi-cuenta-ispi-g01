import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

app.get('/', (req, res) => {
     res.sendFile(__dirname + '/public/index.html');
   });

// Ruta de prueba: trae todos los alumnos
app.get('/api/alumnos', async (req, res) => {
  const { data, error } = await supabase
    .from('alumnos')
    .select('*');

  if (error) {
    return res.status(500).json({ error: 'No se pudo consultar alumnos' });
  }
  res.json(data);
});

// Ruta principal: busca un alumno por DNI y sus cuotas
app.get('/api/cuenta/:dni', async (req, res) => {
  const dni = req.params.dni;

  if (!/^\d{7,8}$/.test(dni)) {
    return res.status(400).json({ error: 'DNI inválido' });
  }

  const { data: alumno, error: errorAlumno } = await supabase
    .from('alumnos')
    .select('*')
    .eq('dni', dni)
    .maybeSingle();

  if (errorAlumno) {
    return res.status(500).json({ error: 'Error al consultar el alumno' });
  }
  if (!alumno) {
    return res.status(404).json({ error: 'Alumno no encontrado' });
  }

  const { data: cuotas, error: errorCuotas } = await supabase
    .from('cuotas')
    .select('*')
    .eq('alumno_id', alumno.id)
    .order('vencimiento', { ascending: true });

  if (errorCuotas) {
    return res.status(500).json({ error: 'Error al consultar cuotas' });
  }

  const saldo = cuotas
    .filter(cuota => !cuota.pagado)
    .reduce((total, cuota) => total + Number(cuota.importe), 0);

  res.json({ alumno, cuotas, saldo });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
