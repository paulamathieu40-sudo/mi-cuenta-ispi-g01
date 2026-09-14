import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 1. Definir __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Middleware para leer JSON (muy importante para APIs)
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

// Servir archivos estáticos de la carpeta public
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Ruta de prueba: trae todos los alumnos
app.get('/api/alumnos', async (req, res) => {
  const { data, error } = await supabase.from('alumnos').select('*');

  if (error) {
    return res.status(500).json({ error: 'No se pudo consultar alumnos', detalle: error.message });
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
    console.log('ERROR SUPABASE:', errorAlumno);
    return res.status(500).json({ error: 'Error al consultar el alumno', detalle: errorAlumno.message });
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
    return res.status(500).json({ error: 'Error al consultar cuotas', detalle: errorCuotas.message });
  }

  const saldo = cuotas
    .filter(cuota => !cuota.pagado)
    .reduce((total, cuota) => total + Number(cuota.importe), 0);

  res.json({ alumno, cuotas, saldo });
});

// ❌ ELIMINADO: app.listen NO funciona en Vercel. 
// Si querés probarlo en tu computadora, descomentá las siguientes 3 líneas, 
// pero para Vercel DEBEN estar comentadas o borradas.

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`Servidor funcionando en http://localhost:${PORT}`);
// });

// ✅ EXPORTAR para que Vercel lo use como Serverless Function
export default app;

