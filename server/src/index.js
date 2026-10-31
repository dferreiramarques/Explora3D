require('dotenv').config();
const { initSchema } = require('./db');
const app = require('./app');
const PORT = process.env.PORT || 3001;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`monco3d-classroom-api a correr na porta ${PORT}`));
  })
  .catch(err => {
    console.error('Falha ao inicializar a base de dados:', err);
    process.exit(1);
  });
