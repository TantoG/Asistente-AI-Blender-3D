import React from 'react';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  return (
    <div className="h-full bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <header className="w-full max-w-4xl mx-auto text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-blue-500">
          Asistente IA para Blender 3D
        </h1>
        <p className="text-gray-400 mt-2">Tu compañero de estudio para dominar Blender</p>
      </header>
      <main className="w-full flex-grow flex items-center justify-center">
        <Chatbot />
      </main>
    </div>
  );
};

export default App;