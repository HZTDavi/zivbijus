import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
    const mainImage = product.images?.[0] || 'https://via.placeholder.com/400x400?text=Zivbijus';

    return (
        <Link to={`/product/${product.id}`} className="group block bg-secondary border border-white/5 overflow-hidden transition-all duration-500 hover:border-gold-metallic/30">
            <div className="aspect-[4/5] w-full overflow-hidden relative">
                <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:opacity-90"
                    loading="lazy"
                />
                {/* Quick Add Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <span className="bg-primary/90 text-gold-metallic backdrop-blur px-6 py-2 text-xs uppercase tracking-widest border border-gold-metallic/20">Ver Detalhes</span>
                </div>
            </div>
            <div className="p-5 text-center">
                <h3 className="text-lg font-serif italic text-beige group-hover:text-gold-metallic transition-colors duration-300">{product.name}</h3>
                <p className="text-gold-metallic mt-2 font-display text-sm tracking-widest">R$ {Number(product.price).toFixed(2)}</p>
            </div>
        </Link>
    );
}
