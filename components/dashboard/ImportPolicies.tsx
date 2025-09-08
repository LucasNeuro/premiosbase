import React, { useState } from 'react';
import { usePolicies } from '../../hooks/usePolicies';
import { PolicyType } from '../../types';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportedPolicy {
  policyNumber: string;
  type: PolicyType;
  premiumValue: number;
  registrationDate: string;
  city: string;
  contractType: string;
}

const ImportPolicies: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importedPolicies, setImportedPolicies] = useState<ImportedPolicy[]>([]);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const { addPolicy } = usePolicies();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSVFile(selectedFile);
    }
  };

  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const policies: ImportedPolicy[] = [];

      // Pular o cabeçalho (primeira linha)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const columns = line.split(',');
          if (columns.length >= 4) {
            policies.push({
              policyNumber: columns[0].trim(),
              type: columns[1].trim() as PolicyType,
              premiumValue: parseFloat(columns[2].trim().replace('R$', '').replace('.', '').replace(',', '.')),
              registrationDate: columns[3].trim(),
              city: columns[4]?.trim() || '',
              contractType: columns[5]?.trim() || 'Novo',
            });
          }
        }
      }

      setImportedPolicies(policies);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importedPolicies.length === 0) {
      setMessage({ text: 'Nenhuma apólice para importar.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    let successCount = 0;
    let errorCount = 0;

    for (const policy of importedPolicies) {
      try {
        const result = await addPolicy(policy);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setLoading(false);
    
    if (errorCount === 0) {
      setMessage({ 
        text: `${successCount} apólices importadas com sucesso!`, 
        type: 'success' 
      });
      setImportedPolicies([]);
      setFile(null);
    } else {
      setMessage({ 
        text: `${successCount} apólices importadas, ${errorCount} com erro.`, 
        type: 'error' 
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Número da Apólice,Tipo,Valor do Prêmio,Data de Registro,Cidade,Tipo de Contrato\n458777,Seguro Residencial,458200,2025-09-06,São Paulo,Novo\n458110,Seguro Auto,56890,2025-09-06,Rio de Janeiro,Renovação";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_apolices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Importar Apólices</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
        >
          <Upload className="w-4 h-4" />
          {isOpen ? 'Fechar' : 'Importar'}
        </button>
      </div>

      {isOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-lg animate-fade-in">
          <div className="p-6">
            {message && (
              <div className={`alert ${
                message.type === 'success' 
                  ? 'alert-success' 
                  : 'alert-error'
              } mb-4`}>
                <span>{message.text}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Arquivo CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={downloadTemplate}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <FileText className="w-4 h-4" />
                  Baixar Template
                </button>
              </div>

              {importedPolicies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">
                    Pré-visualização ({importedPolicies.length} apólices)
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-700">Número</th>
                          <th className="px-3 py-2 text-left text-gray-700">Tipo</th>
                          <th className="px-3 py-2 text-left text-gray-700">Valor</th>
                          <th className="px-3 py-2 text-left text-gray-700">Cidade</th>
                          <th className="px-3 py-2 text-left text-gray-700">Contrato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importedPolicies.slice(0, 5).map((policy, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">{policy.policyNumber}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                policy.type === 'Seguro Auto' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {policy.type === 'Seguro Auto' ? 'Auto' : 'Residencial'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-900">
                              R$ {policy.premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-gray-900">{policy.city || '-'}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                policy.contractType === 'Novo' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {policy.contractType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importedPolicies.length > 5 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center bg-gray-50">
                        ... e mais {importedPolicies.length - 5} apólices
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleImport}
                  disabled={loading || importedPolicies.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Importar {importedPolicies.length} Apólices
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setImportedPolicies([]);
                    setFile(null);
                    setMessage(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPolicies;

