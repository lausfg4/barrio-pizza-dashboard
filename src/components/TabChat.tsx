'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertaConsolidada } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Lock, 
  ShoppingBag,
  RefreshCw
} from 'lucide-react';

interface TabChatProps {
  alerts: AlertaConsolidada[];
  onApproveOrder: (sucursal: string, ingredienteId: string, cantidad: number) => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  draft?: {
    proveedor: string;
    destino: string;
    insumo: string;
    cantidad: number;
    ingredienteId: string;
    formato: string;
  };
}

export default function TabChat({ alerts, onApproveOrder }: TabChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: '¡Hola! Soy tu Asistente IA de Barrio Pizza. Puedo ayudarte a analizar los consumos, identificar riesgos de quiebre y redactar borradores de órdenes de compra. ¿En qué puedo colaborarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyWidget, setShowKeyWidget] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Intentar cargar la API key del entorno o del localStorage al iniciar
  useEffect(() => {
    const localKey = localStorage.getItem('GEMINI_API_KEY') || '';
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (localKey) {
      setApiKey(localKey);
    } else if (envKey) {
      setApiKey(envKey);
    } else {
      setShowKeyWidget(true);
    }
  }, []);

  // Hacer scroll automático al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('GEMINI_API_KEY', key);
    setShowKeyWidget(false);
  };

  const suggestions = [
    'Sugerir orden para Costa del Este',
    '¿Qué sucursales tienen quiebre de stock?',
    'Analizar mermas de queso mozzarella'
  ];

  // Enviar mensaje al chatbot de Gemini
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    if (!apiKey) {
      setShowKeyWidget(true);
      return;
    }

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Formatear el estado actual de las alertas como contexto para el modelo
      const contextSummary = alerts.map(a => 
        `Sucursal: ${a.sucursal} | Insumo: ${a.nombre} (ID: ${a.ingrediente_id}) | Stock Actual: ${a.stock_actual_unidad_base} | Necesidad Real: ${a.necesidad_real} | Formato: ${a.formato_compra} (equivale a ${a.unidad_base_por_formato} ${a.unidad_base})`
      ).join('\n');

      const systemInstruction = `
Eres un asistente inteligente para la cadena de pizzerías "Barrio Pizza". Tienes acceso en tiempo real a los siguientes datos de stock y alertas:
${contextSummary}

Cuando el usuario te pida sugerir u ordenar un insumo, debes proponer el pedido basándote en la columna "Necesidad Real". 
Si propones un pedido, debes finalizar SIEMPRE tu mensaje con un tag de formato EXACTO en una línea nueva al final del mensaje:
[BORRADOR: Proveedor | Destino | Insumo | Cantidad | ingrediente_id]
Donde:
- Proveedor: Nombre del proveedor sugerido (Distribuidora DPA, Quesos de la Villa, o Frutas & Más).
- Destino: Nombre de la sucursal de destino.
- Insumo: Nombre del ingrediente.
- Cantidad: Cantidad recomendada a pedir en formatos de compra (redondear a entero hacia arriba).
- ingrediente_id: El ID técnico del ingrediente (ej. mozzarella, harina_00, etc.).

Ejemplo de tag: [BORRADOR: Quesos de la Villa | Costa del Este | Mozzarella | 11 | mozzarella]
`;

      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ 
        model: 'gemini-3.5-flash',
        systemInstruction: systemInstruction
      });

      // Alimentar el historial de chat para mantener el contexto, asegurando que comience con un rol 'user'
      const firstUserIdx = messages.findIndex(m => m.role === 'user');
      const cleanHistory = firstUserIdx !== -1
        ? messages.slice(firstUserIdx).map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          }))
        : [];

      const chat = model.startChat({
        history: cleanHistory
      });

      const response = await chat.sendMessage(textToSend);
      const replyText = response.response.text() || '';

      // Interceptar tag de borrador de orden en la respuesta
      const draftRegex = /\[BORRADOR:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^\]]+)\]/i;
      const match = replyText.match(draftRegex);

      let cleanReply = replyText;
      let draftObj = undefined;

      if (match) {
        // Ocultar el tag técnico de la respuesta visible
        cleanReply = replyText.replace(draftRegex, '').trim();
        
        const targetAlert = alerts.find(a => a.ingrediente_id === match[5].trim());

        draftObj = {
          proveedor: match[1].trim(),
          destino: match[2].trim(),
          insumo: match[3].trim(),
          cantidad: parseInt(match[4].trim(), 10) || 0,
          ingredienteId: match[5].trim(),
          formato: targetAlert ? targetAlert.formato_compra : 'formatos'
        };
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: cleanReply,
        draft: draftObj
      }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: `❌ **Error de Conexión:** No se pudo comunicar con Gemini. Detalles: ${error.message || 'Verifica tu API Key o conexión de red.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Aprobar borrador desde el chat
  const handleApproveDraft = (msgIndex: number, draft: NonNullable<Message['draft']>) => {
    onApproveOrder(draft.destino, draft.ingredienteId, draft.cantidad);
    
    // Marcar como aprobado en el chat local
    setMessages(prev => prev.map((m, idx) => {
      if (idx === msgIndex) {
        return {
          ...m,
          content: `${m.content}\n\n✅ **Pedido de ${draft.cantidad} ${draft.formato} de ${draft.insumo} aprobado y guardado en base de datos.**`,
          draft: undefined // Quitar botones interactivos
        };
      }
      return m;
    }));
  };

  return (
    <div className="flex flex-col gap-6 flex-1 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-3xl font-bold text-[#271716] tracking-tight">Asistente IA</h2>
        <p className="text-sm text-[#5f5e5e] font-medium">Consulta el estado de tus órdenes e inventarios mediante lenguaje natural.</p>
      </div>

      {/* API Key Configure Banner */}
      {showKeyWidget && (
        <div className="bg-[#fff0ee] border border-[#e4beb9] rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-[#b7131a]" />
            <div>
              <h4 className="text-sm font-bold text-[#b7131a]">API Key de Gemini Requerida</h4>
              <p className="text-xs text-[#5f5e5e] font-semibold">Pega tu clave para poder conectarte con el modelo inteligente de Google.</p>
            </div>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              className="bg-white border border-[#e4beb9]/60 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#b7131a] flex-1 md:w-48"
              id="chat_api_key_input"
            />
            <button
              onClick={() => {
                const el = document.getElementById('chat_api_key_input') as HTMLInputElement;
                if (el?.value) saveApiKey(el.value);
              }}
              className="bg-[#b7131a] hover:bg-[#93000d] text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2.5">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => handleSendMessage(s)}
            disabled={isLoading}
            className="bg-white hover:bg-[#fff8f7] border border-[#e4beb9]/40 text-[#271716] text-xs font-bold py-2 px-4 rounded-full transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#b7131a]" />
            <span>{s}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white border border-[#e4beb9]/30 rounded-2xl p-6 h-[400px] overflow-y-auto flex flex-col gap-4 shadow-inner custom-scrollbar">
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'model';
          return (
            <div key={idx} className="flex flex-col gap-2">
              {/* Message Bubble */}
              <div 
                className={`flex gap-3 max-w-[80%] ${
                  isAssistant ? 'self-start' : 'self-end flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                  isAssistant ? 'bg-[#b7131a] text-white' : 'bg-[#FDE8E8] text-[#b7131a]'
                }`}>
                  {isAssistant ? <Bot className="w-4 h-4" /> : 'U'}
                </div>

                <div 
                  className={`rounded-2xl p-4 text-xs font-semibold whitespace-pre-wrap leading-relaxed shadow-sm ${
                    isAssistant 
                      ? 'bg-white text-[#271716] border border-[#e4beb9]/30 border-l-4 border-l-[#b7131a]' 
                      : 'bg-[#b7131a] text-white'
                  }`}
                >
                  {m.content}
                </div>
              </div>

              {/* Interactive Draft Card if applicable */}
              {isAssistant && m.draft && (
                <div className="ml-11 max-w-md bg-white border-2 border-[#b7131a] rounded-2xl overflow-hidden shadow-md">
                  <div className="bg-[#fff0ee] px-4 py-3 border-b border-[#e4beb9]/40 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#b7131a]" />
                      <span className="text-xs font-bold text-[#b7131a]">Borrador de Pedido</span>
                    </div>
                    <span className="text-[9px] font-bold bg-[#b7131a]/15 text-[#b7131a] px-2 py-0.5 rounded uppercase">Recomendado</span>
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between border-b border-[#e4beb9]/20 pb-1.5 text-xs font-medium">
                      <span className="text-[#5f5e5e]">Proveedor:</span>
                      <span className="font-bold text-[#271716]">{m.draft.proveedor}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#e4beb9]/20 pb-1.5 text-xs font-medium">
                      <span className="text-[#5f5e5e]">Destino:</span>
                      <span className="font-bold text-[#271716]">{m.draft.destino}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#e4beb9]/20 pb-1.5 text-xs font-medium">
                      <span className="text-[#5f5e5e]">Insumo:</span>
                      <span className="font-bold text-[#271716]">{m.draft.insumo}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 text-xs font-medium">
                      <span className="text-[#5f5e5e]">Cantidad Sugerida:</span>
                      <span className="font-bold text-[#b7131a]">{m.draft.cantidad} {m.draft.formato}</span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => {
                          // Simplemente enfocar o avisar al usuario para modificarlo en la primera pestaña
                          alert(`Puedes modificar el valor de ${m.draft?.insumo} directamente en la primera pestaña (Resumen & Alertas).`);
                        }}
                        className="flex-1 bg-white hover:bg-[#fff8f7] border border-[#e4beb9]/60 text-[#5f5e5e] text-xs font-bold py-2 rounded-lg transition-all"
                      >
                        Modificar
                      </button>
                      <button 
                        onClick={() => handleApproveDraft(idx, m.draft!)}
                        className="flex-1 bg-[#b7131a] hover:bg-[#93000d] text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar Orden</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex gap-3 self-start max-w-[80%] items-center">
            <div className="w-8 h-8 rounded-full bg-[#b7131a] text-white flex items-center justify-center flex-shrink-0 animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-xs text-[#5f5e5e] font-semibold animate-pulse">Pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Chat Field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
          disabled={isLoading}
          placeholder={apiKey ? "Pregúntale a Barrio Pizza AI..." : "Configura tu API Key primero..."}
          className="flex-1 bg-white border border-[#e4beb9]/60 rounded-full px-5 py-3 text-xs font-semibold focus:outline-none focus:border-[#b7131a] focus:ring-1 focus:ring-[#b7131a] shadow-sm disabled:opacity-50 text-[#271716]"
        />
        <button
          onClick={() => handleSendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="bg-[#b7131a] hover:bg-[#93000d] text-white rounded-full w-12 h-12 flex items-center justify-center transition-all shadow-md disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
