import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { usePolicies } from '../../hooks/usePolicies';
import DynamicTable from '../ui/DynamicTable';
import { supabase } from '../../lib/supabase';
import { Trash2 } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import TicketTag from '../ui/TicketTag';

import { Policy, PolicyType, ContractType } from '../../types';


const PoliciesTable: React.FC = () => {
  const { policies, addPolicy, refreshPolicies, lastUpdate } = usePolicies();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    policy: Policy | null;
  }>({
    isOpen: false,
    policy: null
  });
  
  console.log('PoliciesTable: policies received:', policies);
  console.log('PoliciesTable: policies length:', policies.length);
  console.log('PoliciesTable: lastUpdate:', lastUpdate);
  console.log('PoliciesTable: loading:', loading);
  
  // Debug: Check if policies have the correct structure
  if (policies.length > 0) {
    console.log('PoliciesTable: First policy structure:', policies[0]);
    console.log('PoliciesTable: Policy keys:', Object.keys(policies[0]));
  }
  


  // Removed handleEdit function - not needed for audit system

  const handleDelete = (policy: Policy) => {
    console.log('PoliciesTable: Opening delete modal for policy:', policy);
    setDeleteModal({
      isOpen: true,
      policy: policy
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.policy) return;
    
    console.log('PoliciesTable: Confirming deletion of policy:', deleteModal.policy);
    setLoading(deleteModal.policy.id);
    
    try {
      await deletePolicy(deleteModal.policy.id);
      setDeleteModal({ isOpen: false, policy: null });
    } catch (error) {
      console.error('Error deleting policy:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCloseModal = () => {
    setDeleteModal({ isOpen: false, policy: null });
  };

  // Removed updatePolicy function - not needed for audit system

  const deletePolicy = async (id: string) => {
    setLoading(id);
    try {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting policy:', error);
        // TODO: Implementar modal de erro
        console.log('❌ Erro ao excluir apólice! Tente novamente ou contate o suporte.');
      } else {
        console.log('✅ Apólice excluída com sucesso! A tabela será atualizada automaticamente.');
        // A página será atualizada automaticamente pelo hook
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      // TODO: Implementar modal de erro
      console.log('Erro ao excluir apólice');
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };


  const columns: ColumnDef<Policy>[] = [
    {
      accessorKey: 'policyNumber',
      header: () => <div className="text-left">Número da Apólice</div>,
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 text-left">
          {row.getValue('policyNumber')}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: () => <div className="text-left">Tipo</div>,
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <div className="text-left">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              type === 'Seguro Auto' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {type === 'Seguro Auto' ? 'Auto' : 'Residencial'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'premiumValue',
      header: () => <div className="text-left">Valor do Prêmio</div>,
      cell: ({ row }) => (
        <div className="font-semibold text-gradient text-left">
          {formatCurrency(row.getValue('premiumValue'))}
        </div>
      ),
    },
    {
      accessorKey: 'registrationDate',
      header: () => <div className="text-left">Data de Registro</div>,
      cell: ({ row }) => (
        <div className="text-gray-600 text-left">
          {formatDate(row.getValue('registrationDate'))}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: () => <div className="text-left">Criado em</div>,
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return (
          <div className="text-gray-600 text-left text-xs">
            {date ? formatDate(date) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: () => <div className="text-left">Atualizado em</div>,
      cell: ({ row }) => {
        const date = row.getValue('updatedAt') as string;
        return (
          <div className="text-gray-600 text-left text-xs">
            {date ? formatDate(date) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'ticketCode',
      header: () => <div className="text-left">Ticket</div>,
      cell: ({ row }) => {
        const ticketCode = row.getValue('ticketCode') as string;
        return (
          <div className="text-left">
            <TicketTag ticketCode={ticketCode} />
          </div>
        );
      },
    },
    {
      accessorKey: 'contractType',
      header: () => <div className="text-left">Contrato</div>,
      cell: ({ row }) => {
        const contractType = row.getValue('contractType') as string;
        return (
          <div className="text-left">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              contractType === 'Novo' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {contractType}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'city',
      header: () => <div className="text-left">Cidade</div>,
      cell: ({ row }) => {
        const city = row.getValue('city') as string;
        return (
          <div className="text-left">
            <span className="text-sm text-gray-700">
              {city || '-'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'id',
      header: () => <div className="text-left">ID</div>,
      cell: ({ row }) => {
        const id = row.getValue('id') as string;
        return (
          <div className="text-left">
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {id.substring(0, 8)}...
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-left">Ações</div>,
      cell: ({ row }) => {
        const policy = row.original;
        const isLoading = loading === policy.id;
        
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleDelete(policy)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
              title="Excluir apólice"
            >
              <Trash2 className="w-4 h-4" />
              {isLoading ? '...' : 'Excluir'}
            </button>
          </div>
        );
      },
    },
  ];


  return (
    <div className="w-full">
      <DynamicTable
        data={policies}
        columns={columns}
        title="Histórico de Apólices"
        searchPlaceholder="Buscar por número da apólice..."
        pageSize={10}
        loading={loading !== null}
      />
      
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Excluir Apólice"
        message={`Tem certeza que deseja excluir a apólice ${deleteModal.policy?.policyNumber}?\n\nValor: R$ ${deleteModal.policy?.premiumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nTipo: ${deleteModal.policy?.type}`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={loading === deleteModal.policy?.id}
      />
    </div>
  );
};

export default PoliciesTable;
