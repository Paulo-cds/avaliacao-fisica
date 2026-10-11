import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

const formatarDataBr = (dataString) => {
  if (!dataString) return '';
  const dataPartes = dataString.split('T')[0].split('-');
  if (dataPartes.length !== 3) return dataString;
  const [ano, mes, dia] = dataPartes;
  return `${dia}/${mes}/${ano}`;
};

export default function DashboardAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

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
          where("clienteId", "==", id)
        );
        const avaliacoesSnapshot = await getDocs(avaliacoesQuery);
        const listaAvaliacoes = avaliacoesSnapshot.docs.map(doc => doc.data());

        listaAvaliacoes.sort((a, b) => new Date(a.dataAval) - new Date(b.dataAval));
        setHistorico(listaAvaliacoes);
      } catch (error) {
        console.error("Erro ao carregar dados do aluno:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarDadosDoAluno();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>Carregando dados e histórico do aluno...</div>;
  }

  if (!aluno) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Aluno não encontrado.</div>;
  }

  if (historico.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '30px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h2 style={{ color: '#2b6cb0' }}>{aluno.nome}</h2>
        <p style={{ color: '#666' }}>Nenhuma avaliação física cadastrada para este aluno ainda.</p>
      </div>
    );
  }

  // Dados da última avaliação
  const ultimaAval = historico[historico.length - 1];
  const pesoAtual = parseFloat(ultimaAval.peso) || 0;
  const gorduraAtual = parseFloat(ultimaAval.percentualGordura) || 0;
  const massaMagraAtual = parseFloat(ultimaAval.massaMagra) || 0;
  const vo2Atual = parseFloat(ultimaAval.vo2Max) || 0;
  const paAtual = ultimaAval.pa || 'N/A';
  const oximetriaAtual = ultimaAval.oximetria || 'N/A';

  // Dados salvos de Gordura Visceral
  const visceralNivel = ultimaAval.gorduraVisceralNivel || 0;
  const visceralArea = ultimaAval.gorduraVisceralArea || 0;
  const visceralClassificacao = ultimaAval.gorduraVisceralClassificacao || 'Normal';

  // Gráfico de Rosca (Composição Atual)
  const dadosRosca = {
    labels: ['Massa Magra (kg)', 'Massa Gorda (kg)'],
    datasets: [{
      data: [massaMagraAtual, pesoAtual - massaMagraAtual],
      backgroundColor: ['#3182ce', '#e53e3e'],
      borderWidth: 2,
    }],
  };

  // Histórico
  const datas = historico.map(av => formatarDataBr(av.dataAval));
  const pesos = historico.map(av => parseFloat(av.peso) || 0);
  const percentualGorduras = historico.map(av => parseFloat(av.percentualGordura) || 0);
  const vo2Historico = historico.map(av => parseFloat(av.vo2Max) || 0);
  const flexoes = historico.map(av => parseFloat(av.flexaoBraco) || 0);
  const sentaLevantaHistorico = historico.map(av => parseFloat(av.sentaLevanta) || 0);
  const pranchaHistorico = historico.map(av => parseFloat(av.prancha) || 0);
  const cinturas = historico.map(av => parseFloat(av.cintura) || 0);
  const abdomens = historico.map(av => parseFloat(av.abdomen) || 0);
  const quadris = historico.map(av => parseFloat(av.quadril) || 0);

  // Gráficos
  const dadosEvolucaoCorporal = {
    labels: datas,
    datasets: [
      { label: 'Peso Total (kg)', data: pesos, borderColor: '#2b6cb0', backgroundColor: 'rgba(43, 108, 176, 0.2)', tension: 0.3, yAxisID: 'y' },
      { label: '% de Gordura (%)', data: percentualGorduras, borderColor: '#dd6b20', backgroundColor: 'rgba(221, 107, 32, 0.2)', tension: 0.3, yAxisID: 'y1' },
    ],
  };

  const opcoesEvolucaoCorporal = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Peso (kg)' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '% Gordura' } },
    },
    plugins: { legend: { position: 'bottom' } }
  };

  const dadosEvolucaoCircunferencias = {
    labels: datas,
    datasets: [
      { label: 'Cintura (cm)', data: cinturas, borderColor: '#e53e3e', backgroundColor: 'rgba(229, 62, 62, 0.2)', tension: 0.3 },
      { label: 'Abdômen (cm)', data: abdomens, borderColor: '#d69e2e', backgroundColor: 'rgba(214, 158, 46, 0.2)', tension: 0.3 },
      { label: 'Quadril (cm)', data: quadris, borderColor: '#3182ce', backgroundColor: 'rgba(49, 130, 206, 0.2)', tension: 0.3 },
    ],
  };

  const dadosEvolucaoVO2 = {
    labels: datas,
    datasets: [{ label: 'VO2max (ml/kg/min)', data: vo2Historico, borderColor: '#319795', backgroundColor: 'rgba(49, 151, 149, 0.2)', tension: 0.3 }],
  };

  const dadosEvolucaoForca = {
    labels: datas,
    datasets: [
      { label: 'Flexão (reps/1min)', data: flexoes, borderColor: '#38a169', backgroundColor: 'rgba(56, 161, 105, 0.2)', tension: 0.3 },
      { label: 'Senta/Levanta (30s)', data: sentaLevantaHistorico, borderColor: '#b7791f', backgroundColor: 'rgba(183, 121, 31, 0.2)', tension: 0.3 },
    ],
  };

  const dadosEvolucaoPrancha = {
    labels: datas,
    datasets: [{ label: 'Prancha Isométrica (segundos)', data: pranchaHistorico, borderColor: '#805ad5', backgroundColor: 'rgba(128, 90, 213, 0.2)', tension: 0.3 }],
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ color: '#1a365d', marginBottom: '5px' }}>Dashboard de Evolução: {aluno.nome}</h2>
      <p style={{ color: '#4a5568', marginBottom: '25px' }}>Sexo: {aluno.sexo === 'M' ? 'Masculino' : 'Feminino'} | Data de Nasc.: {formatarDataBr(aluno.dataNasc)}</p>

      {/* CARDS DE RESUMO (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={cardKpiStyle('#2b6cb0')}>
          <h4>Peso Atual</h4>
          <h2>{pesoAtual} kg</h2>
        </div>
        <div style={cardKpiStyle('#dd6b20')}>
          <h4>% de Gordura</h4>
          <h2>{gorduraAtual}%</h2>
        </div>
        <div style={cardKpiStyle(visceralNivel >= 10 ? '#e53e3e' : '#319795')}>
          <h4>Gordura Visceral</h4>
          <h2>Nível {visceralNivel}</h2>
        </div>
        <div style={cardKpiStyle('#319795')}>
          <h4>VO2max Atual</h4>
          <h2>{vo2Atual} <span style={{fontSize: '10px'}}>ml/kg/min</span></h2>
        </div>
      </div>

      {/* BANNER DE RISCO DE GORDURA VISCERAL */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '16px 20px',
        borderRadius: '8px',
        borderLeft: `6px solid ${visceralNivel >= 10 ? '#e53e3e' : '#38a169'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h4 style={{ margin: 0, color: '#2d3748', fontSize: '15px' }}>Indicador de Gordura Visceral e Saúde Metabólica</h4>
          <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '13px' }}>
            Área Visceral Estimada: <strong>{visceralArea} cm²</strong> | Cintura: <strong>{ultimaAval.cintura || 0} cm</strong>
          </p>
        </div>
        <div>
          <span style={{
            backgroundColor: visceralNivel >= 10 ? '#fed7d7' : '#c6f6d5',
            color: visceralNivel >= 10 ? '#9b2c2c' : '#22543d',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            {visceralClassificacao}
          </span>
        </div>
      </div>

      {/* CARD DE SINAIS VITAIS */}
      <div style={{ backgroundColor: '#ffffff', padding: '15px 20px', borderRadius: '8px', border: '1px solid #cbd5e0', marginBottom: '30px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Pressão Arterial (Repouso):</span>
          <strong style={{ fontSize: '18px', color: '#2d3748' }}>{paAtual} mmHg</strong>
        </div>
        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
          <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Oximetria (SpO2):</span>
          <strong style={{ fontSize: '18px', color: '#2d3748' }}>{oximetriaAtual}%</strong>
        </div>
        <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
          <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Última Avaliação:</span>
          <strong style={{ fontSize: '18px', color: '#2d3748' }}>{formatarDataBr(ultimaAval.dataAval)}</strong>
        </div>
      </div>

      {/* GRID DE GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Composição Corporal Atual (Siri)</h3>
          <div style={{ maxWidth: '260px', margin: '0 auto' }}>
            <Doughnut data={dadosRosca} />
          </div>
        </div>

        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Evolução de Peso e % de Gordura</h3>
          <Line data={dadosEvolucaoCorporal} options={opcoesEvolucaoCorporal} />
        </div>

        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Evolução de Circunferências (cm)</h3>
          <Line data={dadosEvolucaoCircunferencias} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Evolução Cardiorrespiratória (VO2max)</h3>
          <Line data={dadosEvolucaoVO2} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Resistência e Força Muscular</h3>
          <Line data={dadosEvolucaoForca} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

        <div style={graphContainerStyle}>
          <h3 style={graphTitleStyle}>Evolução da Prancha Isométrica (Core)</h3>
          <Line data={dadosEvolucaoPrancha} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>

      </div>
    </div>
  );
}

const cardKpiStyle = (borderColor) => ({
  backgroundColor: '#ffffff',
  padding: '15px',
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