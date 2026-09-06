const app = require("./application");
const env = require("./config/envConfig");

env.validerConfiguration();

app.listen(env.port, () => {
  console.log(`Serveur démarré sur http://localhost:${env.port}`);
  console.log(`Teste l'API : GET http://localhost:${env.port}/health`);
});
