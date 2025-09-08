import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface TicketTagProps {
  ticketCode: string;
  className?: string;
}

const TicketTag: React.FC<TicketTagProps> = ({ ticketCode, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ticketCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar ticket:', err);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Tag com ícone de tick */}
      <div
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer
          hover:bg-blue-100 hover:border-blue-300 transition-all duration-200
          ${className}
        `}
        onClick={handleCopy}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title="Clique para copiar o ticket"
      >
        <Check className="w-3 h-3" />
        <span className="font-mono">TKT</span>
        {copied && (
          <Copy className="w-3 h-3 text-green-600 animate-pulse" />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50">
          <div className="font-mono">{ticketCode}</div>
          <div className="text-gray-300 text-xs mt-1">Clique para copiar</div>
          {/* Seta do tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Feedback de cópia */}
      {copied && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          Copiado!
        </div>
      )}
    </div>
  );
};

export default TicketTag;
