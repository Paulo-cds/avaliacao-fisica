import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FormularioAvaliacao({ alunoSelecionado, onAvaliacaoSalva }) {
  const initialAvaliacaoState = {
    dataAval: new Date().toISOString().split('T')[0],
    peso: '',
    estatura: '',
    cintura: '',
    abdomen: '',
    quadril: '',
    peitoral: '',
    axilar: '',
    triceps: '',
    subescapular: '',
    abdominal: '',
    suprailiaca: '',
    coxa: '',
    pa: '',
    oximetria: '',
    fcRepouso: '',
    fcMaxAtg: '',
    velFinal: '',
    flexaoBraco: '',
    sentaLevanta: '',
    prancha: ''
  };

  const [avaliacao, setAvaliacao] = useState(initialAvaliacaoState);
  const [loading, setLoading] = useState(false);

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
    const vo2max = (3.5 * velMmin) + 3.5;
    return parseFloat(vo2max.toFixed(1));
  };

  const calcularGorduraVisceral = (sexo, idade, cinturaCm, pesoKg, estaturaCm) => {
    const cintura = parseFloat(cinturaCm) || 0;
    const peso = parseFloat(pesoKg) || 0;
    const estaturaM = (parseFloat(estaturaCm) || 0) / 100;

    if (cintura <= 0 || peso <= 0 || estaturaM <= 0) {
      return { gorduraVisceralArea: 0, gorduraVisceralNivel: 0, gorduraVisceralClassificacao: 'N/A' };
    }

    const imc = peso / (estaturaM * estaturaM);
    let areaVisceral = sexo === 'M' ? (1.33 * cintura) + (0.33 * idade) + (1.2 * imc) - 110 : (1.15 * cintura) + (0.28 * idade) + (1.0 * imc) - 95;

    areaVisceral = Math.max(10, parseFloat(areaVisceral.toFixed(1)));
    const nivelVisceral = Math.round(areaVisceral / 10);

    let classificacao = 'Saudável';
    if (nivelVisceral >= 10 && nivelVisceral <= 14) classificacao = 'Atenção (Elevada)';
    else if (nivelVisceral >= 15) classificacao = 'Risco Alto';

    return { gorduraVisceralArea: areaVisceral, gorduraVisceralNivel: nivelVisceral, gorduraVisceralClassificacao: classificacao };
  };

  const calcularResultadosAntropometricos = () => {
    const sexo = alunoSelecionado.sexo || 'M';
    const idade = calcularIdade(alunoSelecionado.dataNasc);
    const pesoKg = parseFloat(avaliacao.peso) || 0;
    const estaturaCm = parseFloat(avaliacao.estatura) || 0;
    const cinturaCm = parseFloat(avaliacao.cintura) || 0;

    const somaDobras = 
      parseFloat(avaliacao.peitoral || 0) + parseFloat(avaliacao.axilar || 0) +
      parseFloat(avaliacao.triceps || 0) + parseFloat(avaliacao.subescapular || 0) +
      parseFloat(avaliacao.abdominal || 0) + parseFloat(avaliacao.suprailiaca || 0) +
      parseFloat(avaliacao.coxa || 0);

    let densidadeCorporal = sexo === 'M' ? 
      1.11200000 - (0.00043499 * somaDobras) + (0.00000055 * Math.pow(somaDobras, 2)) - (0.00028826 * idade) :
      1.09700000 - (0.00046971 * somaDobras) + (0.00000056 * Math.pow(somaDobras, 2)) - (0.00012828 * idade);

    const percentualGordura = densidadeCorporal > 0 ? ((4.95 / densidadeCorporal) - 4.5) * 100 : 0;
    const massaGorda = pesoKg * (percentualGordura / 100);
    const massaMagra = pesoKg - massaGorda;
    const vo2MaxCalculado = calcularVO2Max(avaliacao.velFinal);
    const dadosVisceral = calcularGorduraVisceral(sexo, idade, cinturaCm, pesoKg, estaturaCm);

    return {
      idadeNoMomento: idade,
      somaDobras: parseFloat(somaDobras.toFixed(1)),
      densidadeCorporal: parseFloat(densidadeCorporal.toFixed(4)),
      percentualGordura: parseFloat(percentualGordura.toFixed(2)),
      massaGorda: parseFloat(massaGorda.toFixed(2)),
      massaMagra: parseFloat(massaMagra.toFixed(2)),
      vo2Max: vo2MaxCalculado,
      ...dadosVisceral
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alunoSelecionado) return alert('Nenhum aluno selecionado!');

    setLoading(true);
    try {
      const resultadosCalculados = calcularResultadosAntropometricos();
      await addDoc(collection(db, "avaliacoes"), {
        clienteId: alunoSelecionado.id,
        ...avaliacao,
        ...resultadosCalculados,
        criadoEm: serverTimestamp()
      });

      alert('Avaliação salva com sucesso!');
      setAvaliacao(initialAvaliacaoState);
      if (onAvaliacaoSalva) onAvaliacaoSalva();
    } catch (error) {
      console.error("Erro ao salvar avaliação: ", error);
      alert('Erro ao salvar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: '#2b6cb0', marginTop: 0, fontSize: '1.1rem' }}>Nova Avaliação: {alunoSelecionado.nome}</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div>
          <h4 style={sectionTitleStyle}>1. Dados da Medição</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Data:</label>
              <input type="date" value={avaliacao.dataAval} onChange={e => setAvaliacao({...avaliacao, dataAval: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Peso (kg):</label>
              <input type="number" step="0.1" value={avaliacao.peso} onChange={e => setAvaliacao({...avaliacao, peso: e.target.value})} style={inputStyle} placeholder="80.0" required />
            </div>
            <div>
              <label style={labelStyle}>Estatura (cm):</label>
              <input type="number" value={avaliacao.estatura} onChange={e => setAvaliacao({...avaliacao, estatura: e.target.value})} style={inputStyle} placeholder="178" required />
            </div>
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>2. Circunferências (cm)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Cintura:</label>
              <input type="number" step="0.1" value={avaliacao.cintura} onChange={e => setAvaliacao({...avaliacao, cintura: e.target.value})} style={inputStyle} placeholder="cm" required />
            </div>
            <div>
              <label style={labelStyle}>Abdômen:</label>
              <input type="number" step="0.1" value={avaliacao.abdomen} onChange={e => setAvaliacao({...avaliacao, abdomen: e.target.value})} style={inputStyle} placeholder="cm" />
            </div>
            <div>
              <label style={labelStyle}>Quadril:</label>
              <input type="number" step="0.1" value={avaliacao.quadril} onChange={e => setAvaliacao({...avaliacao, quadril: e.target.value})} style={inputStyle} placeholder="cm" />
            </div>
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>3. Dobras Cutâneas (mm)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))', gap: '8px' }}>
            {['peitoral', 'axilar', 'triceps', 'subescapular', 'abdominal', 'suprailiaca', 'coxa'].map(dobra => (
              <div key={dobra}>
                <label style={{ ...labelStyle, textTransform: 'capitalize', fontSize: '0.8rem' }}>{dobra}:</label>
                <input type="number" step="0.1" value={avaliacao[dobra]} onChange={e => setAvaliacao({...avaliacao, [dobra]: e.target.value})} style={inputStyle} placeholder="mm" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>4. Sinais Vitais & Esteira</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>PA (Repouso):</label>
              <input type="text" value={avaliacao.pa} onChange={e => setAvaliacao({...avaliacao, pa: e.target.value})} style={inputStyle} placeholder="120/80" />
            </div>
            <div>
              <label style={labelStyle}>SpO2 (%):</label>
              <input type="number" value={avaliacao.oximetria} onChange={e => setAvaliacao({...avaliacao, oximetria: e.target.value})} style={inputStyle} placeholder="98" />
            </div>
            <div>
              <label style={labelStyle}>FC Máx Esteira:</label>
              <input type="number" value={avaliacao.fcMaxAtg} onChange={e => setAvaliacao({...avaliacao, fcMaxAtg: e.target.value})} style={inputStyle} placeholder="bpm" />
            </div>
            <div>
              <label style={labelStyle}>Vel. Final (km/h):</label>
              <input type="number" step="0.1" value={avaliacao.velFinal} onChange={e => setAvaliacao({...avaliacao, velFinal: e.target.value})} style={inputStyle} placeholder="km/h" />
            </div>
          </div>
        </div>

        <div>
          <h4 style={sectionTitleStyle}>5. Testes de Força Funcional</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Flexão (1min):</label>
              <input type="number" value={avaliacao.flexaoBraco} onChange={e => setAvaliacao({...avaliacao, flexaoBraco: e.target.value})} style={inputStyle} placeholder="reps" />
            </div>
            <div>
              <label style={labelStyle}>Senta/Levanta:</label>
              <input type="number" value={avaliacao.sentaLevanta} onChange={e => setAvaliacao({...avaliacao, sentaLevanta: e.target.value})} style={inputStyle} placeholder="reps" />
            </div>
            <div>
              <label style={labelStyle}>Prancha (seg):</label>
              <input type="number" value={avaliacao.prancha} onChange={e => setAvaliacao({...avaliacao, prancha: e.target.value})} style={inputStyle} placeholder="seg" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={submitBtnStyle}>
          {loading ? 'Calculando e Salvando...' : 'Salvar Avaliação Completa'}
        </button>
      </form>
    </div>
  );
}

const sectionTitleStyle = { margin: '0 0 8px 0', color: '#4a5568', fontSize: '0.95rem', borderBottom: '1px solid #cbd5e0', paddingBottom: '3px' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '0.95rem' };
const labelStyle = { fontSize: '0.85rem', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '3px' };
const submitBtnStyle = { background: '#2ca02c', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', width: '100%', marginTop: '5px' };