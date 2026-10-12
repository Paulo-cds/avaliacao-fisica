import React, { useState } from "react";

// Exemplo do card de Gordura Visceral com o botão de interrogação (?)
export default function CardGorduraVisceral({ nivel, classificacao }) {
  const [mostrarAjuda, setMostrarAjuda] = useState(false);

  // Cores dinâmicas com base no nível de risco
  const corBadge = nivel < 10 ? "#38a169" : nivel < 15 ? "#d69e2e" : "#e53e3e";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      {/* <h4 style={{ margin: 0, fontSize: '14px', color: '#4a5568', fontWeight: '600' }}>Gordura Visceral</h4> */}

      {/* Botão de Interrogação */}
      <div style={{ position: "relative", top: "-10px", left: "-7px" }}>
        <button
          onClick={() => setMostrarAjuda(!mostrarAjuda)}
          onMouseEnter={() => setMostrarAjuda(true)}
          onMouseLeave={() => setMostrarAjuda(false)}
          style={{
            background: "#edf2f7",
            border: "1px solid #cbd5e0",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#4a5568",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Clique para entender os níveis"
        >
          ?
        </button>

        {/* Caixa Explicativa (Tooltip / Popover) */}
        {mostrarAjuda && (
          <div
            style={{
              position: "absolute",
              right: "0",
              top: "30px",
              width: "260px",
              backgroundColor: "#1a365d",
              color: "#fff",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "12px",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              lineHeight: "1.4",
            }}
          >
            <p
              style={{
                margin: "0 0 6px 0",
                fontWeight: "bold",
                borderBottom: "1px solid #2c5282",
                paddingBottom: "4px",
              }}
            >
              O que é a Gordura Visceral?
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              É a gordura acumulada ao redor dos órgãos internos abdominais.
              Níveis elevados estão associados a maior risco de doenças
              metabólicas e cardiovasculares.
            </p>
            <ul style={{ margin: 0, paddingLeft: "15px" }}>
              <li>
                <strong>1 a 9:</strong> Saudável / Baixo risco
              </li>
              <li>
                <strong>10 a 14:</strong> Atenção (Elevada)
              </li>
              <li>
                <strong>15+:</strong> Risco Alto
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
