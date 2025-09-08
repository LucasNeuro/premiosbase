
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
           register: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; message: string }>;
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
                console.log('Saved user from localStorage:', savedUser);
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    console.log('Parsed user data:', userData);
                    setUser(userData);
                } else {
                    console.log('No user found in localStorage');
                }
            } catch (error) {
                console.error('Error checking user session:', error);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);
    
    const login = async (email: string, password: string) => {
        try {
            console.log('Iniciando login para:', email);
            
            // Buscar usuário na nossa tabela personalizada
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (userError || !userData) {
                console.error('Usuário não encontrado:', userError);
                return { success: false, message: 'Email ou senha incorretos.' };
            }

            // Verificar senha
            const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
            if (!isPasswordValid) {
                return { success: false, message: 'Email ou senha incorretos.' };
            }

            console.log('Login bem-sucedido:', userData.id);
            
            const userObj = {
                id: userData.id,
                name: userData.name,
                phone: userData.phone,
                email: userData.email,
                cnpj: userData.cnpj,
                cpd: userData.cpd,
            };

            // Salvar no localStorage
            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);
            
            return { success: true, message: 'Login realizado com sucesso!' };
        } catch (error) {
            console.error('Erro geral no login:', error);
            return { success: false, message: 'Erro interno do servidor.' };
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('user');
            setUser(null);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

           const register = async (userData: Omit<User, 'id'> & { password: string }) => {
        try {
            console.log('Iniciando cadastro de usuário:', userData);
            
            // Check if user already exists
            const { data: existingUsers, error: checkError } = await supabase
                .from('users')
                .select('email, cnpj, cpd')
                .or(`email.eq.${userData.email},cnpj.eq.${userData.cnpj},cpd.eq.${userData.cpd}`);

            if (checkError) {
                console.error('Erro ao verificar usuário existente:', checkError);
                // Continue com o cadastro mesmo se houver erro na verificação
            } else if (existingUsers && existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                if (existingUser.email === userData.email) {
                    return { success: false, message: 'Email já cadastrado.' };
                }
                if (existingUser.cnpj === userData.cnpj) {
                    return { success: false, message: 'CNPJ já cadastrado.' };
                }
                if (existingUser.cpd === userData.cpd) {
                    return { success: false, message: 'CPD já cadastrado.' };
                }
            }

            console.log('Criando usuário na nossa tabela personalizada...');
            
            // Hash da senha
            const passwordHash = await bcrypt.hash(userData.password, 10);
            
                   // Create user record in our custom users table
                   const { data: newUser, error: userError } = await supabase
                       .from('users')
                       .insert({
                           name: userData.name,
                           phone: userData.phone,
                           email: userData.email,
                           cnpj: userData.cnpj,
                           cpd: userData.cpd,
                           password_hash: passwordHash,
                           cnpj_data: null, // Sem dados de CNPJ por enquanto
                       })
                       .select('id, name, phone, email, cnpj, cpd')
                       .single();

            if (userError) {
                console.error('Erro ao criar usuário:', userError);
                return { success: false, message: `Erro ao criar usuário: ${userError.message}` };
            }

            console.log('Usuário criado com sucesso!', newUser.id);
            return { success: true, message: 'Conta criada com sucesso! Faça login para continuar.' };
        } catch (error) {
            console.error('Erro geral no cadastro:', error);
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
