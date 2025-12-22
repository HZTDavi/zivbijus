import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();
    const mainImage = product.images?.[0] || 'https://via.placeholder.com/400x400?text=Zivbijus';

    const handleQuickAdd = (e) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation();
        addToCart(product);
    };

    return (
        <Link to={`/product/${product.id}`} className="group block bg-secondary border border-white/5 overflow-hidden transition-all duration-500 hover:border-gold-metallic/30 relative">
            <div className="aspect-[4/5] w-full overflow-hidden relative">
                <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-90"
                    loading="lazy"
                />
                {/* Quick Add Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <button
                        onClick={handleQuickAdd}
                        className="bg-primary/90 hover:bg-gold-metallic hover:text-secondary text-gold-metallic backdrop-blur px-6 py-2 text-xs uppercase tracking-widest border border-gold-metallic/20 flex items-center gap-2 transition-all"
                    >
                        <ShoppingBag className="w-3 h-3" /> Adicionar
                    </button>
                </div>
            </div>
            <div className="p-5 text-center">
                <h3 className="text-lg font-serif italic text-beige group-hover:text-gold-metallic transition-colors duration-300">{product.name}</h3>
                <p className="text-gold-metallic mt-2 font-display text-sm tracking-widest">R$ {Number(product.price).toFixed(2)}</p>
            </div>
        </Link>
    );
}
