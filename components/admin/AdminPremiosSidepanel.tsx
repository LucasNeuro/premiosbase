import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Image as ImageIcon, Package, Save, AlertCircle } from 'lucide-react';
import ImageOptimizationService from '../../services/imageOptimizationService';
import AIDescriptionField from '../ui/AIDescriptionField';
import SearchableCategoryDropdown from './SearchableCategoryDropdown';
import SearchableTipoDropdown from './SearchableTipoDropdown';
import { currencyMask, unmaskCurrency } from '../../utils/masks';

interface Premio {
    id: string;
    nome: string;
    descricao: string;
    tipo_id: string;
    categoria_id: string;
    valor_estimado: number;
    imagem_url?: string;
    imagem_miniatura_url?: string;
    is_ativo: boolean;
    created_at: string;
    updated_at: string;
}

interface AdminPremiosSidepanelProps {
    premio?: Premio | null;
    onClose: () => void;
    onSave: () => void;
}

const AdminPremiosSidepanel: React.FC<AdminPremiosSidepanelProps> = ({
    premio,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        nome: premio?.nome || '',
        descricao: premio?.descricao || '',
        tipo_id: premio?.tipo_id || '',
        categoria_id: premio?.categoria_id || '',
        valor_estimado: premio?.valor_estimado || 0,
        is_ativo: premio?.is_ativo ?? true
    });

    const [valorMasked, setValorMasked] = useState(
        premio?.valor_estimado ? currencyMask(premio.valor_estimado.toString()) : 'R$ 0,00'
    );

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [optimizationInfo, setOptimizationInfo] = useState<{
        originalSize: string;
        optimizedSize: string;
        thumbnailSize: string;
    } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(premio?.imagem_url || null);
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(premio?.imagem_miniatura_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                   type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maskedValue = currencyMask(e.target.value);
        setValorMasked(maskedValue);
        const numericValue = unmaskCurrency(maskedValue);
        setFormData(prev => ({
            ...prev,
            valor_estimado: numericValue
        }));
    };

    const handleCategorySelect = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categoria_id: categoryId
        }));
    };

    const handleNewCategory = (category: any) => {
        setFormData(prev => ({
            ...prev,
            categoria_id: category.id
        }));
    };

    const handleTipoSelect = (tipoId: string) => {
        setFormData(prev => ({
            ...prev,
            tipo_id: tipoId
        }));
    };

    const handleNewTipo = (tipo: any) => {
        setFormData(prev => ({
            ...prev,
            tipo_id: tipo.id
        }));
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            setUploadError('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        // Validar tamanho (máximo 10MB para permitir otimização)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('A imagem deve ter no máximo 10MB.');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            console.log('🖼️ Iniciando otimização de imagem...');
            
            // Otimizar imagem principal (1200x1200, qualidade 90%)
            const optimizedImage = await ImageOptimizationService.optimizeImage(file, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.9,
                format: 'jpeg'
            });

            // Criar miniatura otimizada (300x300, qualidade 80%)
            const thumbnailImage = await ImageOptimizationService.createThumbnail(file, 300);

            const originalSize = `${(file.size / 1024 / 1024).toFixed(2)}MB`;
            const optimizedSize = `${(optimizedImage.size / 1024 / 1024).toFixed(2)}MB`;
            const thumbnailSize = `${(thumbnailImage.size / 1024 / 1024).toFixed(2)}MB`;

            console.log('✅ Imagens otimizadas:', {
                original: originalSize,
                optimized: optimizedSize,
                thumbnail: thumbnailSize
            });

            // Mostrar informações de otimização
            setOptimizationInfo({
                originalSize,
                optimizedSize,
                thumbnailSize
            });

            // Gerar nomes únicos
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2);
            
            const mainFileName = `premio_${timestamp}_${randomId}.jpg`;
            const thumbnailFileName = `thumb_${timestamp}_${randomId}.jpg`;
            
            const mainPath = `premios/${mainFileName}`;
            const thumbnailPath = `premios/thumbnails/${thumbnailFileName}`;

            // Upload da imagem principal otimizada
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('premios-img')
                .upload(mainPath, optimizedImage);

            if (uploadError) {
                throw new Error(`Erro no upload: ${uploadError.message} (Código: ${uploadError.statusCode})`);
            }

            // Upload da miniatura otimizada
            const { error: thumbnailError } = await supabase.storage
                .from('premios-img')
                .upload(thumbnailPath, thumbnailImage);

            if (thumbnailError) {
                console.warn('⚠️ Erro ao fazer upload da miniatura:', thumbnailError);
            }

            // Obter URLs públicas
            const { data: { publicUrl } } = supabase.storage
                .from('premios-img')
                .getPublicUrl(mainPath);

            const { data: { publicUrl: thumbnailUrl } } = supabase.storage
                .from('premios-img')
                .getPublicUrl(thumbnailPath);

            setPreviewImage(publicUrl);
            setPreviewThumbnail(thumbnailUrl);
            setUploadError(null);
            
            console.log('🎉 Upload concluído com sucesso!');
        } catch (error: any) {
            console.error('❌ Erro no upload:', error);
            setUploadError(error.message || 'Erro ao fazer upload da imagem.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (!formData.nome.trim()) {
            alert('Nome é obrigatório');
            return;
        }

        if (!formData.tipo_id) {
            alert('Tipo é obrigatório');
            return;
        }

        if (!formData.categoria_id) {
            alert('Categoria é obrigatória');
            return;
        }

        try {
            // Filtrar apenas campos válidos (não vazios)
            const premioData: any = {
                nome: formData.nome,
                descricao: formData.descricao,
                valor_estimado: formData.valor_estimado,
                is_ativo: formData.is_ativo
            };

            // Só adicionar IDs se não estiverem vazios
            if (formData.tipo_id && formData.tipo_id.trim() !== '') {
                premioData.tipo_id = formData.tipo_id;
            }

            if (formData.categoria_id && formData.categoria_id.trim() !== '') {
                premioData.categoria_id = formData.categoria_id;
            }

            // Só adicionar URLs se existirem
            if (previewImage) {
                premioData.imagem_url = previewImage;
            }

            if (previewThumbnail) {
                premioData.imagem_miniatura_url = previewThumbnail;
            }

            if (premio) {
                // Atualizar prêmio existente
                const { error } = await supabase
                    .from('premios')
                    .update(premioData)
                    .eq('id', premio.id);

                if (error) {
                    alert('Erro ao atualizar prêmio: ' + error.message);
                    return;
                }
            } else {
                // Criar novo prêmio
                const { error } = await supabase
                    .from('premios')
                    .insert([premioData]);

                if (error) {
                    alert('Erro ao criar prêmio: ' + error.message);
                    return;
                }
            }

            onSave();
            onClose();
        } catch (error: any) {
            alert('Erro inesperado: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {premio ? 'Editar Prêmio' : 'Novo Prêmio'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Upload de Imagem */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagem do Prêmio
                        </label>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            {previewImage ? (
                                <div className="space-y-4">
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                                    />
                                    <p className="text-sm text-gray-600">
                                        Clique ou arraste uma nova imagem para alterar
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                    <p className="text-sm text-gray-600">
                                        Clique ou arraste uma imagem aqui
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG até 5MB
                                    </p>
                                </div>
                            )}
                            
                            {uploading && (
                                <div className="mt-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
                                    <p className="text-sm text-gray-600 mt-2">Fazendo upload...</p>
                                </div>
                            )}
                        </div>
                        
                        {uploadError && (
                            <div className="mt-2 flex items-center space-x-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{uploadError}</span>
                            </div>
                        )}

                        {optimizationInfo && (
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="text-sm text-green-800">
                                    <div className="font-semibold mb-2">✅ Imagem Otimizada Automaticamente</div>
                                    <div className="space-y-1">
                                        <div>📸 Original: {optimizationInfo.originalSize}</div>
                                        <div>🖼️ Otimizada: {optimizationInfo.optimizedSize}</div>
                                        <div>🔍 Miniatura: {optimizationInfo.thumbnailSize}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Prêmio *
                        </label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: iPhone 15 Pro"
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                        </label>
                        <AIDescriptionField
                            value={formData.descricao}
                            onChange={(value) => setFormData(prev => ({ ...prev, descricao: value }))}
                            goalType="premio"
                            goalTitle={formData.nome}
                            target={formData.valor_estimado}
                            period={formData.tipo_id}
                            placeholder="Descreva o prêmio em detalhes..."
                            rows={3}
                        />
                    </div>

                    {/* Tipo com Busca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo *
                        </label>
                        <SearchableTipoDropdown
                            selectedTipoId={formData.tipo_id}
                            onTipoSelect={handleTipoSelect}
                            onNewTipo={handleNewTipo}
                        />
                    </div>

                    {/* Categoria com Busca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria *
                        </label>
                        <SearchableCategoryDropdown
                            selectedCategoryId={formData.categoria_id}
                            onCategorySelect={handleCategorySelect}
                            onNewCategory={handleNewCategory}
                        />
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Estimado (R$)
                        </label>
                        <input
                            type="text"
                            value={valorMasked}
                            onChange={handleValorChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="R$ 0,00"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_ativo"
                            checked={formData.is_ativo}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            Prêmio ativo
                        </label>
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{premio ? 'Atualizar' : 'Salvar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPremiosSidepanel;
