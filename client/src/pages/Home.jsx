import { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Loader2, ArrowRight } from 'lucide-react';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Todos');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/products?publicOnly=true');
            setProducts(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on active category
    const filteredProducts = activeCategory === 'Todos'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="bg-primary min-h-screen">

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Visuals */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-primary to-primary z-0"></div>
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe635d77?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed mix-blend-overlay"></div>

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center animate-fade-in-up">
                    <div className="mb-12">
                        <img src="/logo.png" alt="Ziv Bijus" className="h-40 md:h-56 lg:h-64 w-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.4)] opacity-100" />
                    </div>

                    <p className="text-gold-metallic font-display tracking-[0.5em] uppercase text-sm md:text-lg mb-16 opacity-90">Artesanal &bull; Exclusivo &bull; Atemporal</p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        <a href="#collection" className="btn-primary min-w-[220px] text-center group py-5 text-sm tracking-[0.25em] border-gold-metallic/50 hover:border-gold-metallic">
                            Ver Coleção <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
                    <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-gold-metallic to-transparent"></div>
                </div>
            </section>

            {/* Categories Filter (Visual Only for now) */}
            <section className="py-20 border-b border-white/5">
                <div className="container mx-auto px-4 flex justify-center gap-8 md:gap-16">
                    {['Todos', 'Pulseiras', 'Colares'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`group relative px-8 py-4 overflow-hidden transition-all ${activeCategory === cat ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                            <span className={`relative z-10 font-serif text-2xl md:text-3xl transition-colors italic ${activeCategory === cat ? 'text-white' : 'text-beige-dark'}`}>{cat}</span>
                            <div className={`absolute bottom-0 left-0 w-full h-[1px] transition-colors ${activeCategory === cat ? 'bg-gold-metallic' : 'bg-white/10 group-hover:bg-gold-metallic'}`}></div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Collection Grid */}
            <section id="collection" className="py-24 container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Últimos Lançamentos</h2>
                    <div className="w-12 h-[1px] bg-gold-metallic mx-auto"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-metallic w-8 h-8" /></div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                        <p className="text-beige-dark font-display">Nenhuma peça {activeCategory !== 'Todos' ? `da categoria ${activeCategory}` : ''} encontrada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                )}
            </section>

            {/* About Section */}
            <section className="py-24 bg-secondary relative overflow-hidden">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="md:w-1/2 space-y-8">
                        <div className="space-y-2">
                            <p className="text-gold-metallic font-display tracking-[0.2em] text-sm uppercase">Sobre Nós</p>
                            <h2 className="text-4xl md:text-5xl font-serif italic text-white leading-tight">
                                A elegância do feito à mão
                            </h2>
                        </div>

                        <div className="w-16 h-[2px] bg-gold-metallic"></div>

                        <p className="text-2xl md:text-3xl font-serif text-white/90 italic tracking-tight">
                            <span className="text-gold-metallic">Ziv</span> (זִיו) = Luz
                        </p>

                        <p className="text-beige text-lg font-light leading-relaxed">
                            Bijus feitas à mão. A luz em cada detalhe revelando sua essência. Cada peça da Ziv Bijus é criada com um propósito: iluminar. Utilizamos materiais selecionados e técnicas artesanais para criar joias que não apenas adornam, mas contam uma história.
                        </p>
                        <p className="text-beige-dark font-light leading-relaxed">
                            Do desenho inicial ao acabamento final, dedicamos tempo e alma para garantir que você receba não apenas um acessório, mas uma obra de arte usável.
                        </p>
                    </div>
                    <div className="md:w-1/2 relative">
                        <div className="aspect-square bg-white/5 p-4 rounded-full border border-white/10 animate-spin-slow">
                            {/* Decorative Circle */}
                        </div>
                        <img
                            src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop"
                            className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl opacity-80 mix-blend-overlay"
                            alt="Artesanal"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
