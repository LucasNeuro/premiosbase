import { supabase } from '../lib/supabase';

export interface CpdValidationResult {
    isValid: boolean;
    message: string;
    existingCpds?: string[];
}

/**
 * Valida se os CPDs já estão cadastrados no banco de dados
 * @param cpds Array de CPDs para validar
 * @returns Resultado da validação
 */
export const validateCpds = async (cpds: string[]): Promise<CpdValidationResult> => {
    try {
        console.log('🔍 CPD VALIDATION: Verificando CPDs:', cpds);
        
        // Limpar CPDs (remover espaços e garantir formato)
        const cleanCpds = cpds.map(cpd => cpd.trim()).filter(cpd => cpd.length === 6);
        
        if (cleanCpds.length === 0) {
            return {
                isValid: false,
                message: 'Nenhum CPD válido fornecido'
            };
        }

        // Verificar CPDs únicos
        const uniqueCpds = [...new Set(cleanCpds)];
        if (uniqueCpds.length !== cleanCpds.length) {
            return {
                isValid: false,
                message: 'CPDs duplicados não são permitidos'
            };
        }

        // Buscar CPDs existentes no banco usando consulta SQL específica para jsonb
        const conflictingCpds: string[] = [];
        
        for (const cpd of cleanCpds) {
            // Verificar se CPD existe como string simples
            const { data: stringMatch, error: stringError } = await supabase
                .from('users')
                .select('cpd, email, name')
                .eq('cpd', cpd);

            if (stringError) {
                console.error('❌ CPD VALIDATION: Erro ao consultar CPD string:', stringError);
            } else if (stringMatch && stringMatch.length > 0) {
                conflictingCpds.push(cpd);
                continue;
            }

            // Verificar se CPD existe dentro de array jsonb
            const { data: arrayMatch, error: arrayError } = await supabase
                .from('users')
                .select('cpd, email, name')
                .contains('cpd', { cpds: [{ number: cpd }] });

            if (arrayError) {
                console.error('❌ CPD VALIDATION: Erro ao consultar CPD array:', arrayError);
            } else if (arrayMatch && arrayMatch.length > 0) {
                conflictingCpds.push(cpd);
            }
        }

        console.log('🔍 CPD VALIDATION: CPDs em conflito encontrados:', conflictingCpds);

        if (conflictingCpds.length > 0) {
            return {
                isValid: false,
                message: `❌ CPDs já estão em uso: ${conflictingCpds.join(', ')}. Por favor, escolha outros CPDs.`,
                existingCpds: conflictingCpds
            };
        }

        console.log('✅ CPD VALIDATION: Todos os CPDs estão disponíveis');
        return {
            isValid: true,
            message: '✅ Todos os CPDs estão disponíveis para cadastro!'
        };

    } catch (error) {
        console.error('❌ CPD VALIDATION: Erro interno:', error);
        return {
            isValid: false,
            message: 'Erro interno ao validar CPDs'
        };
    }
};

/**
 * Valida um único CPD
 * @param cpd CPD para validar
 * @returns Resultado da validação
 */
export const validateSingleCpd = async (cpd: string): Promise<CpdValidationResult> => {
    return validateCpds([cpd]);
};
