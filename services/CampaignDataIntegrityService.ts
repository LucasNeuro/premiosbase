import { supabase } from '../lib/supabase';
import { UnifiedCampaignProgressServiceV2 } from './UnifiedCampaignProgressServiceV2';

/**
 * 🔍 SERVIÇO DE INTEGRIDADE DE DADOS DAS CAMPANHAS
 * 
 * Este serviço detecta e corrige inconsistências nos dados das campanhas:
 * - Apólices órfãs (sem vinculação)
 * - Progresso desatualizado
 * - Vinculações duplicadas
 * - Timing inconsistente
 * - Dados corrompidos
 */

export interface IntegrityIssue {
  type: 'orphaned_policy' | 'outdated_progress' | 'duplicate_link' | 'timing_inconsistency' | 'data_corruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedIds: string[];
  suggestedAction: string;
  autoFixable: boolean;
}

export interface IntegrityReport {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issues: IntegrityIssue[];
  autoFixed: number;
  manualActionRequired: number;
  reportGeneratedAt: string;
}

export class CampaignDataIntegrityService {
  
  /**
   * 🔍 Executa auditoria completa de integridade
   */
  static async performFullIntegrityAudit(): Promise<IntegrityReport> {
    console.log('🔍 Iniciando auditoria completa de integridade...');
    
    const issues: IntegrityIssue[] = [];
    
    // 1. Verificar apólices órfãs
    const orphanedIssues = await this.detectOrphanedPolicies();
    issues.push(...orphanedIssues);
    
    // 2. Verificar progresso desatualizado
    const progressIssues = await this.detectOutdatedProgress();
    issues.push(...progressIssues);
    
    // 3. Verificar vinculações duplicadas
    const duplicateIssues = await this.detectDuplicateLinks();
    issues.push(...duplicateIssues);
    
    // 4. Verificar inconsistências de timing
    const timingIssues = await this.detectTimingInconsistencies();
    issues.push(...timingIssues);
    
    // 5. Verificar dados corrompidos
    const corruptionIssues = await this.detectDataCorruption();
    issues.push(...corruptionIssues);
    
    // Gerar relatório
    const report = this.generateIntegrityReport(issues);
    
    console.log(`📊 Auditoria concluída: ${report.totalIssues} problemas encontrados`);
    return report;
  }

