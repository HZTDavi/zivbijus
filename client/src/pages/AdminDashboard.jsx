import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, X, Package, DollarSign, Image, Save, Upload, Eye, EyeOff } from 'lucide-react';
// import { API_URL } from '../config'; (Removed)

export default function AdminDashboard() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);

    // Form State
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    // Image State (Files & Previews)
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        // Cleanup URLs to avoid memory leaks
        return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
    }, [previewUrls]);

    const fetchProducts = async () => {
        try {
            // Select logic same as Home but without filter
            const { data, error } = await supabase
                .from('products')
                .select(`*, product_images(image_url)`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map(p => ({
                ...p,
                images: p.product_images ? p.product_images.map(img => img.image_url) : []
            }));
            setProducts(formatted || []);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    // Drag & Drop Handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files) => {
        // Convert FileList to Array
        const newFiles = Array.from(files);

        // Add to existing files
        setSelectedFiles(prev => [...prev, ...newFiles]);

        // Generate previews
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);

        const newPreviews = [...previewUrls];
        URL.revokeObjectURL(newPreviews[index]); // Free memory
        newPreviews.splice(index, 1);
        setPreviewUrls(newPreviews);
    };

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to 'product-images' bucket
        // If bucket doesn't exist, this fails. We assume it exists (Standard: 'product-images' public bucket)
        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!user) return;

            // 1. Insert Product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .insert([
                    {
                        name,
                        price,
                        description,
                        category,
                        is_visible: isVisible ? 1 : 0
                    }
                ])
                .select()
                .single();

            if (productError) throw productError;

            const productId = productData.id;

            // 2. Upload Images and Insert Records
            if (selectedFiles.length > 0) {
                const uploadedUrls = [];
                for (const file of selectedFiles) {
                    try {
                        const url = await uploadImage(file);
                        uploadedUrls.push({ product_id: productId, image_url: url });
                    } catch (uplErr) {
                        console.error("Failed to upload one image", uplErr);
                    }
                }

                if (uploadedUrls.length > 0) {
                    const { error: imgError } = await supabase
                        .from('product_images')
                        .insert(uploadedUrls);

                    if (imgError) console.error("Error inserting image records:", imgError);
                }
            }

            // Clear form
            setName('');
            setPrice('');
            setDescription('');
            setCategory('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            setIsVisible(true);
            fetchProducts();
            alert('Produto adicionado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao adicionar produto: ' + err.message);
        }
    };

    const toggleVisibility = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_visible: !currentStatus ? 1 : 0 })
                .eq('id', id);

            if (error) throw error;
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert('Erro ao alterar visibilidade');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza absoluta que deseja excluir este produto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Produto excluído com sucesso.');
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error("Error deleting:", err);
            alert(`Erro ao deletar produto: ${err.message}`);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 pt-10">
            <header className="mb-8 border-b border-white/5 pb-8">
                <h1 className="text-3xl font-serif italic text-white mb-2">Painel Administrativo</h1>
                <p className="text-beige-dark font-light">Gerencie seus produtos e o estoque da loja.</p>
            </header>

            <div className="bg-secondary p-8 rounded-sm shadow-2xl border border-white/5">
                <h2 className="text-xl font-display text-gold-metallic mb-8 flex items-center gap-2 pb-4 border-b border-white/10 uppercase tracking-widest text-sm">
                    <Plus className="w-5 h-5" /> Adicionar Novo Produto
                </h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-beige-dark uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-4 h-4 text-gold-metallic" /> Nome do Produto
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-primary border border-white/10 rounded-sm text-white focus:border-gold-metallic focus:ring-1 focus:ring-gold-metallic/50 outline-none transition-all placeholder-white/20"
                                placeholder="Ex: Colar de Pérolas..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-beige-dark uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gold-metallic" /> Preço (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-full px-4 py-3 bg-primary border border-white/10 rounded-sm text-white focus:border-gold-metallic focus:ring-1 focus:ring-gold-metallic/50 outline-none transition-all placeholder-white/20"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-beige-dark uppercase tracking-widest">Categoria</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-primary border border-white/10 rounded-sm text-white focus:border-gold-metallic focus:ring-1 focus:ring-gold-metallic/50 outline-none transition-all appearance-none"
                        >
                            <option value="" className="text-gray-500">Selecione uma categoria...</option>
                            <option value="Colares">Colares</option>
                            <option value="Pulseiras">Pulseiras</option>
                            <option value="Aneis">Anéis</option>
                            <option value="Brincos">Brincos</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-beige-dark uppercase tracking-widest">Descrição Detalhada</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-primary border border-white/10 rounded-sm h-32 text-white focus:border-gold-metallic focus:ring-1 focus:ring-gold-metallic/50 outline-none transition-all resize-none placeholder-white/20"
                            placeholder="Descreva os materiais, tamanho e detalhes do produto..."
                        ></textarea>
                    </div>

                    {/* Nova Área de Upload Drag & Drop */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-beige-dark uppercase tracking-widest flex items-center gap-2">
                            <Image className="w-4 h-4 text-gold-metallic" /> Imagens do Produto
                        </label>

                        <div
                            className={`border-2 border-dashed rounded-sm p-8 text-center transition-all ${dragActive ? 'border-gold-metallic bg-gold-metallic/5' : 'border-white/10 hover:border-gold-metallic/50'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleChange}
                                accept="image/*"
                            />
                            <div className="flex flex-col items-center gap-3 cursor-pointer">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center border border-white/5">
                                    <Upload className={`w-6 h-6 ${dragActive ? 'text-gold-metallic' : 'text-beige-dark'}`} />
                                </div>
                                <p className="text-beige font-medium">
                                    Arraste imagens aqui ou <span className="text-gold-metallic hover:underline">clique para selecionar</span>
                                </p>
                                <p className="text-xs text-beige-dark/50">PNG, JPG até 5MB</p>
                            </div>
                        </div>

                        {/* Galeria de Preview */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 mt-4 animate-fadeIn">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="group relative aspect-square bg-primary rounded-sm overflow-hidden border border-white/10">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm backdrop-blur"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        {/* Visibility Toggle Switch */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsVisible(!isVisible)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-1 ring-white/10 ${isVisible ? 'bg-green-500/20' : 'bg-primary'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${isVisible ? 'translate-x-6 bg-green-500' : 'translate-x-1 bg-white/20'}`} />
                            </button>
                            <span className={`text-sm font-medium ${isVisible ? 'text-green-500' : 'text-beige-dark'}`}>
                                {isVisible ? 'Produto Visível na Loja' : 'Produto Oculto (Rascunho)'}
                            </span>
                        </div>

                        <button type="submit" className="btn-primary flex items-center gap-2 px-6 py-3 min-w-[180px] justify-center">
                            <Save className="w-4 h-4" /> Salvar Produto
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-display text-white mb-6 uppercase tracking-widest border-l-2 border-gold-metallic pl-4">Inventário Atual ({products.length})</h2>
                <div className="bg-secondary rounded-sm shadow-sm border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-primary/50 text-beige-dark text-xs uppercase tracking-wider border-b border-white/5">
                            <tr>
                                <th className="p-6 font-semibold">Produto</th>
                                <th className="p-6 font-semibold">Preço</th>
                                <th className="p-6 font-semibold text-center">Status</th>
                                <th className="p-6 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map(product => (
                                <tr key={product.id} className="hover:bg-primary/30 transition-colors">
                                    <td className="p-6 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-primary rounded-sm overflow-hidden flex-shrink-0 border border-white/5">
                                            {product.images?.[0] && <img src={product.images[0]} className="w-full h-full object-cover" alt="" />}
                                        </div>
                                        <div>
                                            <span className="font-serif italic text-lg text-white block">{product.name}</span>
                                            <span className="text-sm text-beige-dark/70 truncate max-w-xs block">{product.description}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-gold-metallic font-display tracking-wider">R$ {parseFloat(product.price).toFixed(2)}</td>
                                    <td className="p-6 text-center">
                                        <button
                                            onClick={() => toggleVisibility(product.id, product.is_visible)}
                                            className={`p-2 rounded-full transition-all ${product.is_visible ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                                            title={product.is_visible ? "Visível" : "Oculto"}
                                        >
                                            {product.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button onClick={() => handleDelete(product.id)} className="p-2 text-beige-dark hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-all" title="Excluir">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && <div className="p-12 text-center text-beige-dark/50 italic font-serif">Nenhum produto cadastrado no sistema.</div>}
                </div>
            </div>
        </div>
    );
}
