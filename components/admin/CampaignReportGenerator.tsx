import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File, Loader2 } from 'lucide-react';
import { CompleteDataExportService } from '../../services/CompleteDataExportService';

interface CampaignReportGeneratorProps {
  onClose?: () => void;
}

export default function CampaignReportGenerator({ onClose }: CampaignReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadCSV = async () => {
    try {
      setIsGenerating(true);

      await CompleteDataExportService.downloadCompleteCSV();

    } catch (error) {
      alert(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadXLS = async () => {
    try {
      setIsGenerating(true);

      await CompleteDataExportService.downloadXLSReport();

    } catch (error) {
      alert(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    try {
      setIsGenerating(true);

      await CompleteDataExportService.downloadMarkdownReport();

    } catch (error) {
      alert(`Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gerar Relatório Completo</h2>
            <p className="text-sm text-gray-600 mt-1">
              Baixe todas as informações das campanhas, apólices e prêmios
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">O que está incluído no relatório:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Dados das Campanhas:</strong> ID, título, tipo, status, metas, progresso, datas</li>
              <li>• <strong>Informações dos Criadores:</strong> Nome, email, CPD</li>
              <li>• <strong>Informações dos Aceitadores:</strong> Nome, email, CPD</li>
              <li>• <strong>Detalhes das Apólices:</strong> Número, tipo, valor, CPD, corretor, datas</li>
              <li>• <strong>Vinculações:</strong> Se a apólice está vinculada à campanha</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CSV */}
            <button
              onClick={handleDownloadCSV}
              disabled={isGenerating}
              className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-6 h-6" />
              )}
              <div className="text-center">
                <div className="font-medium text-sm">Baixar CSV</div>
                <div className="text-xs opacity-90">Planilha CSV</div>
              </div>
            </button>

            {/* XLS */}
            <button
              onClick={handleDownloadXLS}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <File className="w-6 h-6" />
              )}
              <div className="text-center">
                <div className="font-medium text-sm">Baixar XLS</div>
                <div className="text-xs opacity-90">Excel XLS</div>
              </div>
            </button>

            {/* Markdown */}
            <button
              onClick={handleDownloadMarkdown}
              disabled={isGenerating}
              className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors duration-200 flex flex-col items-center space-y-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
              <div className="text-center">
                <div className="font-medium text-sm">Baixar MD</div>
                <div className="text-xs opacity-90">Markdown</div>
              </div>
            </button>
          </div>

          {isGenerating && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-blue-700">
                  Gerando relatório...
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Isso pode levar alguns segundos dependendo da quantidade de dados.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-end">
            <div className="flex space-x-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
