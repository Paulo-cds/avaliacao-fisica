import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import { useMobile } from "./mobileControl";

// Inicializa o Gemini com sua API Key (salva no .env como REACT_APP_GEMINI_API_KEY)
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export default function ComponenteDiagnosticoIA({
  aluno,
  historicoOrdenadoGeral,
}) {
  const [diagnostico, setDiagnostico] = useState("");
  const [carregandoIA, setCarregandoIA] = useState(false);
  const isMobile = useMobile(768);
    console.log('apiKey:', apiKey); // Adicione esta linha para depuração
  const gerarDiagnosticoIA = async () => {
    setCarregandoIA(true);
    try {
      const dadosAluno = {
        nome: aluno?.nome,
        sexo: aluno?.sexo === "M" ? "Masculino" : "Feminino",
        idade: aluno?.dataNasc
          ? new Date().getFullYear() - new Date(aluno.dataNasc).getFullYear()
          : "N/A",
        historicoAvaliacoes: historicoOrdenadoGeral.map((av) => ({
          data: av.dataAval,
          peso: av.peso,
          percentualGordura: av.percentualGordura,
          massaMagra: av.massaMagra,
          gorduraVisceralNivel: av.gorduraVisceralNivel,
          vo2Max: av.vo2Max,
          flexao: av.flexaoBraco,
          prancha: av.prancha,
          sentaLevanta: av.sentaLevanta,
        })),
      };

      const prompt = `
        Você é um assistente especialista em Educação Física, Fisiologia do Exercício e Avaliação Física.
        Com base no histórico das avaliações físicas do aluno abaixo, gere um diagnóstico profissional, motivador e fácil de entender para o aluno.

        DADOS DO ALUNO E HISTÓRICO:
        ${JSON.stringify(dadosAluno, null, 2)}

        INSTRUÇÕES DO DIAGNÓSTICO:
        1. **Resumo da Evolução**: Analise o progresso entre a primeira e a última avaliação (peso, % de gordura, massa magra).
        2. **Saúde Cardio e Metabólica**: Comente sobre a Gordura Visceral e o VO2max (se houve melhora ou manutenção de saúde).
        3. **Força e Funcionalidade**: Destaque a evolução nos testes de força (flexão, prancha, senta/levanta).
        4. **Conclusão e Próximos Passos**: Dê uma palavra de incentivo para os próximos treinos.
        
        Mantenha o tom profissional, encorajador e amigável. Use tópicos com emojis para facilitar a leitura no dashboard.
      `;

      // MODELO ATUALIZADO AQUI:
      const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      setDiagnostico(responseText);
    } catch (error) {
      console.error("Erro ao gerar diagnóstico por IA:", error);
      alert(
        "Não foi possível gerar o diagnóstico no momento. Tente novamente mais tarde.",
      );
    } finally {
      setCarregandoIA(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: !isMobile ? "20px" : "10px",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginTop: "30px",
        marginBottom: "30px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "#1a365d",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            ✨ Diagnóstico Inteligente de Evolução
          </h3>
          <p
            style={{ margin: "4px 0 0 0", color: "#718096", fontSize: "13px" }}
          >
            Gerado automaticamente por Inteligência Artificial com base no seu
            histórico.
          </p>
        </div>

        <button
          onClick={gerarDiagnosticoIA}
          disabled={carregandoIA}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: carregandoIA ? "not-allowed" : "pointer",
            boxShadow: "0 2px 6px rgba(102, 126, 234, 0.4)",
            fontSize: "14px",
          }}
        >
          {carregandoIA
            ? "⏳ Analisando dados..."
            : "✨ Gerar Diagnóstico com IA"}
        </button>
      </div>

      {diagnostico && (
        <div
          style={{
            marginTop: "20px",
            padding: !isMobile ? "15px 20px" : "10px 15px",
            backgroundColor: "#f7fafc",
            borderRadius: "6px",
            borderLeft: "4px solid #667eea",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#2d3748",
            whiteSpace: "pre-line", // Garante que as quebras de linha do texto gerado sejam respeitadas
          }}
        >
          <ReactMarkdown
            components={{
              // Estilização opcional para os elementos gerados pelo markdown
              strong: ({ node, ...props }) => (
                <strong
                  style={{ color: "#1a365d", fontWeight: "bold" }}
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p style={{ margin: "0 0 10px 0" }} {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  style={{ paddingLeft: "20px", margin: "0 0 10px 0" }}
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: "4px" }} {...props} />
              ),
            }}
          >
            {diagnostico}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
