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
import { Link } from "react-router";
import { formatarDataBr } from "./index"; // Função para formatar datas no padrão brasileiro

export default function SistemaAvaliacao() {
  const [aba, setAba] = useState("clientes"); // 'clientes', 'novoCliente', 'novaAvaliacao'
  const [clientes, setClientes] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([]);
  const [ordemHistorico, setOrdemHistorico] = useState("asc");

  // Estados dos formulários
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    sexo: "M",
    dataNasc: "",
  });
  const [avaliacao, setAvaliacao] = useState({
    dataAval: new Date().toISOString().split("T")[0],
    peso: "",
    estatura: "",
    peitoral: "",
    axilar: "",
    triceps: "",
    subescapular: "",
    abdominal: "",
    suprailiaca: "",
    coxa: "",
    pa: "",
    oximetria: "",
    fcRepouso: "",
    fcMaxAtg: "",
    velFinal: "",
    flexaoBraco: "",
    sentaLevanta: "",
    prancha: "",
  });

  // Carregar lista de clientes ao iniciar
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

  // Salvar Novo Cliente
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

  // Salvar Nova Avaliação para o Aluno Selecionado
  // const handleSalvarAvaliacao = async (e) => {
  //   e.preventDefault();
  //   if (!alunoSelecionado) return alert("Selecione um aluno primeiro!");

  //   try {
  //     await addDoc(collection(db, "avaliacoes"), {
  //       clienteId: alunoSelecionado.id,
  //       ...avaliacao,
  //       criadoEm: serverTimestamp(),
  //     });
  //     alert("Avaliação salva com sucesso no Firestore!");
  //     carregarHistorico(alunoSelecionado.id);
  //   } catch (error) {
  //     console.error("Erro ao salvar avaliação: ", error);
  //   }
  // };

  // Carregar histórico de avaliações de um aluno
  const carregarHistorico = async (clienteId) => {
    const q = query(
      collection(db, "avaliacoes"),
      where("clienteId", "==", clienteId)
    );
    const querySnapshot = await getDocs(q);
    const lista = querySnapshot.docs.map((doc) => doc.data());
    setHistoricoAvaliacoes(lista);
    setAba("detalhesAluno");
  };

  const historicoOrdenado = [...historicoAvaliacoes].sort((a, b) => {
    const dataA = new Date(a.dataAval);
    const dataB = new Date(b.dataAval);
    return ordemHistorico === "asc" ? dataA - dataB : dataB - dataA;
  });

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "20px auto",
        fontFamily: "Segoe UI, sans-serif",
        padding: "20px",
      }}
    >
      <h1>Painel de Avaliação Física - Personal Trainer</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setAba("clientes")}
          style={btnStyle(aba === "clientes")}
        >
          Meus Clientes
        </button>
        <button
          onClick={() => setAba("novoCliente")}
          style={btnStyle(aba === "novoCliente")}
        >
          + Cadastrar Aluno
        </button>
      </div>

      {/* ABA: LISTA DE CLIENTES */}
      {aba === "clientes" && (
        <div>
          <h2>Lista de Alunos</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {clientes.map((c) => (
              <li
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "#fff",
                  marginBottom: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                }}
              >
                <span>
                  <strong>{c.nome}</strong> ({c.sexo}) - Nasc: {c.dataNasc}
                </span>
                <button
                  onClick={() => {
                    setAlunoSelecionado(c);
                    carregarHistorico(c.id);
                  }}
                  style={{
                    background: "#3182ce",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
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
          <h2>Novo Aluno</h2>
          <label>Nome Completo:</label>
          <input
            type="text"
            value={novoCliente.nome}
            onChange={(e) =>
              setNovoCliente({ ...novoCliente, nome: e.target.value })
            }
            required
            style={inputStyle}
          />

          <label>Sexo:</label>
          <select
            value={novoCliente.sexo}
            onChange={(e) =>
              setNovoCliente({ ...novoCliente, sexo: e.target.value })
            }
            style={inputStyle}
          >
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>

          <label>Data de Nascimento:</label>
          <input
            type="date"
            value={novoCliente.dataNasc}
            onChange={(e) =>
              setNovoCliente({ ...novoCliente, dataNasc: e.target.value })
            }
            required
            style={inputStyle}
          />

          <button type="submit" style={submitBtnStyle}>
            Salvar Aluno
          </button>
        </form>
      )}

      {/* ABA: DETALHES E HISTÓRICO DO ALUNO SELECIONADO */}
      {aba === "detalhesAluno" && alunoSelecionado && (
        <div>
          <button
            onClick={() => setAba("clientes")}
            style={{ marginBottom: "15px" }}
          >
            ← Voltar para Clientes
          </button>
          <h2>Aluno: {alunoSelecionado.nome}</h2>

          <div
            style={{
              background: "#edf2f7",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <FormularioAvaliacao
              alunoSelecionado={alunoSelecionado}
              onAvaliacaoSalva={carregarHistorico}
            />
          </div>

          <h3>Histórico de Avaliações ({historicoAvaliacoes.length})</h3>
          {/* BOTÃO PARA ALTERNAR A ORDENAÇÃO DO HISTÓRICO */}
          <button
            onClick={() =>
              setOrdemHistorico(ordemHistorico === "asc" ? "desc" : "asc")
            }
            style={{
              backgroundColor: "#2b6cb0",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            {ordemHistorico === "asc"
              ? "📅 Mais Antigas Primeiras (Crescente ↑)"
              : "📅 Mais Recentes Primeiras (Decrescente ↓)"}
          </button>
          <div
            key={alunoSelecionado.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px",
              background: "#fff",
              marginBottom: "8px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            <span>
              <strong>{alunoSelecionado.nome}</strong> ({alunoSelecionado.sexo})
            </span>

            {/* O Link redireciona para a rota dinâmica /aluno/ID_DO_FIREBASE/dashboard */}
            <Link
              to={`/aluno/${alunoSelecionado.id}/dashboard`}
              style={{
                background: "#3182ce",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Ver Dashboard e Gráficos
            </Link>
          </div>
          <ul>
            {historicoOrdenado.map((av) => (
              <li
                key={av.id}
                style={{
                  padding: "12px",
                  background: "#fff",
                  border: "1px solid #ccc",
                  marginBottom: "8px",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <strong>Data:</strong> {formatarDataBr(av.dataAval)} |{" "}
                  <strong>Peso:</strong> {av.peso} kg |{" "}
                  <strong>Estatura:</strong> {av.estatura} cm |{" "}
                  <strong>% Gordura:</strong> {av.percentualGordura || "N/A"}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Estilos auxiliares rápidos
const btnStyle = (active) => ({
  padding: "10px 20px",
  background: active ? "#2b6cb0" : "#e2e8f0",
  color: active ? "#fff" : "#333",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
});
const formStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};
const inputStyle = {
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
};
const submitBtnStyle = {
  background: "#2ca02c",
  color: "#fff",
  padding: "10px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};
