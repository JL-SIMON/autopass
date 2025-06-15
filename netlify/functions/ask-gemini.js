// Créez un dossier "netlify" à la racine de votre projet.
// Dans ce dossier, créez un sous-dossier "functions".
// Enfin, créez un fichier "ask-gemini.js" dans "netlify/functions/".

// Fichier : /netlify/functions/ask-gemini.js

// Cette fonction est le "pont" sécurisé vers l'API Gemini.
// Le navigateur de l'utilisateur appelle cette fonction, et cette fonction appelle Gemini.
// La clé API reste secrète ici sur le serveur.

exports.handler = async function(event, context) {
    // On n'accepte que les requêtes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return { statusCode: 400, body: 'Bad Request: prompt is required.' };
        }

        // IMPORTANT : Ne mettez jamais votre clé API directement dans le code.
        // Allez dans les paramètres de votre site Netlify -> Build & deploy -> Environment
        // et créez une variable d'environnement nommée GEMINI_API_KEY.
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        // On importe 'node-fetch' pour faire la requête. Netlify le gère bien.
        const fetch = (await import('node-fetch')).default;

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            console.error("Gemini API error:", await geminiResponse.text());
            return { statusCode: 500, body: 'Error from Gemini API.' };
        }

        const geminiData = await geminiResponse.json();
        
        // Extraire le texte de la réponse de manière sécurisée
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Je n'ai pas de réponse pour le moment.";

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
