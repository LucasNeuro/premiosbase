
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

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
            localStorage.removeItem('user');
            setUser(null);
        } catch (error) {
        }
    };

           const register = async (userData: Omit<User, 'id'> & { 
               password: string;
               hasMultipleCpds?: boolean;
               additionalCpds?: Array<{id: string, number: string}>;
           }) => {
        try {
            // Check if user already exists
            const { data: existingUsers, error: checkError } = await supabase
                .from('users')
                .select('email, cnpj, cpd')
                .or(`email.eq.${userData.email},cnpj.eq.${userData.cnpj}${userData.cpd ? `,cpd.eq.${userData.cpd}` : ''}`);

            if (checkError) {
                // Continue com o cadastro mesmo se houver erro na verificação
            } else if (existingUsers && existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                if (existingUser.email === userData.email) {
                    return { success: false, message: 'Email já cadastrado.' };
                }
                if (existingUser.cnpj === userData.cnpj) {
                    return { success: false, message: 'CNPJ já cadastrado.' };
                }
                if (userData.cpd && existingUser.cpd === userData.cpd) {
                    return { success: false, message: 'CPD já cadastrado.' };
                }
            }

            // Hash da senha
            const passwordHash = await bcrypt.hash(userData.password, 10);
            
                   // Create user record in our custom users table
                   const userInsertData: any = {
                       name: userData.name,
                       phone: userData.phone,
                       email: userData.email,
                       cnpj: userData.cnpj,
                       has_multiple_cpds: userData.hasMultipleCpds || false,
                       password_hash: passwordHash,
                       cnpj_data: null, // Sem dados de CNPJ por enquanto
                   };

                   // Só adicionar CPD se não for múltiplos CPDs
                   if (!userData.hasMultipleCpds && userData.cpd) {
                       userInsertData.cpd = userData.cpd;
                   }

                   const { data: newUser, error: userError } = await supabase
                       .from('users')
                       .insert(userInsertData)
                       .select('id, name, phone, email, cnpj, cpd, has_multiple_cpds')
                       .single();

            if (userError) {
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

            return { success: true, message: 'Conta criada com sucesso! Faça login para continuar.' };
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
