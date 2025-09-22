import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
    id: string;
    email: string;
    name: string;
}

interface CategoryPreviewProps {
    categoryId: string | null;
    isVisible: boolean;
}

const CategoryPreview: React.FC<CategoryPreviewProps> = ({ categoryId, isVisible }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (categoryId && isVisible) {
            fetchUsersInCategory();
        }
    }, [categoryId, isVisible]);

    const fetchUsersInCategory = async () => {
        if (!categoryId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    corretores_categorias!inner(
                        categoria_id,
                        categorias_corretores!inner(
                            id,
                            nome
                        )
                    )
                `)
                .eq('corretores_categorias.categoria_id', categoryId);

            if (error) throw error;
            
            setUsers(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible || !categoryId) return null;

    return (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">
                    Corretores que receberão esta campanha
                </h3>
            </div>
            
            {loading && (
                <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Carregando corretores...</span>
                </div>
            )}
            
            {error && (
                <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Erro ao carregar corretores: {error}</span>
                </div>
            )}
            
            {!loading && !error && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                            {users.length} corretor(es) encontrado(s)
                        </span>
                    </div>
                    
                    {users.length > 0 ? (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-blue-600">
                                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.name || 'Nome não informado'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">
                            Nenhum corretor encontrado nesta categoria.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CategoryPreview;
