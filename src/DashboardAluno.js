import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "./firebase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useMobile } from "./mobileControl";
import Private from "./Private";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { getAuth } from "firebase/auth";
import CardGorduraVisceral from "./CardGorduraVisceral";
import CardImage from "./CardImage";
import ComponenteDiagnosticoIA from "./ComponenteDiagnosticoIA";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const formatarDataBr = (dataString) => {
  if (!dataString) return "";
  const dataPartes = dataString.split("T")[0].split("-");
  if (dataPartes.length !== 3) return dataString;
  const [ano, mes, dia] = dataPartes;
  return `${dia}/${mes}/${ano}`;
};

export default function DashboardAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordemData, setOrdemData] = useState("asc");
  const isMobile = useMobile(768);
  const auth = getAuth();

  useEffect(() => {
    const buscarDadosDoAluno = async () => {
      try {
        if (!id) return;

        const alunoDocRef = doc(db, "clientes", id);
        const alunoSnapshot = await getDoc(alunoDocRef);

        if (alunoSnapshot.exists()) {
          setAluno({ id: alunoSnapshot.id, ...alunoSnapshot.data() });
        }

        const avaliacoesQuery = query(
          collection(db, "avaliacoes"),
          where("clienteId", "==", id),
        );
        const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
        const listaAvaliacoes = avaliacoesSnapshot.docs.map((doc) =>
          doc.data(),
        );

        setHistorico(listaAvaliacoes);
      } catch (error) {
        console.error("Erro ao carregar dados do aluno:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarDadosDoAluno();
  }, [id]);

  const dashboardRef = useRef(null);

  const gerarPDF = async () => {
    console.log("chamou...");
    const element = dashboardRef.current;
    console.log("elemento do dashboardRef:", element);
    if (!element) return;

    try {
      // 1. Renderiza o container do React em um Canvas HTML5 de alta resolução
      const canvas = await html2canvas(element, {
        scale: 2, // Garante nitidez do texto e dos gráficos
        useCORS: true, // Permite carregar imagens de origens externas/Base64
        allowTaint: true,
        logging: false,
      });

      // 2. Converte o canvas para imagem JPEG de qualidade
      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      // 3. Configura a página do PDF (Formato A4 em milímetros)
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calcula a proporção para caber perfeitamente no A4
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // Margem superior

      const calculatedWidth = imgWidth * ratio;
      const calculatedHeight = imgHeight * ratio;

      // 4. Adiciona a imagem renderizada ao arquivo PDF
      pdf.addImage(
        imgData,
        "JPEG",
        imgX,
        imgY,
        calculatedWidth,
        calculatedHeight,
      );

      // 5. Baixa o documento com o nome do aluno
      const nomeFormatado = aluno?.nome?.replace(/\s+/g, "_") || "Aluno";
      pdf.save(`Avaliacao_Fisica_${nomeFormatado}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(
        "Houve um erro ao tentar gerar o PDF. Verifique se os gráficos e imagens foram totalmente carregados.",
      );
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", fontSize: "18px" }}>
        Carregando dados...
      </div>
    );
  }

  if (!aluno) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
        Aluno não encontrado.
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "40px auto",
          padding: "30px",
          textAlign: "center",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ color: "#2b6cb0" }}>{aluno.nome}</h2>
        <p style={{ color: "#666" }}>
          Nenhuma avaliação física cadastrada para este aluno ainda.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            marginTop: "15px",
            background: "#3182ce",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          ← Voltar aos Clientes
        </Link>
      </div>
    );
  }

  // 1. Array com TODAS as avaliações ordenadas por data (da mais antiga para a mais recente)
  const historicoOrdenadoGeral = [...historico].sort(
    (a, b) => new Date(a.dataAval) - new Date(b.dataAval),
  );

  // 2. Limita às últimas 5 avaliações para não poluir os gráficos
  const historicoOrdenado = historicoOrdenadoGeral.slice(-5);

  const avaliacaoMaisRecente = [...historico].sort(
    (a, b) => new Date(a.dataAval) - new Date(b.dataAval),
  )[historico.length - 1];

  const primeiraAvaliacao = historicoOrdenadoGeral[0];

  const pesoAtual = parseFloat(avaliacaoMaisRecente.peso) || 0;
  const gorduraAtual = parseFloat(avaliacaoMaisRecente.percentualGordura) || 0;
  const massaMagraAtual = parseFloat(avaliacaoMaisRecente.massaMagra) || 0;
  const vo2Atual = parseFloat(avaliacaoMaisRecente.vo2Max) || 0;
  const flexaoAtual = parseFloat(avaliacaoMaisRecente.flexaoBraco) || 0;
  const sentaLevantaAtual = parseFloat(avaliacaoMaisRecente.sentaLevanta) || 0;
  const pranchaAtual = parseFloat(avaliacaoMaisRecente.prancha) || 0;
  const paAtual = avaliacaoMaisRecente.pa || "N/A";
  const oximetriaAtual = avaliacaoMaisRecente.oximetria || "N/A";

  const visceralNivel = avaliacaoMaisRecente.gorduraVisceralNivel || 0;
  const visceralArea = avaliacaoMaisRecente.gorduraVisceralArea || 0;
  const visceralClassificacao =
    avaliacaoMaisRecente.gorduraVisceralClassificacao || "Normal";

  const dadosRosca = {
    labels: ["Massa Magra (kg)", "Massa Gorda (kg)"],
    datasets: [
      {
        data: [massaMagraAtual, pesoAtual - massaMagraAtual],
        backgroundColor: ["#3182ce", "#e53e3e"],
        borderWidth: 2,
      },
    ],
  };

  const datas = historicoOrdenado.map((av) => formatarDataBr(av.dataAval));
  const pesos = historicoOrdenado.map((av) => parseFloat(av.peso) || 0);
  const percentualGorduras = historicoOrdenado.map(
    (av) => parseFloat(av.percentualGordura) || 0,
  );
  const vo2Historico = historicoOrdenado.map(
    (av) => parseFloat(av.vo2Max) || 0,
  );
  const flexoes = historicoOrdenado.map(
    (av) => parseFloat(av.flexaoBraco) || 0,
  );
  const sentaLevantaHistorico = historicoOrdenado.map(
    (av) => parseFloat(av.sentaLevanta) || 0,
  );
  const pranchaHistorico = historicoOrdenado.map(
    (av) => parseFloat(av.prancha) || 0,
  );
  const cinturas = historicoOrdenado.map((av) => parseFloat(av.cintura) || 0);
  const abdomens = historicoOrdenado.map((av) => parseFloat(av.abdomen) || 0);
  const quadris = historicoOrdenado.map((av) => parseFloat(av.quadril) || 0);

  const dadosEvolucaoCorporal = {
    labels: datas,
    datasets: [
      {
        label: "Peso Total (kg)",
        data: pesos,
        borderColor: "#2b6cb0",
        backgroundColor: "rgba(43, 108, 176, 0.2)",
        tension: 0.3,
        yAxisID: "y",
      },
      {
        label: "% de Gordura (%)",
        data: percentualGorduras,
        borderColor: "#dd6b20",
        backgroundColor: "rgba(221, 107, 32, 0.2)",
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  const opcoesEvolucaoCorporal = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Peso (kg)" },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "% Gordura" },
      },
    },
    plugins: { legend: { position: "bottom" } },
  };

  const dadosEvolucaoCircunferencias = {
    labels: datas,
    datasets: [
      {
        label: "Cintura (cm)",
        data: cinturas,
        borderColor: "#e53e3e",
        backgroundColor: "rgba(229, 62, 62, 0.2)",
        tension: 0.3,
      },
      {
        label: "Abdômen (cm)",
        data: abdomens,
        borderColor: "#d69e2e",
        backgroundColor: "rgba(214, 158, 46, 0.2)",
        tension: 0.3,
      },
      {
        label: "Quadril (cm)",
        data: quadris,
        borderColor: "#3182ce",
        backgroundColor: "rgba(49, 130, 206, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const dadosEvolucaoVO2 = {
    labels: datas,
    datasets: [
      {
        label: "VO2max (ml/kg/min)",
        data: vo2Historico,
        borderColor: "#319795",
        backgroundColor: "rgba(49, 151, 149, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const dadosEvolucaoForca = {
    labels: datas,
    datasets: [
      {
        label: "Flexão (reps/1min)",
        data: flexoes,
        borderColor: "#38a169",
        backgroundColor: "rgba(56, 161, 105, 0.2)",
        tension: 0.3,
      },
      {
        label: "Senta/Levanta (30s)",
        data: sentaLevantaHistorico,
        borderColor: "#b7791f",
        backgroundColor: "rgba(183, 121, 31, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const dadosEvolucaoPrancha = {
    labels: datas,
    datasets: [
      {
        label: "Prancha Isométrica (segundos)",
        data: pranchaHistorico,
        borderColor: "#805ad5",
        backgroundColor: "rgba(128, 90, 213, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const linkDashboard = window.location.href;
  const mensagemWhatsApp = encodeURIComponent(
    `Olá, ${aluno?.nome}! 👋\n\nSua avaliação física recente já está pronta! 📊\n\n` +
      `*Resumo da Avaliação (${avaliacaoMaisRecente?.dataAval}):*\n` +
      `• Peso: ${avaliacaoMaisRecente?.peso} kg\n` +
      `• % Gordura: ${avaliacaoMaisRecente?.percentualGordura}%\n` +
      `• Gordura Visceral: Nível ${avaliacaoMaisRecente?.gorduraVisceralNivel || "-"}\n\n` +
      `Acesse seu painel completo e interativo pelo link: ${linkDashboard}`,
  );

  return (
    <div
      style={{
        width: "1000px",
        maxWidth: "100%",
        boxSizing: "border-box",
        margin: "20px auto",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "15px",
          fontFamily: "Segoe UI, sans-serif",
        }}
      >
        {/* Barra de Ações (Botão de PDF e Envio por WhatsApp) */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Botão para Gerar PDF */}
          <button
            onClick={gerarPDF}
            style={{
              background: "#2b6cb0",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            📄 Baixar Relatório PDF
          </button>

          {/* Botão de Envio Direto via WhatsApp */}
          {auth && auth._currentUser && (
            <a
              href={`https://api.whatsapp.com/send?text=${mensagemWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "6px",
                fontWeight: "bold",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              💬 Enviar resumo via WhatsApp
            </a>
          )}
        </div>
      </div>
      <div
        ref={dashboardRef}
        style={{
          paddingBottom: "20px",
        }}
      >
        {/* CABEÇALHO E ORDENAÇÃO */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            {auth && auth._currentUser && (
              <Link
                to="/"
                style={{
                  display: "inline-block",
                  marginBottom: "8px",
                  padding: "6px 12px",
                  background: "#edf2f7",
                  border: "1px solid #cbd5e0",
                  borderRadius: "6px",
                  color: "#2d3748",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                ← Voltar aos Clientes
              </Link>
            )}
            <h2 style={{ color: "#1a365d", margin: "0 0 5px 0" }}>
              Dashboard de Evolução: {aluno.nome}
            </h2>
            <p style={{ color: "#4a5568", margin: 0, fontSize: "0.9rem" }}>
              Sexo: {aluno.sexo === "M" ? "Masculino" : "Feminino"} | Data de
              Nasc.: {formatarDataBr(aluno.dataNasc)}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e0",
            }}
          >
            <label
              style={{ fontSize: "13px", color: "#4a5568", fontWeight: "bold" }}
            >
              Ordem:
            </label>
            <button
              onClick={() => setOrdemData(ordemData === "asc" ? "desc" : "asc")}
              style={{
                backgroundColor: "#3182ce",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              {ordemData === "asc"
                ? "📅 Crescente (Antigas ↑)"
                : "📅 Decrescente (Recentes ↓)"}
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO (KPIs) - 7 CARDS FLUIDOS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <div style={cardKpiStyle("#2b6cb0")}>
            <h4>Peso Atual</h4>
            <h2>{pesoAtual} kg</h2>
          </div>
          <div style={cardKpiStyle("#dd6b20")}>
            <h4>% de Gordura</h4>
            <h2>{gorduraAtual}%</h2>
          </div>
          <div
            style={cardKpiStyle(visceralNivel >= 10 ? "#e53e3e" : "#319795")}
          >
            <h4>Gordura Visceral</h4>
            <h2>Nível {visceralNivel}</h2>
          </div>
          <div style={cardKpiStyle("#319795")}>
            <h4>VO2max Atual</h4>
            <h2>
              {vo2Atual} <span style={{ fontSize: "10px" }}>ml/kg/min</span>
            </h2>
          </div>
        </div>

        {/* BANNER DE RISCO DE GORDURA VISCERAL */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px 20px",
            borderRadius: "8px",
            borderLeft: `6px solid ${
              visceralNivel >= 10 ? "#e53e3e" : "#38a169"
            }`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h4 style={{ margin: 0, color: "#2d3748", fontSize: "15px" }}>
              Indicador de Gordura Visceral e Saúde Metabólica
            </h4>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#718096",
                fontSize: "13px",
              }}
            >
              Área Visceral Estimada: <strong>{visceralArea} cm²</strong> |
              Cintura: <strong>{avaliacaoMaisRecente.cintura || 0} cm</strong>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                backgroundColor: visceralNivel >= 10 ? "#fed7d7" : "#c6f6d5",
                color: visceralNivel >= 10 ? "#9b2c2c" : "#22543d",
                padding: "6px 14px",
                borderRadius: "20px",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {visceralClassificacao}
            </span>
            <CardGorduraVisceral
              nivel={visceralNivel}
              classificacao={visceralClassificacao}
            />
          </div>
        </div>

        {/* CARD DE SINAIS VITAIS */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "15px 20px",
            borderRadius: "8px",
            border: "1px solid #cbd5e0",
            marginBottom: "30px",
            display: "flex",
            justifyContent: !isMobile ? "space-around" : "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div>
            <span style={{ fontSize: "13px", color: "#666", display: "block" }}>
              Pressão Arterial (Repouso):
            </span>
            <strong style={{ fontSize: "18px", color: "#2d3748" }}>
              {paAtual} mmHg
            </strong>
          </div>
          <div
            style={{
              borderLeft: !isMobile ? "1px solid #e2e8f0" : "none",
              paddingLeft: !isMobile ? "20px" : "0",
            }}
          >
            <span style={{ fontSize: "13px", color: "#666", display: "block" }}>
              Oximetria (SpO2):
            </span>
            <strong style={{ fontSize: "18px", color: "#2d3748" }}>
              {oximetriaAtual}%
            </strong>
          </div>
          <div
            style={{
              borderLeft: !isMobile ? "1px solid #e2e8f0" : "none",
              paddingLeft: !isMobile ? "20px" : "0",
            }}
          >
            <span style={{ fontSize: "13px", color: "#666", display: "block" }}>
              Última Avaliação:
            </span>
            <strong style={{ fontSize: "18px", color: "#2d3748" }}>
              {formatarDataBr(avaliacaoMaisRecente.dataAval)}
            </strong>
          </div>
        </div>

        {/* Tabela de Perimetria de Membros (Braços e Pernas) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            marginBottom: "25px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              color: "#2d3748",
              marginBottom: "15px",
              fontWeight: "600",
            }}
          >
            Comparativo de Medidas (Braços e Pernas)
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#edf2f7",
                    borderBottom: "2px solid #cbd5e0",
                  }}
                >
                  <th style={{ padding: "8px" }}>Medida (cm)</th>
                  <th style={{ padding: "8px" }}>Primeira Avaliação</th>
                  <th style={{ padding: "8px" }}>Última Avaliação</th>
                  <th style={{ padding: "8px" }}>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Braço Relax. (Dir)", dir: "bracoRelaxDir" },
                  { label: "Braço Relax. (Esq)", dir: "bracoRelaxEsq" },
                  { label: "Braço Contr. (Dir)", dir: "bracoContrDir" },
                  { label: "Braço Contr. (Esq)", dir: "bracoContrEsq" },
                  { label: "Coxa (Dir)", dir: "coxaDir" },
                  { label: "Coxa (Esq)", dir: "coxaEsq" },
                  { label: "Panturrilha (Dir)", dir: "panturrilhaDir" },
                  { label: "Panturrilha (Esq)", dir: "panturrilhaEsq" },
                ].map((item, index) => {
                  const primeiraAval = historicoOrdenadoGeral[0] || {};
                  const ultimaAval = avaliacaoMaisRecente || {};

                  const valInicial = parseFloat(primeiraAval[item.dir]) || 0;
                  const valAtual = parseFloat(ultimaAval[item.dir]) || 0;
                  const dif = parseFloat((valAtual - valInicial).toFixed(1));

                  return (
                    <tr
                      key={index}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td style={{ padding: "8px", fontWeight: "500" }}>
                        {item.label}
                      </td>
                      <td style={{ padding: "8px" }}>
                        {valInicial > 0 ? `${valInicial} cm` : "-"}
                      </td>
                      <td style={{ padding: "8px" }}>
                        {valAtual > 0 ? `${valAtual} cm` : "-"}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          fontWeight: "bold",
                          color:
                            dif > 0
                              ? "#2b6cb0"
                              : dif < 0
                                ? "#e53e3e"
                                : "#718096",
                        }}
                      >
                        {dif > 0 ? `+${dif} cm` : `${dif} cm`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* GRID DE GRÁFICOS (2 Colunas em desktop, coluna única em telas menores) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div style={graphContainerStyle}>
            <h3 style={graphTitleStyle}>Composição Corporal Atual (Siri)</h3>
            <div style={{ maxWidth: "260px", margin: "0 auto" }}>
              <Doughnut data={dadosRosca} />
            </div>
          </div>

          <div style={graphContainerStyle}>
            <h3 style={graphTitleStyle}>Evolução de Peso e % de Gordura</h3>
            <Line
              data={dadosEvolucaoCorporal}
              options={opcoesEvolucaoCorporal}
            />
          </div>

          <div style={graphContainerStyle}>
            <h3 style={graphTitleStyle}>Evolução de Circunferências (cm)</h3>
            <Line
              data={dadosEvolucaoCircunferencias}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>

          <div style={graphContainerStyle}>
            <h3 style={graphTitleStyle}>
              Evolução Cardiorrespiratória (VO2max)
            </h3>
            <Line
              data={dadosEvolucaoVO2}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>

          <div style={graphContainerStyle}>
            <h3 style={graphTitleStyle}>Resistência e Força Muscular</h3>
            <Line
              data={dadosEvolucaoForca}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>

          <div style={graphContainerStyle}>
            <h3 style={graphTitleStyle}>
              Evolução da Prancha Isométrica (Core)
            </h3>
            <Line
              data={dadosEvolucaoPrancha}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </div>

        {/* Seção de Comparação Visual por Fotos no Dashboard */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              color: "#2d3748",
              marginBottom: "15px",
              fontWeight: "600",
            }}
          >
            Evolução Visual
          </h3>

          {historicoOrdenado.length > 1 ? (
            <>
              <p>
                Penúltima Avaliação:{" "}
                {formatarDataBr(
                  historicoOrdenado[historicoOrdenado.length - 2].dataAval,
                )}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  textAlign: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Frente
                  </p>
                  {historicoOrdenado[historicoOrdenado.length - 2]
                    .fotoFrente ? (
                    <img
                      src={
                        historicoOrdenado[historicoOrdenado.length - 2]
                          .fotoFrente
                      }
                      alt="Frente"
                      style={{
                        width: "100%",
                        maxHeight: "350px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a0aec0" }}>
                      Sem foto cadastrada
                    </p>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Perfil
                  </p>
                  {historicoOrdenado[historicoOrdenado.length - 2]
                    .fotoPerfil ? (
                    <img
                      src={
                        historicoOrdenado[historicoOrdenado.length - 2]
                          .fotoPerfil
                      }
                      alt="Perfil"
                      style={{
                        width: "100%",
                        maxHeight: "250px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a0aec0" }}>
                      Sem foto cadastrada
                    </p>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Costas
                  </p>
                  {historicoOrdenado[historicoOrdenado.length - 2]
                    .fotoCostas ? (
                    <img
                      src={
                        historicoOrdenado[historicoOrdenado.length - 2]
                          .fotoCostas
                      }
                      alt="Costas"
                      style={{
                        width: "100%",
                        maxHeight: "250px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a0aec0" }}>
                      Sem foto cadastrada
                    </p>
                  )}
                </div>
              </div>
              <p style={{ marginTop: "15px" }}>
                Última Avaliação:{" "}
                {formatarDataBr(
                  historicoOrdenado[historicoOrdenado.length - 1].dataAval,
                )}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  textAlign: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Frente
                  </p>
                  {historicoOrdenado[historicoOrdenado.length - 1]
                    .fotoFrente ? (
                    <img
                      src={
                        historicoOrdenado[historicoOrdenado.length - 1]
                          .fotoFrente
                      }
                      alt="Frente"
                      style={{
                        width: "100%",
                        maxHeight: "250px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a0aec0" }}>
                      Sem foto cadastrada
                    </p>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Perfil
                  </p>
                  {historicoOrdenado[historicoOrdenado.length - 1]
                    .fotoPerfil ? (
                    <img
                      src={
                        historicoOrdenado[historicoOrdenado.length - 1]
                          .fotoPerfil
                      }
                      alt="Perfil"
                      style={{
                        width: "100%",
                        maxHeight: "250px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a0aec0" }}>
                      Sem foto cadastrada
                    </p>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Costas
                  </p>
                  {historicoOrdenado[historicoOrdenado.length - 1]
                    .fotoCostas ? (
                    <img
                      src={
                        historicoOrdenado[historicoOrdenado.length - 1]
                          .fotoCostas
                      }
                      alt="Costas"
                      style={{
                        width: "100%",
                        maxHeight: "250px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "12px", color: "#a0aec0" }}>
                      Sem foto cadastrada
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <p>
                Última Avaliação:{" "}
                {formatarDataBr(
                  historicoOrdenado[historicoOrdenado.length - 1].dataAval,
                )}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                  textAlign: "center",
                }}
              >
                <CardImage
                  src={avaliacaoMaisRecente.fotoFrente}
                  alt="Frente"
                  label="Frente"
                />
                <CardImage
                  src={avaliacaoMaisRecente.fotoPerfil}
                  alt="Perfil"
                  label="Perfil"
                />
                <CardImage
                  src={avaliacaoMaisRecente.fotoCostas}
                  alt="Costas"
                  label="Costas"
                />
              </div>
            </>
          )}
        </div>
        <ComponenteDiagnosticoIA 
          aluno={aluno}
          historicoOrdenadoGeral={historicoOrdenado}
        />
      </div>
    </div>
  );
}

const cardKpiStyle = (borderColor) => ({
  backgroundColor: "#ffffff",
  padding: "15px",
  borderRadius: "8px",
  borderLeft: `5px solid ${borderColor}`,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  textAlign: "center",
});

const graphContainerStyle = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0",
  boxSizing: "border-box",
};

const graphTitleStyle = {
  fontSize: "16px",
  color: "#2d3748",
  marginBottom: "15px",
  textAlign: "center",
  fontWeight: "600",
};
