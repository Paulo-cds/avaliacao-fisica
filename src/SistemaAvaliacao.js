import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import FormularioAvaliacao from "./FormularioAvaliacao";
import { Link } from "react-router-dom";
import { formatarDataBr } from "./index";

export default function SistemaAvaliacao() {
  const [aba, setAba] = useState("clientes");
  const [clientes, setClientes] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([]);
  const [ordemHistorico, setOrdemHistorico] = useState("desc");

  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    sexo: "M",
    dataNasc: "",
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    const querySnapshot = await getDocs(collection(db, "clientes"));
    const lista = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setClientes(lista);
  };

  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "clientes"), {
        ...novoCliente,
        criadoEm: serverTimestamp(),
      });
      alert("Cliente cadastrado com sucesso!");
      setNovoCliente({ nome: "", sexo: "M", dataNasc: "" });
      carregarClientes();
      setAba("clientes");
    } catch (error) {
      console.error("Erro ao cadastrar cliente: ", error);
    }
  };

  const carregarHistorico = async (clienteId) => {
    const q = query(
      collection(db, "avaliacoes"),
      where("clienteId", "==", clienteId)
    );
    const querySnapshot = await getDocs(q);
    const lista = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    setHistoricoAvaliacoes(lista);
    setAba("detalhesAluno");
  };

  const historicoOrdenado = [...historicoAvaliacoes].sort((a, b) => {
    const dataA = new Date(a.dataAval);
    const dataB = new Date(b.dataAval);
    return ordemHistorico === 'asc' ? dataA - dataB : dataB - dataA;
  });

  return (
    <div style={{ maxWidth: "100%", width: "100%", boxSizing: "border-box", margin: "0 auto", fontFamily: "Segoe UI, sans-serif", padding: "10px" }}>
      <h1 style={{ fontSize: "1.5rem", color: "#1a365d", textAlign: "center", marginBottom: "15px" }}>Painel de Avaliação Física</h1>

      {/* Navegação Topo */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", justifyContent: "center" }}>
        <button onClick={() => setAba("clientes")} style={btnStyle(aba === "clientes")}>
          Meus Clientes
        </button>
        <button onClick={() => setAba("novoCliente")} style={btnStyle(aba === "novoCliente")}>
          + Cadastrar Aluno
        </button>
      </div>

      {/* ABA: LISTA DE CLIENTES */}
      {aba === "clientes" && (
        <div>
          <h2 style={{ fontSize: "1.2rem", color: "#2d3748" }}>Lista de Alunos</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {clientes.map((c) => (
              <li key={c.id} style={{ display: "flex", flexDirection: "column", sm: { flexDirection: "row" }, justifyContent: "space-between", gap: "10px", padding: "12px", background: "#fff", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <div>
                  <strong style={{ fontSize: "1.05rem", color: "#2b6cb0" }}>{c.nome}</strong> 
                  <span style={{ color: "#666", fontSize: "0.9rem", display: "block" }}>Sexo: {c.sexo} | Nasc: {formatarDataBr(c.dataNasc)}</span>
                </div>
                <button onClick={() => { setAlunoSelecionado(c); carregarHistorico(c.id); }} style={{ background: "#3182ce", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", width: "100%" }}>
                  Ver Histórico / Avaliar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ABA: CADASTRAR NOVO CLIENTE */}
      {aba === "novoCliente" && (
        <form onSubmit={handleSalvarCliente} style={formStyle}>
          <h2 style={{ fontSize: "1.2rem", color: "#2d3748", marginTop: 0 }}>Novo Aluno</h2>
          <label style={labelStyle}>Nome Completo:</label>
          <input type="text" value={novoCliente.nome} onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })} required style={inputStyle} />

          <label style={labelStyle}>Sexo:</label>
          <select value={novoCliente.sexo} onChange={(e) => setNovoCliente({ ...novoCliente, sexo: e.target.value })} style={inputStyle}>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>

          <label style={labelStyle}>Data de Nascimento:</label>
          <input type="date" value={novoCliente.dataNasc} onChange={(e) => setNovoCliente({ ...novoCliente, dataNasc: e.target.value })} required style={inputStyle} />

          <button type="submit" style={submitBtnStyle}>Salvar Aluno</button>
        </form>
      )}

      {/* ABA: DETALHES E HISTÓRICO DO ALUNO */}
      {aba === "detalhesAluno" && alunoSelecionado && (
        <div>
          <button onClick={() => setAba("clientes")} style={{ marginBottom: "15px", padding: "8px 14px", cursor: "pointer", background: "#edf2f7", border: "1px solid #cbd5e0", borderRadius: "6px", fontWeight: "bold" }}>
            ← Voltar para Clientes
          </button>
          <h2 style={{ fontSize: "1.3rem", color: "#1a365d", wordBreak: "break-word" }}>Aluno: {alunoSelecionado.nome}</h2>

          <div style={{ background: "#edf2f7", padding: "10px", borderRadius: "8px", marginBottom: "20px", boxSizing: "border-box" }}>
            <FormularioAvaliacao alunoSelecionado={alunoSelecionado} onAvaliacaoSalva={() => carregarHistorico(alunoSelecionado.id)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Histórico de Avaliações ({historicoAvaliacoes.length})</h3>

            <button onClick={() => setOrdemHistorico(ordemHistorico === 'asc' ? 'desc' : 'asc')} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', width: "100%" }}>
              {ordemHistorico === 'asc' ? '📅 Mais Antigas Primeiras (Crescente ↑)' : '📅 Mais Recentes Primeiras (Decrescente ↓)'}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#fff", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "8px", gap: "10px" }}>
            <span style={{ fontSize: "0.9rem" }}><strong>Acesso Rápido:</strong> Gráficos e Evolução</span>
            <Link to={`/aluno/${alunoSelecionado.id}/dashboard`} style={{ background: "#3182ce", color: "#fff", padding: "8px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
              Dashboard
            </Link>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {historicoOrdenado.map((av) => (
              <li key={av.id} style={{ padding: "12px", background: "#fff", border: "1px solid #ccc", marginBottom: "8px", borderRadius: "8px", fontSize: "0.9rem", lineHeight: "1.4" }}>
                <div><strong>Data:</strong> {formatarDataBr(av.dataAval)}</div>
                <div><strong>Peso:</strong> {av.peso} kg | <strong>Estatura:</strong> {av.estatura} cm</div>
                <div><strong>% Gordura:</strong> {av.percentualGordura || 'N/A'}% | <strong>VO2max:</strong> {av.vo2Max || 'N/A'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const btnStyle = (active) => ({
  padding: "10px 16px",
  background: active ? "#2b6cb0" : "#e2e8f0",
  color: active ? "#fff" : "#333",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "0.9rem"
});

const formStyle = {
  background: "#fff",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const labelStyle = {
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#4a5568"
};

const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "1rem"
};

const submitBtnStyle = {
  background: "#2ca02c",
  color: "#fff",
  padding: "12px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "1rem",
  width: "100%"
};