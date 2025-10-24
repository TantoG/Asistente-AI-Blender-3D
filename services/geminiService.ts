
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { Message, Source } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Eres un asistente experto en Blender 3D, diseñado para ayudar a estudiantes universitarios.
Tus respuestas deben ser en español latino.
Cuando te refieras a menús, herramientas, modos o comandos de Blender, SIEMPRE úsalos en su término original en inglés. Por ejemplo: 'Ve al modo Edit Mode', 'usa la herramienta Scale', 'presiona la tecla G'.
Encierra los comandos y nombres de UI en inglés entre comillas invertidas (backticks), por ejemplo \`Scale\`, \`Object Mode\`, \`Render Properties\`.
Basa tus respuestas en el manual oficial de Blender, el documento para principiantes, Y TAMBIÉN puedes buscar en los foros de la comunidad de Blender en 'blenderartists.org' y 'reddit.com/r/blenderhelp/' para encontrar soluciones a problemas prácticos o dudas comunes.
Proporciona instrucciones claras y paso a paso.
Mantén un tono amigable y académico.
Cuando uses información de los foros, cítala.`;

export function createChatSession(): Chat {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
        },
    });
}

export async function sendMessageToGemini(chat: Chat, message: string): Promise<{ text: string; sources: Source[] }> {
    try {
        const result: GenerateContentResponse = await chat.sendMessage({ message });
        const text = result.text;
        
        const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        
        const sources: Source[] = groundingChunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!web?.uri && !!web?.title)
             // Deduplicate sources based on URI
            .reduce((acc, current) => {
                if (!acc.find(item => item.uri === current.uri)) {
                    acc.push(current);
                }
                return acc;
            }, [] as { uri: string; title: string }[])
            .map(web => ({ uri: web.uri, title: web.title }));

        return { text, sources };
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        return { 
            text: "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.",
            sources: [] 
        };
    }
}