
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { CacheCleanupService } from '../services/cacheCleanupService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    register: (userData: Omit<User, 'id'> & { 
        password: string;
        hasMultipleCpds?: boolean;
        additionalCpds?: Array<{id: string, number: string}>;
    }) => Promise<{ success: boolean; message: string }>;
    resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in from localStorage
        const checkUser = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);

                    setUser(userData);
                } else {

                    }
            } catch (error) {
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);
    
    const login = async (email: string, password: string) => {
        try {
            // Buscar usuário na nossa tabela personalizada
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (userError || !userData) {
                return { success: false, message: 'Email ou senha incorretos.' };
            }

            // Verificar senha
            const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
            if (!isPasswordValid) {
                return { success: false, message: 'Email ou senha incorretos.' };
            }

            const userObj = {
                id: userData.id,
                name: userData.name,
                phone: userData.phone,
                email: userData.email,
                cnpj: userData.cnpj,
                cpd: userData.cpd,
                is_admin: userData.is_admin || false,
            };

            // Salvar no localStorage
            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);
            
            return { success: true, message: 'Login realizado com sucesso!' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    };

    const logout = async () => {
        try {
            // 🔧 CORREÇÃO: Limpar cache local no logout
            console.log('🧹 Limpando cache no logout...');
            CacheCleanupService.clearCacheOnLogout();
            
            localStorage.removeItem('user');
            setUser(null);
            
            console.log('✅ Logout realizado e cache limpo');
        } catch (error) {
            console.error('❌ Erro no logout:', error);
        }
    };

           const register = async (userData: Omit<User, 'id'> & { 
               password: string;
               hasMultipleCpds?: boolean;
               additionalCpds?: Array<{id: string, number: string}>;
           }) => {
        try {
            console.log('🔐 REGISTER: Iniciando cadastro com:', userData);
            // Check if user already exists
            console.log('🔍 REGISTER: Verificando usuários existentes...');
            
            // Construir query de verificação dinamicamente
            let orConditions = `email.eq.${userData.email}`;
            if (userData.cnpj) {
                orConditions += `,cnpj.eq.${userData.cnpj}`;
            }
            if (userData.cpf) {
                orConditions += `,cpf.eq.${userData.cpf}`;
            }
            if (userData.cpd) {
                orConditions += `,cpd.eq.${userData.cpd}`;
            }
            
            const { data: existingUsers, error: checkError } = await supabase
                .from('users')
                .select('email, cnpj, cpf, cpd')
                .or(orConditions);

            console.log('🔍 REGISTER: Resultado da verificação:', { existingUsers, checkError });

            if (checkError) {
                console.log('⚠️ REGISTER: Erro na verificação, continuando...');
                // Continue com o cadastro mesmo se houver erro na verificação
            } else if (existingUsers && existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                if (existingUser.email === userData.email) {
                    return { success: false, message: 'Email já cadastrado.' };
                }
                if (userData.cnpj && existingUser.cnpj === userData.cnpj) {
                    return { success: false, message: 'CNPJ já cadastrado.' };
                }
                if (userData.cpf && existingUser.cpf === userData.cpf) {
                    return { success: false, message: 'CPF já cadastrado.' };
                }
                if (userData.cpd && existingUser.cpd === userData.cpd) {
                    return { success: false, message: 'CPD já cadastrado.' };
                }
            }

            // Hash da senha
            const passwordHash = await bcrypt.hash(userData.password, 10);
            
                   // Create user record in our custom users table
                   // Tratar strings vazias como null para CPF e CNPJ
                   const cnpjValue = userData.cnpj && userData.cnpj.trim() ? userData.cnpj.trim() : null;
                   const cpfValue = userData.cpf && userData.cpf.trim() ? userData.cpf.trim() : null;
                   
                   const userInsertData: any = {
                       name: userData.name,
                       phone: userData.phone,
                       email: userData.email,
                       cnpj: cnpjValue,
                       cpf: cpfValue,
                       has_multiple_cpds: userData.hasMultipleCpds || false,
                       password_hash: passwordHash,
                       cnpj_data: userData.cnpjData || null, // Dados completos do CNPJ
                       // Campos adicionais da tabela users (apenas para CNPJ)
                       natureza_juridica: userData.cnpjData?.natureza_juridica || null,
                       endereco: userData.cnpjData?.endereco || null,
                       capital_social: userData.cnpjData?.capital_social || null,
                       porte_empresa: userData.cnpjData?.porte_empresa || null,
                       razao_social: userData.cnpjData?.razao_social || null,
                       nome_fantasia: userData.cnpjData?.nome_fantasia || null,
                       situacao_cadastral: userData.cnpjData?.situacao_cadastral || null,
                   };

                   // Só adicionar CPD se não for múltiplos CPDs
                   if (!userData.hasMultipleCpds && userData.cpd) {
                       userInsertData.cpd = userData.cpd;
                   }

                   console.log('💾 REGISTER: Inserindo usuário com dados:', userInsertData);
                   const { data: newUser, error: userError } = await supabase
                       .from('users')
                       .insert(userInsertData)
                       .select('id, name, phone, email, cnpj, cpf, cpd, has_multiple_cpds')
                       .single();

                   console.log('💾 REGISTER: Resultado da inserção:', { newUser, userError });

            if (userError) {
                console.log('❌ REGISTER: Erro ao criar usuário:', userError);
                return { success: false, message: `Erro ao criar usuário: ${userError.message}` };
            }

            // Salvar CPDs adicionais se existirem (formato JSONB)
            if (userData.hasMultipleCpds && userData.additionalCpds && userData.additionalCpds.length > 0) {
                const cpdData = {
                    cpds: userData.additionalCpds.map(cpd => ({
                        id: cpd.id,
                        number: cpd.number,
                        name: `CPD ${cpd.number}`,
                        isActive: true
                    }))
                };

                const { error: cpdError } = await supabase
                    .from('users')
                    .update({ cpd: cpdData })
                    .eq('id', newUser.id);

                if (cpdError) {
                    // Não falhar o cadastro por causa dos CPDs adicionais
                }
            }

            console.log('✅ REGISTER: Usuário criado com sucesso!');
            return { success: true, message: 'Conta criada com sucesso! Faça login para continuar.' };
        } catch (error) {
            console.log('❌ REGISTER: Erro interno:', error);
            return { success: false, message: 'Erro interno do servidor.' };
        }
    };

    const resetPassword = async (email: string) => {
        try {
            // 🔍 VERIFICAR SE O EMAIL EXISTE NO CADASTRO PRIMEIRO
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .single();
            
            if (userError || !userData) {
                return { 
                    success: false, 
                    message: 'Email não encontrado em nosso sistema. Verifique se o email está correto.' 
                };
            }

            // ✅ EMAIL EXISTE - ENVIAR LINK DE RECUPERAÇÃO
            // FORÇAR URL DE PRODUÇÃO - O Supabase está ignorando a configuração dinâmica
            const currentHost = window.location.hostname;
            const isLocalhost = currentHost === 'localhost' || currentHost.includes('127.0.0.1');
            
            let resetUrl;
            if (isLocalhost) {
                // Desenvolvimento local
                resetUrl = 'http://localhost:3000/reset-password';
            } else {
                // Produção - SEMPRE usar a URL atual do Vercel
                resetUrl = `${window.location.origin}/reset-password`;
            }
            
            console.log('🔗 Hostname atual:', currentHost);
            console.log('🔗 Ambiente:', isLocalhost ? 'Desenvolvimento' : 'Produção');
            console.log('🔗 URL de recuperação FORÇADA:', resetUrl);
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: resetUrl,
                // Forçar URL específica para sobrescrever configuração do Dashboard
                emailRedirectTo: resetUrl
            });
            
            if (error) {
                return { success: false, message: error.message };
            }
            
            return { success: true, message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' };
        } catch (error) {
            return { success: false, message: 'Erro interno do servidor.' };
        }
    };

    const authContextValue = {
        user,
        loading,
        login,
        logout,
        register,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
