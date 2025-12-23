import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            if (!id) return;

            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_images (image_url)
                `)
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const formatted = {
                    ...data,
                    images: data.product_images ? data.product_images.map(img => img.image_url) : []
                };
                setProduct(formatted);
                if (formatted.images.length > 0) setSelectedImage(formatted.images[0]);
            }
        } catch (err) {
            console.error("Fetch Details Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center h-[50vh] items-center bg-primary text-gold-metallic"><Loader2 className="animate-spin w-10 h-10" /></div>;
    if (!product) return <div className="text-center py-20 text-xl text-beige-dark bg-primary h-screen flex items-center justify-center">Produto não encontrado.</div>;

    return (
        <div className="bg-primary min-h-screen pt-24 pb-20">
            <div className="max-w-6xl mx-auto px-4 animate-fade-in-up">

                <Link to="/" className="inline-flex items-center text-beige-dark hover:text-gold-metallic mb-12 transition-colors group tracking-widest text-sm uppercase font-bold">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar para a coleção
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                    {/* Gallery */}
                    <div className="space-y-6">
                        <div className="aspect-[4/5] bg-secondary rounded-sm overflow-hidden border border-white/5 relative group">
                            <img
                                src={selectedImage || 'https://via.placeholder.com/600x800?text=Zivbijus'}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`relative w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border transition-all duration-300 ${selectedImage === img ? 'border-gold-metallic opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center text-left">
                        <h1 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight italic">{product.name}</h1>
                        <p className="text-3xl font-display text-gold-metallic mb-10 tracking-wider">R$ {Number(product.price).toFixed(2)}</p>

                        <div className="prose prose-lg text-beige-dark mb-12 leading-relaxed font-light border-l border-gold-metallic/30 pl-6">
                            <p className="m-0">{product.description}</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => addToCart(product)}
                                className="flex-1 btn-primary text-base py-4 flex items-center justify-center gap-3 group"
                            >
                                <ShoppingBag className="w-5 h-5 group-hover:text-black transition-colors" /> Adicionar à Sacola
                            </button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <span className="block text-gold-metallic mb-1 text-lg">✦</span>
                                <p className="text-xs text-beige-dark uppercase tracking-widest">Feito a Mão</p>
                            </div>
                            <div>
                                <span className="block text-gold-metallic mb-1 text-lg">✦</span>
                                <p className="text-xs text-beige-dark uppercase tracking-widest">Pensado em cada detalhe</p>
                            </div>
                            <div>
                                <span className="block text-gold-metallic mb-1 text-lg">✦</span>
                                <p className="text-xs text-beige-dark uppercase tracking-widest">Envio Seguro</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
