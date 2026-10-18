import React, { useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function FormularioAvaliacao({
  alunoSelecionado,
  onAvaliacaoSalva,
}) {
  const initialAvaliacaoState = {
    dataAval: new Date().toISOString().split("T")[0],
    peso: "",
    estatura: "",
    // Circunferências
    cintura: "",
    abdomen: "",
    quadril: "",
    // Membros Superiores (cm)
    bracoRelaxDir: "",
    bracoRelaxEsq: "",
    bracoContrDir: "",
    bracoContrEsq: "",
    // Membros Inferiores (cm)
    coxaDir: "",
    coxaEsq: "",
    panturrilhaDir: "",
    panturrilhaEsq: "",
    // Dobras Cutâneas (Agora focadas nas 3 dobras do protocolo)
    triceps: "",
    suprailiaca: "",
    coxa: "",
    peitoral: "", // Opcional/Exclusivo para homens se quiser manter
    abdominal: "", // Opcional/Exclusivo para homens se quiser manter
    // Sinais Vitais
    pa: "",
    oximetria: "",
    fcRepouso: "",
    // Teste de Esteira
    fcMaxAtg: "",
    velFinal: "",
    // Força Funcional
    flexaoBraco: "",
    sentaLevanta: "",
    prancha: "",
    // URLs/Base64 das 3 fotos da avaliação
    fotoFrente: "",
    fotoPerfil: "",
    fotoCostas: "",
  };

  const [avaliacao, setAvaliacao] = useState(initialAvaliacaoState);
  const [loading, setLoading] = useState(false);

  // Função auxiliar para converter imagem em Base64 compactada
  const handleImageUpload = (e, campoFoto) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvaliacao((prev) => ({ ...prev, [campoFoto]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return 30;
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const calcularVO2Max = (velFinalKmH) => {
    const vel = parseFloat(velFinalKmH) || 0;
    if (vel <= 0) return 0;
    const velMmin = vel * 16.67;
    const vo2max = 3.5 * velMmin + 3.5;
    return parseFloat(vo2max.toFixed(1));
  };

  const calcularGorduraVisceral = (
    sexo,
    idade,
    cinturaCm,
    pesoKg,
    estaturaCm,
  ) => {
    const cintura = parseFloat(cinturaCm) || 0;
    const peso = parseFloat(pesoKg) || 0;
    const estaturaM = (parseFloat(estaturaCm) || 0) / 100;

    if (cintura <= 0 || peso <= 0 || estaturaM <= 0) {
      return {
        gorduraVisceralArea: 0,
        gorduraVisceralNivel: 0,
        gorduraVisceralClassificacao: "N/A",
      };
    }

    const imc = peso / (estaturaM * estaturaM);
    let areaVisceral =
      sexo === "M"
        ? 1.33 * cintura + 0.33 * idade + 1.2 * imc - 110
        : 1.15 * cintura + 0.28 * idade + 1.0 * imc - 95;

    areaVisceral = Math.max(10, parseFloat(areaVisceral.toFixed(1)));
    const nivelVisceral = Math.round(areaVisceral / 10);

    let classificacao = "Saudável";
    if (nivelVisceral >= 10 && nivelVisceral <= 14)
      classificacao = "Atenção (Elevada)";
    else if (nivelVisceral >= 15) classificacao = "Risco Alto";

    return {
      gorduraVisceralArea: areaVisceral,
      gorduraVisceralNivel: nivelVisceral,
      gorduraVisceralClassificacao: classificacao,
    };
  };

  // Cálculo de Jackson & Pollock (3 Dobras) específico por sexo
  const calcularResultadosAntropometricos = () => {
    const sexo = alunoSelecionado.sexo || "M";
    const idade = calcularIdade(alunoSelecionado.dataNasc);
    const pesoKg = parseFloat(avaliacao.peso) || 0;
    const estaturaCm = parseFloat(avaliacao.estatura) || 0;
    const cinturaCm = parseFloat(avaliacao.cintura) || 0;

    let somaDobras = 0;
    let densidadeCorporal = 0;

    if (sexo === "M") {
      // Homens: Peitoral, Abdômen, Coxa
      const peitoral = parseFloat(avaliacao.peitoral) || 0;
      const abdominal = parseFloat(avaliacao.abdominal) || 0;
      const coxa = parseFloat(avaliacao.coxa) || 0;
      somaDobras = peitoral + abdominal + coxa;

      densidadeCorporal =
        1.10938 -
        0.0008267 * somaDobras +
        0.0000016 * Math.pow(somaDobras, 2) -
        0.0002574 * idade;
    } else {
      // Mulheres: Tríceps, Supra-ilíaca, Coxa (Sem peitoral!)
      const triceps = parseFloat(avaliacao.triceps) || 0;
      const suprailiaca = parseFloat(avaliacao.suprailiaca) || 0;
      const coxa = parseFloat(avaliacao.coxa) || 0;
      somaDobras = triceps + suprailiaca + coxa;

      densidadeCorporal =
        1.0994921 -
        0.0009929 * somaDobras +
        0.0000023 * Math.pow(somaDobras, 2) -
        0.0001392 * idade;
    }

    const percentualGordura =
      densidadeCorporal > 0 ? (4.95 / densidadeCorporal - 4.5) * 100 : 0;
    const massaGorda = pesoKg * (percentualGordura / 100);
    const massaMagra = pesoKg - massaGorda;
    const vo2MaxCalculado = calcularVO2Max(avaliacao.velFinal);
    const dadosVisceral = calcularGorduraVisceral(
      sexo,
      idade,
      cinturaCm,
      pesoKg,
      estaturaCm,
    );

    return {
      idadeNoMomento: idade,
      somaDobras: parseFloat(somaDobras.toFixed(1)),
      densidadeCorporal: parseFloat(densidadeCorporal.toFixed(4)),
      percentualGordura: parseFloat(percentualGordura.toFixed(2)),
      massaGorda: parseFloat(massaGorda.toFixed(2)),
      massaMagra: parseFloat(massaMagra.toFixed(2)),
      vo2Max: vo2MaxCalculado,
      ...dadosVisceral,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alunoSelecionado) return alert("Nenhum aluno selecionado!");

    setLoading(true);
    try {
      const resultadosCalculados = calcularResultadosAntropometricos();

      await addDoc(collection(db, "avaliacoes"), {
        clienteId: alunoSelecionado.id,
        ...avaliacao,
        ...resultadosCalculados,
        criadoEm: serverTimestamp(),
      });

      alert("Avaliação salva e calculada com sucesso!");
      setAvaliacao(initialAvaliacaoState);
      if (onAvaliacaoSalva) onAvaliacaoSalva();
    } catch (error) {
      console.error("Erro ao salvar avaliação: ", error);
      alert("Erro ao salvar avaliação.");
    } finally {
      setLoading(false);
    }
  };

  const sexoAluno = alunoSelecionado?.sexo || "M";

  return (
    <div
      style={{
        background: "#f8f9fa",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ color: "#2b6cb0", marginTop: 0, fontSize: "1.1rem" }}>
        Nova Avaliação (
        {sexoAluno === "M"
          ? "Protocolo 3 Dobras: Homem"
          : "Protocolo 3 Dobras: Mulher"}
        ): {alunoSelecionado.nome}
      </h3>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <h4 style={sectionTitleStyle}>1. Dados da Medição</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>Data:</label>
              <input
                type="date"
                value={avaliacao.dataAval}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, dataAval: e.target.value })
                }
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Peso (kg):</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.peso}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, peso: e.target.value })
                }
                style={inputStyle}
                placeholder="80.0"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Estatura (cm):</label>
              <input
                type="number"
                value={avaliacao.estatura}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, estatura: e.target.value })
                }
                style={inputStyle}
                placeholder="178"
                required
              />
            </div>
          </div>
        </div>
        {/* UPLOAD DAS 3 FOTOS */}
        <div
          style={{
            background: "#edf2f7",
            padding: "10px",
            borderRadius: "6px",
            border: "1px dashed #cbd5e0",
          }}
        >
          <label
            style={{
              fontSize: "0.85rem",
              fontWeight: "bold",
              color: "#2d3748",
              display: "block",
              marginBottom: "8px",
            }}
          >
            📸 Fotos de Acompanhamento (Frente, Perfil, Costas):
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={subLabelStyle}>Foto Frente:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "fotoFrente")}
                style={{ fontSize: "0.75rem", width: "100%" }}
              />
              {avaliacao.fotoFrente && (
                <span style={{ color: "#38a169", fontSize: "0.75rem" }}>
                  ✔ Carregada
                </span>
              )}
            </div>
            <div>
              <label style={subLabelStyle}>Foto Perfil:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "fotoPerfil")}
                style={{ fontSize: "0.75rem", width: "100%" }}
              />
              {avaliacao.fotoPerfil && (
                <span style={{ color: "#38a169", fontSize: "0.75rem" }}>
                  ✔ Carregada
                </span>
              )}
            </div>
            <div>
              <label style={subLabelStyle}>Foto Costas:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "fotoCostas")}
                style={{ fontSize: "0.75rem", width: "100%" }}
              />
              {avaliacao.fotoCostas && (
                <span style={{ color: "#38a169", fontSize: "0.75rem" }}>
                  ✔ Carregada
                </span>
              )}
            </div>
          </div>
        </div>
        <div>
          <h4 style={sectionTitleStyle}>
            2. Circunferências / Perimetria (cm)
          </h4>

          {/* Tronco */}
          <p style={subSectionTitleStyle}>Tronco</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>Cintura:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.cintura}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, cintura: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Abdômen:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.abdomen}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, abdomen: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Quadril:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.quadril}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, quadril: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
          </div>

          {/* Braços */}
          <p style={subSectionTitleStyle}>Braços (Direito / Esquerdo)</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "10px",
              marginBottom: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>Braço Rel. Dir:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.bracoRelaxDir}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, bracoRelaxDir: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Braço Rel. Esq:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.bracoRelaxEsq}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, bracoRelaxEsq: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Braço Con. Dir:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.bracoContrDir}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, bracoContrDir: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Braço Con. Esq:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.bracoContrEsq}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, bracoContrEsq: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
          </div>

          {/* Pernas */}
          <p style={subSectionTitleStyle}>Pernas (Direita / Esquerda)</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>Coxa Dir:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.coxaDir}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, coxaDir: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Coxa Esq:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.coxaEsq}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, coxaEsq: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Panturrilha Dir:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.panturrilhaDir}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, panturrilhaDir: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
            <div>
              <label style={labelStyle}>Panturrilha Esq:</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.panturrilhaEsq}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, panturrilhaEsq: e.target.value })
                }
                style={inputStyle}
                placeholder="cm"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>
            3. Dobras Cutâneas (mm) —{" "}
            {sexoAluno === "M"
              ? "Homens (Peitoral, Abdômen, Coxa)"
              : "Mulheres (Tríceps, Supra-ilíaca, Coxa)"}
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: "10px",
            }}
          >
            {sexoAluno === "M" ? (
              <>
                <div>
                  <label style={labelStyle}>Peitoral:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={avaliacao.peitoral}
                    onChange={(e) =>
                      setAvaliacao({ ...avaliacao, peitoral: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="mm"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Abdômen:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={avaliacao.abdominal}
                    onChange={(e) =>
                      setAvaliacao({ ...avaliacao, abdominal: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="mm"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Coxa:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={avaliacao.coxa}
                    onChange={(e) =>
                      setAvaliacao({ ...avaliacao, coxa: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="mm"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Tríceps:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={avaliacao.triceps}
                    onChange={(e) =>
                      setAvaliacao({ ...avaliacao, triceps: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="mm"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Supra-ilíaca:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={avaliacao.suprailiaca}
                    onChange={(e) =>
                      setAvaliacao({
                        ...avaliacao,
                        suprailiaca: e.target.value,
                      })
                    }
                    style={inputStyle}
                    placeholder="mm"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Coxa:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={avaliacao.coxa}
                    onChange={(e) =>
                      setAvaliacao({ ...avaliacao, coxa: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="mm"
                    required
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>4. Sinais Vitais & Esteira</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>PA (Repouso):</label>
              <input
                type="text"
                value={avaliacao.pa}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, pa: e.target.value })
                }
                style={inputStyle}
                placeholder="120/80"
              />
            </div>
            <div>
              <label style={labelStyle}>SpO2 (%):</label>
              <input
                type="number"
                value={avaliacao.oximetria}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, oximetria: e.target.value })
                }
                style={inputStyle}
                placeholder="98"
              />
            </div>
            <div>
              <label style={labelStyle}>FC Máx Esteira:</label>
              <input
                type="number"
                value={avaliacao.fcMaxAtg}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, fcMaxAtg: e.target.value })
                }
                style={inputStyle}
                placeholder="bpm"
              />
            </div>
            <div>
              <label style={labelStyle}>Vel. Final (km/h):</label>
              <input
                type="number"
                step="0.1"
                value={avaliacao.velFinal}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, velFinal: e.target.value })
                }
                style={inputStyle}
                placeholder="km/h"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>5. Testes de Força Funcional</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label style={labelStyle}>Flexão (1min):</label>
              <input
                type="number"
                value={avaliacao.flexaoBraco}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, flexaoBraco: e.target.value })
                }
                style={inputStyle}
                placeholder="reps"
              />
            </div>
            <div>
              <label style={labelStyle}>Senta/Levanta:</label>
              <input
                type="number"
                value={avaliacao.sentaLevanta}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, sentaLevanta: e.target.value })
                }
                style={inputStyle}
                placeholder="reps"
              />
            </div>
            <div>
              <label style={labelStyle}>Prancha (seg):</label>
              <input
                type="number"
                value={avaliacao.prancha}
                onChange={(e) =>
                  setAvaliacao({ ...avaliacao, prancha: e.target.value })
                }
                style={inputStyle}
                placeholder="seg"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={submitBtnStyle}>
          {loading ? "Calculando e Salvando..." : "Salvar Avaliação Completa"}
        </button>
      </form>
    </div>
  );
}

const sectionTitleStyle = {
  margin: "0 0 8px 0",
  color: "#4a5568",
  fontSize: "0.95rem",
  borderBottom: "1px solid #cbd5e0",
  paddingBottom: "3px",
};
const inputStyle = {
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "0.95rem",
};
const labelStyle = {
  fontSize: "0.85rem",
  fontWeight: "500",
  color: "#4a5568",
  display: "block",
  marginBottom: "3px",
};
const subLabelStyle = {
  fontSize: "0.8rem",
  color: "#4a5568",
  display: "block",
  marginBottom: "2px",
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
  width: "100%",
  marginTop: "5px",
};

const subSectionTitleStyle = {
  margin: "8px 0 4px 0",
  fontSize: "0.85rem",
  fontWeight: "bold",
  color: "#2b6cb0",
};
