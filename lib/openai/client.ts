import OpenAI from 'openai'

// Instance OpenAI réutilisable côté serveur uniquement
// La clé API ne doit JAMAIS être exposée côté client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
