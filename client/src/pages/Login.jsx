import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Credenciais inválidas. Verifique usuário e senha.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Lock className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Área Restrita</h2>
                <p className="text-gray-500 mt-2">Acesso apenas para administradores.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuário</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-gray-400 text-black bg-white"
                        placeholder="Digite seu usuário"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-gray-400 text-black bg-white"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-lg transition-all hover:shadow-lg active:scale-[0.99]">
                    Entrar no Sistema
                </button>
            </form>
        </div>
    );
}
