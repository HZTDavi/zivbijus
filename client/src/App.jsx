import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-primary text-beige">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
      <footer className="bg-primary border-t border-white/5 text-beige-dark/50 text-center py-8 text-sm uppercase tracking-widest font-display">
        <p>&copy; {new Date().getFullYear()} Zivbijus. Design Premium & Exclusivo.</p>
      </footer>
    </div>
  );
}

export default App;
