const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`Serveur démarré sur http://localhost:${env.port}`);
  console.log(`Teste l'API : GET http://localhost:${env.port}/health`);
});
