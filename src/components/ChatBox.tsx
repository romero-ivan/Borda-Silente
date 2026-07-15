/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, ChevronDown, Sparkles } from 'lucide-react';
import { ChatMessage, SenderRole } from '../types.js';

interface ChatBoxProps {
  currentRole: SenderRole;
  currentUserName: string;
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  compact?: boolean;
}

export default function ChatBox({ currentRole, currentUserName, chatMessages, onSendMessage, compact = false }: ChatBoxProps) {
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(!compact);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update or chat is toggled
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(inputText.trim());
      setInputText('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  // Humanize sender tag
  const getSenderBadge = (role: SenderRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-1.5 py-0.5 text-[8px] bg-[#2C3627] text-[#FDFCFB] uppercase tracking-wider font-mono rounded-xs">Admin</span>;
      case 'receptionist':
        return <span className="px-1.5 py-0.5 text-[8px] bg-[#8C857B] text-[#FDFCFB] uppercase tracking-wider font-mono rounded-xs">Recepción</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[8px] bg-[#F5F3EF] text-[#8C857B] uppercase tracking-wider font-mono rounded-xs">Huésped</span>;
    }
  };

  const formattedTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (compact && !isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#2C3627] text-[#FDFCFB] hover:bg-[#2C3627]/90 transition-all duration-300 shadow-lg border border-[#E5E1D8] font-mono text-xs uppercase tracking-wider rounded-xs cursor-pointer"
      >
        <MessageSquare className="w-4.5 h-4.5" />
        Atención Chat
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5B181] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5B181]"></span>
        </span>
      </button>
    );
  }

  return (
    <div className={`flex flex-col bg-[#FDFCFB] border border-[#E5E1D8] text-[#2D2D2D] ${
      compact 
        ? 'fixed bottom-6 right-6 z-40 w-80 md:w-96 h-[480px] shadow-2xl rounded-xs' 
        : 'w-full h-full min-h-[350px] md:h-[450px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F5F3EF] border-b border-[#E5E1D8] rounded-t-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#2C3627] rounded-full animate-pulse" />
          <div>
            <h4 className="font-serif text-sm font-medium tracking-tight text-[#2D2D2D]">Atención Silente</h4>
            <p className="font-mono text-[9px] text-[#8C857B] uppercase tracking-wider">Servicio Interconectado</p>
          </div>
        </div>
        {compact && (
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-[#8C857B] hover:text-[#2D2D2D] transition-colors cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FDFCFB]">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-xs text-[#8C857B]">
            <Sparkles className="w-6 h-6 text-[#E5B181] mb-2 animate-pulse" />
            <p className="font-serif italic">"El silencio es elocuente."</p>
            <p className="mt-1">Inicia la conversación para conectar de inmediato con el personal del refugio.</p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const isSelf = (currentRole === msg.senderRole);
            return (
              <div 
                key={msg.id || idx}
                className={`flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-mono text-[#8C857B]">
                  <span>{msg.senderName}</span>
                  {getSenderBadge(msg.senderRole)}
                </div>
                <div className={`p-3 text-xs leading-relaxed ${
                  isSelf 
                    ? 'bg-[#2C3627] text-[#FDFCFB] rounded-l-md rounded-tr-xs' 
                    : 'bg-[#F5F3EF] text-[#2D2D2D] border border-[#E5E1D8] rounded-r-md rounded-tl-xs'
                }`}>
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
                <span className="text-[8px] font-mono text-[#8C857B] mt-0.5">
                  {formattedTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#E5E1D8] bg-[#F5F3EF] flex gap-2 rounded-b-xs">
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Escribe como ${currentRole === 'consumer' ? 'huésped' : currentRole === 'receptionist' ? 'recepción' : 'administrador'}...`}
          disabled={isSending}
          className="flex-1 px-3 py-2 text-xs bg-[#FDFCFB] border border-[#D1CDC3] placeholder-[#8C857B] text-[#2D2D2D] focus:outline-hidden focus:border-[#8C857B] transition-colors rounded-xs"
        />
        <button 
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2 bg-[#2D2D2D] text-[#FDFCFB] hover:bg-[#8C857B] transition-colors disabled:opacity-40 disabled:hover:bg-[#2D2D2D] rounded-xs cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
