// src/Login.jsx
import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router';

export default function Login({ onLoginSucesso }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/")
    } catch (err) {
      console.error(err);
      setErro('Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ color: '#1a365d', textAlign: 'center', marginBottom: '20px' }}>Área do Personal Trainer</h2>
      
      {erro && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem' }}>{erro}</div>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '5px' }}>E-mail:</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>

        <div>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '5px' }}>Senha:</label>
          <input 
            type="password" 
            value={senha} 
            onChange={e => setSenha(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>

        <button type="submit" disabled={loading} style={{ background: '#3182ce', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
          {loading ? 'Entrando...' : 'Entrar no Sistema'}
        </button>
      </form>
    </div>
  );
}