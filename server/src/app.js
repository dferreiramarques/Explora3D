const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const activitiesRoutes = require('./routes/activities');
const submissionsRoutes = require('./routes/submissions');
const teacherSubmissionsRoutes = require('./routes/teacherSubmissions');
const superadminRoutes = require('./routes/superadmin');

const app = express();
app.use(express.json({ limit: '8mb' }));

const allowedOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

app.get('/api/capabilities', (req, res) => res.json({ classroom_version: 3, apps: ['volume', 'area', 'revolve', 'voxel'] }));

app.get('/', (req, res) => res.json({ ok: true, service: 'monco3d-classroom-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/teacher/submissions', teacherSubmissionsRoutes);
app.use('/api/superadmin', superadminRoutes);

// handler de erros genérico — evita expor stack traces ao cliente
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'O projeto é demasiado grande para guardar na sala de aula.' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
