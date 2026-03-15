import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/auth';
import './auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Criar conta</h1>
        <p className="auth-subtitle">Comece agora gratuitamente</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Nome</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
