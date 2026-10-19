import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { db } from "./firebase";

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
      const carregarAvaliacaoECliente = async () => {
        try {
          const avDocRef = doc(db, "clientes", id);
          const avSnap = await getDoc(avDocRef);
  
          if (!avSnap.exists()) {
            alert("Cliente não encontrado!");
            navigate(-1);
            return;
          }
  
          const avData = { id: avSnap.id, ...avSnap.data() };
          setCliente(avData);
  
            //   if (avData.clienteId) {
            //     const clienteDocRef = doc(db, "clientes", avData.clienteId);
            //     const clienteSnap = await getDoc(clienteDocRef);
            //     if (clienteSnap.exists()) {
            //       setAluno({ id: clienteSnap.id, ...clienteSnap.data() });
            //     }
            //   }
        } catch (error) {
          console.error("Erro ao carregar dados para edição:", error);
        } finally {
          setLoading(false);
        }
      };
  
      carregarAvaliacaoECliente();
    }, [id, navigate]);


  const handleUpdate = async (e) => {
      e.preventDefault();
      setSalvando(true);
  
      try {
        // 1. Recalcula tudo automaticamente
        // const novosResultados = recalcularResultados();
        const docRef = doc(db, "clientes", id);
  
        // 2. Envia os dados editados + os resultados recalculados para o Firebase
         cliente.whatsapp = 55 + cliente.whatsapp.replace(/\D/g, "");
        await updateDoc(docRef, {
          ...cliente,
        });
  
        alert("Cliente atualizado com sucesso!");
        navigate(-1);
      } catch (error) {
        console.error("Erro ao atualizar cliente: ", error);
        alert("Erro ao atualizar cliente.");
      } finally {
        setSalvando(false);
      }
    };
  
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px", fontSize: "18px" }}>
          Carregando dados do cliente...
        </div>
      );
    }

  return (
    <form onSubmit={handleUpdate} style={formStyle}>
      <h2 style={{ fontSize: "1.2rem", color: "#2d3748", marginTop: 0 }}>
        Editar Cliente
      </h2>
      <label style={labelStyle}>Nome Completo:</label>
      <input
        type="text"
        value={cliente.nome}
        onChange={(e) =>
          setCliente({ ...cliente, nome: e.target.value })
        }
        required
        style={inputStyle}
      />

      <label style={labelStyle}>Sexo:</label>
      <select
        value={cliente.sexo}
        onChange={(e) =>
          setCliente({ ...cliente, sexo: e.target.value })
        }
        style={inputStyle}
      >
        <option value="M">Masculino</option>
        <option value="F">Feminino</option>
      </select>

      <label style={labelStyle}>Data de Nascimento:</label>
      <input
        type="date"
        value={cliente.dataNasc}
        onChange={(e) =>
          setCliente({ ...cliente, dataNasc: e.target.value })
        }
        required
        style={inputStyle}
      />

      <label
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: "5px",
        }}
      >
        WhatsApp (com DDD):
      </label>
      <input
        type="text"
        placeholder="Ex: 11999999999"
        value={cliente.whatsapp}
        onChange={(e) =>
          setCliente({ ...cliente, whatsapp: e.target.value })
        }
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #cbd5e0",
        }}
      />

      <button type="submit" style={handleUpdate ? { ...inputStyle, backgroundColor: "#3182ce", color: "#fff", cursor: "pointer" } : { ...inputStyle, backgroundColor: "#a0aec0", color: "#fff", cursor: "not-allowed" }} disabled={salvando}>
        {salvando ? "Salvando Cliente..." : "Salvar Cliente"}
      </button>
    </form>
  );
};

export default EditClient;

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
  color: "#4a5568",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "1rem",
};