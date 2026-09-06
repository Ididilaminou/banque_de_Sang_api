const OpenAI = require("openai");

const env = require("../config/envConfig");

function obtenirClient() {
  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY est obligatoire pour analyser le test d'éligibilité.");
  }

  return new OpenAI({ apiKey: env.openaiApiKey });
}

// Demande une analyse structurée, sans autoriser l'IA à remplacer le professionnel.
async function analyserQuestionnaire(questionnaire) {
  const client = obtenirClient();
  const reponse = await client.chat.completions.create({
    model: env.openaiModel,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "Tu es un assistant d'aide à la décision pour une plateforme de don de sang.",
          "Tu ne poses jamais de diagnostic et tu ne donnes jamais une autorisation définitive de don.",
          "Analyse uniquement les informations fournies.",
          "Retourne uniquement un JSON valide avec les clés resultat, analyse, recommandations.",
          "resultat doit être exactement ELIGIBLE, NON_ELIGIBLE ou A_VALIDER.",
          "En cas de doute, d'information manquante ou de risque, utilise A_VALIDER.",
          "La réponse doit rappeler qu'un professionnel de santé doit valider la décision.",
          "N'invente aucune règle médicale et ne complète pas les informations absentes.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify(questionnaire),
      },
    ],
  });

  const contenu = reponse.choices[0]?.message?.content;
  if (!contenu) {
    throw new Error("L'analyse IA n'a retourné aucun contenu.");
  }

  let analyse;
  try {
    analyse = JSON.parse(contenu);
  } catch (erreur) {
    throw new Error("La réponse de l'analyse IA n'est pas un JSON valide.");
  }

  if (
    !["ELIGIBLE", "NON_ELIGIBLE", "A_VALIDER"].includes(analyse.resultat) ||
    typeof analyse.analyse !== "string" ||
    typeof analyse.recommandations !== "string"
  ) {
    throw new Error("La réponse de l'analyse IA ne respecte pas le format attendu.");
  }

  return analyse;
}

module.exports = { analyserQuestionnaire };
