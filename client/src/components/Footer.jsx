import { Instagram } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-secondary/50 border-t border-white/5 pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Logo */}
                    <div className="mb-4">
                        <img src="/logo.png" alt="Ziv Bijus" className="h-24 w-auto object-contain opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
                    </div>

                    {/* Links */}
                    <div className="flex gap-8 text-sm tracking-widest uppercase text-beige-dark font-display">
                        <a href="#" className="hover:text-gold-metallic transition-colors">Início</a>
                        <a href="#collection" className="hover:text-gold-metallic transition-colors">Coleção</a>
                        <a href="https://www.instagram.com/zivbijus/?igsh=YWJ4cmYwZjNnYWxw" target="_blank" rel="noopener noreferrer" className="hover:text-gold-metallic transition-colors">Instagram</a>
                    </div>

                    <div className="w-12 h-[1px] bg-white/10"></div>

                    {/* Copy */}
                    <p className="text-beige-dark/40 text-xs font-light">
                        © {new Date().getFullYear()} Ziv Bijus. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
