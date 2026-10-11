import React from 'react';
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
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Registrando os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardAluno({ aluno, historico }) {
  if (!historico || historico.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <h3>Nenhuma avaliação cadastrada para {aluno.nome} ainda.</h3>
        <p>Cadastre uma avaliação acima para visualizar os gráficos de evolução.</p>
      </div>
    );
  }

  // Pegando a avaliação mais recente para os cartões de resumo
  const ultimaAval = historico[historico.length - 1];

  // Cálculo rápido estimado para exibição (ou você pode puxar direto se salvar na base)
  // Usando os dados salvos no Firebase:
  const pesoAtual = parseFloat(ultimaAval.peso) || 0;
  const flexaoAtual = parseFloat(ultimaAval.flexaoBraco) || 0;
  const pranchaAtual = parseFloat(ultimaAval.prancha) || 0;

  // Dados para o Gráfico de Rosca (Composição Corporal - Exemplo de proporção baseada no peso)
  // Se você calcular massa magra/gorda na hora ou salvar no Firebase, substitua aqui:
  const dadosRosca = {
    labels: ['Massa Magra (Est.)', 'Massa Gorda (Est.)'],
    datasets: [
      {
        data: [pesoAtual * 0.75, pesoAtual * 0.25], // Exemplo demonstrativo
        backgroundColor: ['#2ca02c', '#d62728'],
        borderWidth: 2,
      },
    ],
  };

  // Dados para o Gráfico de Linha (Evolução Histórica do Peso e Força)
  const datas = historico.map(av => av.dataAval);
  const pesos = historico.map(av => parseFloat(av.peso) || 0);
  const flexoes = historico.map(av => parseFloat(av.flexaoBraco) || 0);

  const dadosEvolucaoPeso = {
    labels: datas,
    datasets: [
      {
        label: 'Peso Total (kg)',
        data: pesos,
        borderColor: '#2b6cb0',
        backgroundColor: 'rgba(43, 108, 176, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const dadosEvolucaoForca = {
    labels: datas,
    datasets: [
      {
        label: 'Flexão de Braço (reps/1min)',
        data: flexoes,
        borderColor: '#38a169',
        backgroundColor: 'rgba(56, 161, 105, 0.2)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5', borderRadius: '10px' }}>
      <h2 style={{ color: '#1a365d', marginBottom: '5px' }}>Dashboard de Evolução: {aluno.nome}</h2>
      <p style={{ color: '#4a5568', marginBottom: '25px' }}>Acompanhamento dos resultados e histórico de avaliações físicas.</p>

      {/* CARDS DE RESUMO (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={cardKpiStyle('#2b6cb0')}>
          <h4>Peso Atual</h4>
          <h2>{pesoAtual} kg</h2>
        </div>
        <div style={cardKpiStyle('#38a169')}>
          <h4>Flexões (1 min)</h4>
          <h2>{flexaoAtual} reps</h2>
        </div>
        <div style={cardKpiStyle('#d69e2e')}>
          <h4>Prancha Isométrica</h4>
          <h2>{pranchaAtual} seg</h2>
        </div>
        <div style={cardKpiStyle('#805ad5')}>
          <h4>Total de Avaliações</h4>
          <h2>{historico.length}</h2>
        </div>
      </div>

      {/* GRID DE GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Gráfico 1: Rosca / Composição */}
        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Composição Corporal Atual</h3>
          <div style={{ maxWidth: '280px', margin: '0 auto' }}>
            <Doughnut data={dadosRosca} />
          </div>
        </div>

        {/* Gráfico 2: Evolução de Peso */}
        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Evolução do Peso Corporal (kg)</h3>
          <Line data={dadosEvolucaoPeso} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

        {/* Gráfico 3: Evolução de Força */}
        <div style={graphContainerStyle} style={{ ...graphContainerStyle, gridColumn: '1 / -1' }}>
          <h3 style={graphTitleStyle}>Evolução da Resistência Muscular (Flexão de Braço)</h3>
          <Line data={dadosEvolucaoForca} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

      </div>
    </div>
  );
}

// Estilos visuais limpos e modernos
const cardKpiStyle = (borderColor) => ({
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  borderLeft: `5px solid ${borderColor}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  textAlign: 'center'
});

const graphContainerStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  border: '1px solid #e2e8f0'
};

const graphTitleStyle = {
  fontSize: '16px',
  color: '#2d3748',
  marginBottom: '15px',
  textAlign: 'center',
  fontWeight: '600'
};