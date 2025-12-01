import { GoogleGenAI } from "@google/genai";
import { AppData, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChurchReport = async (data: AppData) => {
  const totalIncome = data.transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const memberCount = data.members.length;
  const assetCount = data.assets.length;

  const prompt = `
    Agis comme un assistant administratif expert pour une église.
    Voici les données actuelles de l'église :
    - Nombre de membres : ${memberCount}
    - Nombre d'équipements/matériels : ${assetCount}
    - Total Revenus : ${totalIncome} €
    - Total Dépenses : ${totalExpense} €
    
    Transactions récentes : ${JSON.stringify(data.transactions.slice(-5))}
    
    Rédige un court rapport exécutif (en français) résumant la santé financière et matérielle de l'église. 
    Inclus des suggestions bibliques ou de sagesse pour la gestion si pertinent, mais reste professionnel.
    Formate la réponse en Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Désolé, je ne peux pas générer de rapport pour le moment. Vérifiez votre clé API.";
  }
};

export const askAssistant = async (question: string, contextData: AppData) => {
    // Provide simplified context to avoid token limits if data is huge
    const contextSummary = {
        memberCount: contextData.members.length,
        assetCount: contextData.assets.length,
        financialSummary: contextData.transactions.slice(-10) // Last 10 transactions
    };

    const prompt = `
        Tu es un assistant virtuel pour l'application "Ecclesia Manager".
        Contexte de l'église : ${JSON.stringify(contextSummary)}.
        
        Question de l'utilisateur : "${question}"
        
        Réponds de manière utile, bienveillante et concise.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        return "Une erreur est survenue lors de la communication avec l'assistant.";
    }
}