  /**
   * 🚨 Detecta apólices órfãs (sem vinculação a campanhas)
   */
  private static async detectOrphanedPolicies(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // Buscar apólices que não estão vinculadas a nenhuma campanha ativa
      const { data: orphanedPolicies, error } = await supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          premium_value,
          created_at
        `)
        .eq('status', 'active')
        .not('id', 'in', 
          supabase
            .from('policy_campaign_links')
            .select('policy_id')
            .eq('is_active', true)
        );

      if (error) {
        console.error('❌ Erro ao detectar apólices órfãs:', error);
        return issues;
      }

      if (orphanedPolicies && orphanedPolicies.length > 0) {
        issues.push({
          type: 'orphaned_policy',
          severity: orphanedPolicies.length > 10 ? 'high' : 'medium',
          description: `${orphanedPolicies.length} apólices não estão vinculadas a nenhuma campanha`,
          affectedIds: orphanedPolicies.map(p => p.id),
          suggestedAction: 'Verificar se estas apólices devem ser vinculadas a campanhas ativas',
          autoFixable: false
        });
      }

    } catch (error) {
      console.error('❌ Erro na detecção de apólices órfãs:', error);
    }

    return issues;
  }

  /**
   * 📊 Detecta progresso desatualizado
   */
  private static async detectOutdatedProgress(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // Buscar campanhas ativas
      const { data: campaigns, error } = await supabase
        .from('goals')
        .select('id, title, last_updated')
        .eq('record_type', 'campaign')
        .eq('is_active', true)
        .in('status', ['active', 'completed']);

      if (error) {
        console.error('❌ Erro ao buscar campanhas para verificação de progresso:', error);
        return issues;
      }

      const outdatedCampaigns: string[] = [];
      const now = new Date();

      for (const campaign of campaigns || []) {
        try {
          // Calcular progresso atual
          const currentProgress = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaign.id, true);
          
          if (currentProgress) {
            // Buscar progresso salvo no banco
            const { data: savedProgress, error: progressError } = await supabase
              .from('goals')
              .select('progress_percentage, current_value, last_updated')
              .eq('id', campaign.id)
              .single();

            if (!progressError && savedProgress) {
              const percentageDiff = Math.abs(currentProgress.progressPercentage - (savedProgress.progress_percentage || 0));
              const valueDiff = Math.abs(currentProgress.currentValue - (savedProgress.current_value || 0));
              
              // Considerar desatualizado se diferença > 5% ou > 1000 reais
              if (percentageDiff > 5 || valueDiff > 1000) {
                outdatedCampaigns.push(campaign.id);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar progresso da campanha ${campaign.id}:`, error);
        }
      }

      if (outdatedCampaigns.length > 0) {
        issues.push({
          type: 'outdated_progress',
          severity: outdatedCampaigns.length > 5 ? 'high' : 'medium',
          description: `${outdatedCampaigns.length} campanhas com progresso desatualizado`,
          affectedIds: outdatedCampaigns,
          suggestedAction: 'Recalcular progresso das campanhas afetadas',
          autoFixable: true
        });
      }

    } catch (error) {
      console.error('❌ Erro na detecção de progresso desatualizado:', error);
    }

    return issues;
  }

  /**
   * 🔗 Detecta vinculações duplicadas
   */
  private static async detectDuplicateLinks(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // Buscar vinculações duplicadas
      const { data: duplicates, error } = await supabase
        .from('policy_campaign_links')
        .select('policy_id, campaign_id, count(*)')
        .eq('is_active', true)
        .group('policy_id, campaign_id')
        .having('count(*) > 1');

      if (error) {
        console.error('❌ Erro ao detectar vinculações duplicadas:', error);
        return issues;
      }

      if (duplicates && duplicates.length > 0) {
        const duplicateIds = duplicates.map(d => `${d.policy_id}-${d.campaign_id}`);
        
        issues.push({
          type: 'duplicate_link',
          severity: 'high',
          description: `${duplicates.length} vinculações duplicadas encontradas`,
          affectedIds: duplicateIds,
          suggestedAction: 'Remover vinculações duplicadas mantendo apenas a mais recente',
          autoFixable: true
        });
      }

    } catch (error) {
      console.error('❌ Erro na detecção de vinculações duplicadas:', error);
    }

    return issues;
  }

  /**
   * ⏰ Detecta inconsistências de timing
   */
  private static async detectTimingInconsistencies(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // Buscar vinculações com timing inconsistente
      const { data: timingIssues, error } = await supabase
        .from('policy_campaign_links')
        .select(`
          id,
          policy_id,
          campaign_id,
          linked_at,
          policies!inner(created_at),
          goals!inner(accepted_at, acceptance_status)
        `)
        .eq('is_active', true)
        .eq('goals.acceptance_status', 'accepted')
        .not('goals.accepted_at', 'is', null);

      if (error) {
        console.error('❌ Erro ao detectar inconsistências de timing:', error);
        return issues;
      }

      const inconsistentIds: string[] = [];

      for (const link of timingIssues || []) {
        const policyCreatedAt = new Date(link.policies.created_at);
        const campaignAcceptedAt = new Date(link.goals.accepted_at);
        
        // Apólice criada antes da campanha ser aceita
        if (policyCreatedAt < campaignAcceptedAt) {
          inconsistentIds.push(link.id);
        }
      }

      if (inconsistentIds.length > 0) {
        issues.push({
          type: 'timing_inconsistency',
          severity: 'medium',
          description: `${inconsistentIds.length} vinculações com timing inconsistente`,
          affectedIds: inconsistentIds,
          suggestedAction: 'Revisar vinculações onde apólice foi criada antes da aceitação da campanha',
          autoFixable: false
        });
      }

    } catch (error) {
      console.error('❌ Erro na detecção de inconsistências de timing:', error);
    }

    return issues;
  }

  /**
   * 💾 Detecta dados corrompidos
   */
  private static async detectDataCorruption(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // 1. Campanhas com critérios inválidos
      const { data: invalidCriteria, error: criteriaError } = await supabase
        .from('goals')
        .select('id, title, criteria')
        .eq('record_type', 'campaign')
        .eq('campaign_type', 'composite')
        .not('criteria', 'is', null);

      if (!criteriaError && invalidCriteria) {
        const corruptedCampaigns: string[] = [];

        for (const campaign of invalidCriteria) {
          try {
            let criteria = campaign.criteria;
            if (typeof criteria === 'string') {
              criteria = JSON.parse(criteria);
            }
            
            if (!Array.isArray(criteria) || criteria.length === 0) {
              corruptedCampaigns.push(campaign.id);
            } else {
              // Verificar se todos os critérios têm target_value
              const hasInvalidCriteria = criteria.some(c => !c.target_value || c.target_value <= 0);
              if (hasInvalidCriteria) {
                corruptedCampaigns.push(campaign.id);
              }
            }
          } catch (error) {
            corruptedCampaigns.push(campaign.id);
          }
        }

        if (corruptedCampaigns.length > 0) {
          issues.push({
            type: 'data_corruption',
            severity: 'critical',
            description: `${corruptedCampaigns.length} campanhas com critérios corrompidos`,
            affectedIds: corruptedCampaigns,
            suggestedAction: 'Corrigir ou recriar critérios das campanhas afetadas',
            autoFixable: false
          });
        }
      }

      // 2. Apólices com valores negativos ou zero
      const { data: invalidPolicies, error: policiesError } = await supabase
        .from('policies')
        .select('id, policy_number, premium_value')
        .lte('premium_value', 0);

      if (!policiesError && invalidPolicies && invalidPolicies.length > 0) {
        issues.push({
          type: 'data_corruption',
          severity: 'high',
          description: `${invalidPolicies.length} apólices com valores inválidos`,
          affectedIds: invalidPolicies.map(p => p.id),
          suggestedAction: 'Verificar e corrigir valores das apólices',
          autoFixable: false
        });
      }

    } catch (error) {
      console.error('❌ Erro na detecção de dados corrompidos:', error);
    }

    return issues;
  }

  /**
   * 📊 Gera relatório de integridade
   */
  private static generateIntegrityReport(issues: IntegrityIssue[]): IntegrityReport {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;
    
    const autoFixable = issues.filter(i => i.autoFixable).length;
    const manualActionRequired = issues.filter(i => !i.autoFixable).length;

    return {
      totalIssues: issues.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      issues,
      autoFixed: 0, // Será preenchido após correções automáticas
      manualActionRequired,
      reportGeneratedAt: new Date().toISOString()
    };
  }

  /**
   * 🔧 Executa correções automáticas
   */
  static async executeAutoFixes(report: IntegrityReport): Promise<IntegrityReport> {
    console.log('🔧 Executando correções automáticas...');
    
    let autoFixed = 0;
    const updatedIssues = [...report.issues];

    for (const issue of updatedIssues) {
      if (issue.autoFixable) {
        try {
          let fixed = false;

          switch (issue.type) {
            case 'outdated_progress':
              // Recalcular progresso das campanhas
              for (const campaignId of issue.affectedIds) {
                const progress = await UnifiedCampaignProgressServiceV2.calculateCampaignProgress(campaignId, true);
                if (progress) {
                  await UnifiedCampaignProgressServiceV2.updateCampaignProgressInDB(campaignId, progress);
                  fixed = true;
                }
              }
              break;

            case 'duplicate_link':
              // Remover vinculações duplicadas
              for (const duplicateId of issue.affectedIds) {
                const [policyId, campaignId] = duplicateId.split('-');
                fixed = await this.removeDuplicateLinks(policyId, campaignId);
              }
              break;
          }

          if (fixed) {
            autoFixed++;
            // Marcar issue como resolvida
            issue.description += ' (CORRIGIDO AUTOMATICAMENTE)';
          }

        } catch (error) {
          console.error(`❌ Erro ao corrigir issue ${issue.type}:`, error);
        }
      }
    }

    return {
      ...report,
      autoFixed,
      manualActionRequired: report.manualActionRequired - autoFixed
    };
  }

  /**
   * 🗑️ Remove vinculações duplicadas
   */
  private static async removeDuplicateLinks(policyId: string, campaignId: string): Promise<boolean> {
    try {
      // Buscar todas as vinculações duplicadas
      const { data: links, error } = await supabase
        .from('policy_campaign_links')
        .select('id, created_at')
        .eq('policy_id', policyId)
        .eq('campaign_id', campaignId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error || !links || links.length <= 1) {
        return false;
      }

      // Manter apenas a mais recente, desativar as outras
      const linksToDeactivate = links.slice(1);
      const idsToDeactivate = linksToDeactivate.map(link => link.id);

      const { error: updateError } = await supabase
        .from('policy_campaign_links')
        .update({ is_active: false, unlinked_at: new Date().toISOString() })
        .in('id', idsToDeactivate);

      return !updateError;

    } catch (error) {
      console.error('❌ Erro ao remover vinculações duplicadas:', error);
      return false;
    }
  }

  /**
   * 📋 Gera relatório detalhado em formato legível
   */
  static generateDetailedReport(report: IntegrityReport): string {
    let output = `\n🔍 RELATÓRIO DE INTEGRIDADE DOS DADOS DAS CAMPANHAS\n`;
    output += `📅 Gerado em: ${new Date(report.reportGeneratedAt).toLocaleString('pt-BR')}\n\n`;
    
    output += `📊 RESUMO:\n`;
    output += `   • Total de problemas: ${report.totalIssues}\n`;
    output += `   • Críticos: ${report.criticalIssues}\n`;
    output += `   • Altos: ${report.highIssues}\n`;
    output += `   • Médios: ${report.mediumIssues}\n`;
    output += `   • Baixos: ${report.lowIssues}\n`;
    output += `   • Corrigidos automaticamente: ${report.autoFixed}\n`;
    output += `   • Requer ação manual: ${report.manualActionRequired}\n\n`;

    if (report.issues.length > 0) {
      output += `🚨 PROBLEMAS DETECTADOS:\n\n`;
      
      const groupedIssues = report.issues.reduce((acc, issue) => {
        if (!acc[issue.type]) acc[issue.type] = [];
        acc[issue.type].push(issue);
        return acc;
      }, {} as Record<string, IntegrityIssue[]>);

      for (const [type, issues] of Object.entries(groupedIssues)) {
        const typeName = this.getIssueTypeName(type);
        output += `🔸 ${typeName} (${issues.length} problemas)\n`;
        
        for (const issue of issues) {
          const severity = this.getSeverityIcon(issue.severity);
          output += `   ${severity} ${issue.description}\n`;
          output += `      Ação sugerida: ${issue.suggestedAction}\n`;
          if (issue.affectedIds.length > 0) {
            output += `      IDs afetados: ${issue.affectedIds.slice(0, 5).join(', ')}${issue.affectedIds.length > 5 ? '...' : ''}\n`;
          }
          output += `\n`;
        }
      }
    } else {
      output += `✅ Nenhum problema de integridade detectado!\n`;
    }

    return output;
  }

  private static getIssueTypeName(type: string): string {
    const names: Record<string, string> = {
      'orphaned_policy': 'Apólices Órfãs',
      'outdated_progress': 'Progresso Desatualizado',
      'duplicate_link': 'Vinculações Duplicadas',
      'timing_inconsistency': 'Inconsistências de Timing',
      'data_corruption': 'Dados Corrompidos'
    };
    return names[type] || type;
  }

  private static getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      'critical': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢'
    };
    return icons[severity] || '⚪';
  }
}


