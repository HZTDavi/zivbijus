import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, ShoppingBag, Send } from 'lucide-react';

export default function CartDrawer() {
    const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const [customerName, setCustomerName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);

    if (!isCartOpen) return null;

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setShowNameInput(true);
    };

    const confirmCheckout = (e) => {
        e.preventDefault();
        if (!customerName.trim()) {
            alert("Por favor, digite seu nome.");
            return;
        }

        // Format items for message
        const itemsList = cart.map(item =>
            `- ${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2)})`
        ).join('\n');

        const message = `Olá, me chamo *${customerName}*.\nGostaria de finalizar meu pedido na Ziv Bijus:\n\n${itemsList}\n\n*Total: R$ ${cartTotal.toFixed(2)}*`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = '555596835478';

        // Open WhatsApp
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');

        // Optional: clear cart after successful checkout or keep it? 
        // Typically keep it in case they come back, but let's close the drawer
        setIsCartOpen(false);
        setCustomerName('');
        setShowNameInput(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-secondary h-full shadow-2xl p-6 flex flex-col border-l border-white/10 animate-fade-in-up">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <h2 className="text-2xl font-serif italic text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gold-metallic" /> Sua Sacola
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-beige-dark hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-grow overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                    {cart.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-beige-dark" />
                            <p className="text-beige font-display">Sua sacola está vazia.</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-4 p-3 bg-primary/50 rounded-sm border border-white/5">
                                <div className="w-20 h-20 bg-primary flex-shrink-0 rounded-sm overflow-hidden">
                                    {item.images && item.images[0] ? (
                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-beige-dark">No img</div>
                                    )}
                                </div>
                                <div className="flex-grow flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-white font-serif text-sm">{item.name}</h3>
                                        <p className="text-gold-metallic font-display text-xs mt-1">R$ {item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-primary rounded-sm border border-white/5 px-2 py-1">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="text-beige-dark hover:text-white"><Minus className="w-3 h-3" /></button>
                                            <span className="text-xs text-white w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="text-beige-dark hover:text-white"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400/70 hover:text-red-400 text-xs underline">Remover</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                {cart.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/5 space-y-6">
                        <div className="flex items-center justify-between text-lg">
                            <span className="text-beige-dark font-display uppercase tracking-widest text-sm">Total</span>
                            <span className="text-gold-metallic font-serif italic text-2xl">R$ {cartTotal.toFixed(2)}</span>
                        </div>

                        {!showNameInput ? (
                            <button
                                onClick={handleCheckout}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 group"
                            >
                                Finalizar Pedido <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <form onSubmit={confirmCheckout} className="space-y-4 animate-fade-in">
                                <div className="bg-primary/50 p-4 rounded-sm border border-gold-metallic/20">
                                    <label className="block text-xs uppercase tracking-widest text-gold-metallic mb-2">Qual seu nome?</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full bg-primary border-b border-white/10 px-0 py-2 text-white outline-none focus:border-gold-metallic placeholder-white/20"
                                        placeholder="Digite seu nome..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-display tracking-widest uppercase text-sm py-4 rounded-sm transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                                >
                                    Enviar para WhatsApp <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-4 h-4 invert" alt="" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNameInput(false)}
                                    className="w-full text-center text-xs text-beige-dark/50 hover:text-white mt-2"
                                >
                                    Cancelar
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
