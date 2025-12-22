import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShoppingBag, LogOut } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isHome ? 'bg-primary/80 backdrop-blur-md border-b border-white/5' : 'bg-primary border-b border-white/10'}`}>
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">

                {/* Left: Mobile Menu (Hidden for now, keeping simple) or Socials */}
                <div className="hidden md:flex gap-4 text-sm text-beige-dark font-display">
                    <a href="#" className="hover:text-gold-metallic transition-colors">Instagram</a>
                </div>

                {/* Center: Logo */}
                <Link to="/" className="absolute left-1/2 -translate-x-1/2 group">
                    <div className="flex flex-col items-center">
                        {/* Using text fallback if image fails, or image with fallback */}
                        <img src="/logo.png" alt="Ziv Bijus" className="h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                    </div>
                </Link>

                {/* Right: Actions */}
                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <Link to="/admin" className="text-beige-dark hover:text-gold-metallic font-sans text-sm tracking-wide transition-colors">PAINEL</Link>
                            <button onClick={logout} className="text-beige-dark hover:text-red-400 transition-colors" title="Sair">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="text-beige-dark hover:text-gold-metallic transition-colors" title="Login Admin">
                            <User className="w-5 h-5" />
                        </Link>
                    )}
                    <button className="relative text-beige-dark hover:text-gold-metallic transition-colors group">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-gold-metallic text-secondary text-[10px] font-bold flex items-center justify-center rounded-full group-hover:bg-white transition-colors">0</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
