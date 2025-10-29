import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type Message } from '../types';
import { createChatSession, sendMessageToGemini } from '../services/geminiService';
import { type Chat } from "@google/genai";

const BlenderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4.14-3.86c.18.29.51.46.86.46.55 0 1-.45 1-1 0-.3-.13-.58-.34-.78-.5-.47-1.14-.8-1.52-1.25-.9-1.07-.9-2.5 0-3.57.94-.94 2.46-.94 3.4 0 .93.94.93 2.45 0 3.39-.2.2-.47.31-.75.31-.55 0-1-.45-1-1 0-.3.13-.58.34-.78.31-.31.31-.82 0-1.13-.31-.31-.82-.31-1.13 0-.31.31-.31.82 0 1.13.23.23.58.42.88.7.63.59 1.45 1.05 1.9 1.66.45.61.56 1.39.29 2.11-.27.72-.88 1.25-1.63 1.48-.37.11-.75.17-1.13.17-1.1 0-2.12-.55-2.73-1.48z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const SourceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);

const ExerciseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.09 10.11A5 5 0 1 1 8.91 4H8a5 5 0 0 0-1 9.9" />
        <path d="M12 15v5" />
        <path d="M12 21h0" />
        <path d="M10 18h4" />
    </svg>
);

const GlossaryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

// Helper function to render text with backticks as styled code
const renderMessageText = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code key={i} className="bg-gray-700 text-orange-400 rounded-md px-1.5 py-0.5 font-mono text-sm">
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
};


const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: '¡Hola! Soy tu asistente de IA para Blender. ¿En qué te puedo ayudar hoy? Pregúntame sobre modelado, texturizado, renderizado o cualquier otra duda que tengas.',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExerciseMode, setIsExerciseMode] = useState(false);
    const [isGlossaryMode, setIsGlossaryMode] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatSession.current = createChatSession();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        if (chatSession.current) {
            let { text, sources } = await sendMessageToGemini(chatSession.current, currentInput);
            
            if (text.includes('[MODO_EJERCICIO_ACTIVADO]')) {
                setIsExerciseMode(true);
                setIsGlossaryMode(false);
                text = text.replace(/\[MODO_EJERCICIO_ACTIVADO\]/g, '').trim();
            }
            if (text.includes('[MODO_EJERCICIO_DESACTIVADO]')) {
                setIsExerciseMode(false);
                text = text.replace(/\[MODO_EJERCICIO_DESACTIVADO\]/g, '').trim();
            }
            if (text.includes('[MODO_GLOSARIO_ACTIVADO]')) {
                setIsGlossaryMode(true);
                setIsExerciseMode(false);
                text = text.replace(/\[MODO_GLOSARIO_ACTIVADO\]/g, '').trim();
            }
            if (text.includes('[MODO_GLOSARIO_DESACTIVADO]')) {
                setIsGlossaryMode(false);
                text = text.replace(/\[MODO_GLOSARIO_DESACTIVADO\]/g, '').trim();
            }

            const modelMessage: Message = { role: 'model', text: text.trim(), sources };
            setMessages(prev => [...prev, modelMessage]);
        }
        
        setIsLoading(false);

    }, [input, isLoading]);

    const handleToggleExerciseMode = () => {
        const nextState = !isExerciseMode;
        setIsExerciseMode(nextState);
        if (nextState) {
            setIsGlossaryMode(false);
        }
    };

    const handleToggleGlossaryMode = () => {
        const nextState = !isGlossaryMode;
        setIsGlossaryMode(nextState);
        if (nextState) {
            setIsExerciseMode(false);
        }
    };

    return (
        <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
             <div className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm flex justify-between items-center rounded-t-2xl flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-200">Asistente de Blender</h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleToggleGlossaryMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                            isGlossaryMode 
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 ring-purple-400' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                        title={isGlossaryMode ? 'Salir del Modo Glosario' : 'Activar Modo Glosario'}
                    >
                        <GlossaryIcon className="w-4 h-4" />
                        <span>GLOSARIO</span>
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isGlossaryMode ? 'bg-white' : 'bg-gray-400'}`}></div>
                    </button>
                    <button 
                        onClick={handleToggleExerciseMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                            isExerciseMode 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-green-400' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                        title={isExerciseMode ? 'Salir del Modo Ejercicio' : 'Activar Modo Ejercicio'}
                    >
                        {isExerciseMode ? (
                            <span className="text-sm leading-none -mt-0.5" aria-label="computer icon">💻</span>
                        ) : (
                            <ExerciseIcon className="w-4 h-4" />
                        )}
                        <span>Modo Ejercicio</span>
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isExerciseMode ? 'bg-white' : 'bg-gray-400'}`}></div>
                    </button>
                </div>
            </div>
            <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center">
                               <BlenderIcon className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className={`max-w-md lg:max-w-lg px-5 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                            <p className="text-white whitespace-pre-wrap">{renderMessageText(msg.text)}</p>
                             {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-600">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Fuentes</h4>
                                    <ul className="space-y-1.5">
                                        {msg.sources.map((source, i) => (
                                            <li key={i}>
                                                <a 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 group"
                                                    title={source.uri}
                                                >
                                                   <SourceIcon className="w-4 h-4 flex-shrink-0 text-gray-500 group-hover:text-blue-300 transition-colors" />
                                                   <span className="truncate">{source.title || new URL(source.uri).hostname}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                         {msg.role === 'user' && (
                            <div className="w-10 h-10 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                               <UserIcon className="w-6 h-6 text-gray-300" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center">
                            <BlenderIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="max-w-md lg:max-w-lg px-5 py-3 rounded-2xl bg-gray-700 rounded-bl-none flex items-center space-x-2">
                           <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                           <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                           <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu pregunta sobre Blender..."
                        className="flex-grow bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || input.trim() === ''}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <SendIcon className="w-6 h-6"/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;