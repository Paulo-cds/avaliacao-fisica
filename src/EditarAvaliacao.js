import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditarAvaliacaoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [avaliacao, setAvaliacao] = useState(null);
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregarAvaliacaoECliente = async () => {
      try {
        const avDocRef = doc(db, "avaliacoes", id);
        const avSnap = await getDoc(avDocRef);

        if (!avSnap.exists()) {
          alert("Avaliação não encontrada!");
          navigate(-1);
          return;
        }

        const avData = { id: avSnap.id, ...avSnap.data() };
        setAvaliacao(avData);

        if (avData.clienteId) {
          const clienteDocRef = doc(db, "clientes", avData.clienteId);
          const clienteSnap = await getDoc(clienteDocRef);
          if (clienteSnap.exists()) {
            setAluno({ id: clienteSnap.id, ...clienteSnap.data() });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarAvaliacaoECliente();
  }, [id, navigate]);

  const handleImageUpload = (e, campoFoto) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvaliacao(prev => ({ ...prev, [campoFoto]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return 30;
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

  const calcularVO2Max = (velFinalKmH) => {
    const vel = parseFloat(velFinalKmH) || 0;
    if (vel <= 0) return 0;
    return parseFloat(((3.5 * (vel * 16.67)) + 3.5).toFixed(1));
  };

  const calcularGorduraVisceral = (sexo, idade, cinturaCm, pesoKg, estaturaCm) => {
    const cintura = parseFloat(cinturaCm) || 0;
    const peso = parseFloat(pesoKg) || 0;
    const estaturaM = (parseFloat(estaturaCm) || 0) / 100;

    if (cintura <= 0 || peso <= 0 || estaturaM <= 0) {
      return { gorduraVisceralArea: 0, gorduraVisceralNivel: 0, gorduraVisceralClassificacao: 'N/A' };
    }

    const imc = peso / (estaturaM * estaturaM);
    let areaVisceral = sexo === 'M' 
      ? (1.33 * cintura) + (0.33 * idade) + (1.2 * imc) - 110 
      : (1.15 * cintura) + (0.28 * idade) + (1.0 * imc) - 95;

    areaVisceral = Math.max(10, parseFloat(areaVisceral.toFixed(1)));
    const nivelVisceral = Math.round(areaVisceral / 10);

    let classificacao = 'Saudável';
    if (nivelVisceral >= 10 && nivelVisceral <= 14) classificacao = 'Atenção (Elevada)';
    else if (nivelVisceral >= 15) classificacao = 'Risco Alto';

    return { gorduraVisceralArea: areaVisceral, gorduraVisceralNivel: nivelVisceral, gorduraVisceralClassificacao: classificacao };
  };

  // RECALCULA TODAS AS MÉTRICAS MATEMÁTICAS ANTES DE SALVAR
  const recalcularResultados = () => {
    const sexo = aluno?.sexo || 'M';
    const idade = calcularIdade(aluno?.dataNasc);
    const pesoKg = parseFloat(avaliacao.peso) || 0;
    const estaturaCm = parseFloat(avaliacao.estatura) || 0;
    const cinturaCm = parseFloat(avaliacao.cintura) || 0;

    let somaDobras = 0;
    let densidadeCorporal = 0;

    if (sexo === 'M') {
      somaDobras = (parseFloat(avaliacao.peitoral) || 0) + (parseFloat(avaliacao.abdominal) || 0) + (parseFloat(avaliacao.coxa) || 0);
      densidadeCorporal = 1.10938 - (0.0008267 * somaDobras) + (0.0000016 * Math.pow(somaDobras, 2)) - (0.0002574 * idade);
    } else {
      somaDobras = (parseFloat(avaliacao.triceps) || 0) + (parseFloat(avaliacao.suprailiaca) || 0) + (parseFloat(avaliacao.coxa) || 0);
      densidadeCorporal = 1.0994921 - (0.0009929 * somaDobras) + (0.0000023 * Math.pow(somaDobras, 2)) - (0.0001392 * idade);
    }

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      // 1. Recalcula tudo automaticamente
      const novosResultados = recalcularResultados();
      const docRef = doc(db, "avaliacoes", id);

      // 2. Envia os dados editados + os resultados recalculados para o Firebase
      await updateDoc(docRef, {
        ...avaliacao,
        ...novosResultados
      });

      alert('Avaliação recalculada e atualizada com sucesso!');
      navigate(-1);
    } catch (error) {
      console.error("Erro ao atualizar avaliação: ", error);
      alert('Erro ao atualizar avaliação.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>Carregando dados da avaliação...</div>;
  }

  const sexoAluno = aluno?.sexo || 'M';

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #cbd5e0', fontFamily: 'Segoe UI, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: '#edf2f7', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
            ← Voltar
          </button>
          <h2 style={{ color: '#1a365d', margin: 0 }}>Editar Avaliação: {aluno?.nome}</h2>
        </div>
      </div>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        
        {/* 1. Dados Básicos e Fotos */}
        <div>
          <h4 style={sectionTitleStyle}>1. Dados da Medição e Fotos</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>Data:</label>
              <input type="date" value={avaliacao.dataAval || ''} onChange={e => setAvaliacao({...avaliacao, dataAval: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Peso (kg):</label>
              <input type="number" step="0.1" value={avaliacao.peso || ''} onChange={e => setAvaliacao({...avaliacao, peso: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Estatura (cm):</label>
              <input type="number" value={avaliacao.estatura || ''} onChange={e => setAvaliacao({...avaliacao, estatura: e.target.value})} style={inputStyle} required />
            </div>
          </div>

          <div style={{ background: '#edf2f7', padding: '12px', borderRadius: '6px', border: '1px dashed #cbd5e0' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', display: 'block', marginBottom: '8px' }}>
              📸 Atualizar Fotos:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <div>
                <label style={subLabelStyle}>Frente:</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'fotoFrente')} style={{ fontSize: '0.75rem', width: '100%' }} />
                {avaliacao.fotoFrente && <span style={{ color: '#38a169', fontSize: '0.75rem' }}>✔ Foto ativa</span>}
              </div>
              <div>
                <label style={subLabelStyle}>Perfil:</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'fotoPerfil')} style={{ fontSize: '0.75rem', width: '100%' }} />
                {avaliacao.fotoPerfil && <span style={{ color: '#38a169', fontSize: '0.75rem' }}>✔ Foto ativa</span>}
              </div>
              <div>
                <label style={subLabelStyle}>Costas:</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'fotoCostas')} style={{ fontSize: '0.75rem', width: '100%' }} />
                {avaliacao.fotoCostas && <span style={{ color: '#38a169', fontSize: '0.75rem' }}>✔ Foto ativa</span>}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Circunferências */}
        <div>
          <h4 style={sectionTitleStyle}>2. Circunferências (cm)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Cintura:</label>
              <input type="number" step="0.1" value={avaliacao.cintura || ''} onChange={e => setAvaliacao({...avaliacao, cintura: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Abdômen:</label>
              <input type="number" step="0.1" value={avaliacao.abdomen || ''} onChange={e => setAvaliacao({...avaliacao, abdomen: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quadril:</label>
              <input type="number" step="0.1" value={avaliacao.quadril || ''} onChange={e => setAvaliacao({...avaliacao, quadril: e.target.value})} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* 3. Dobras Cutâneas */}
        <div>
          <h4 style={sectionTitleStyle}>3. Dobras Cutâneas (mm)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
            {sexoAluno === 'M' ? (
              <>
                <div>
                  <label style={labelStyle}>Peitoral:</label>
                  <input type="number" step="0.1" value={avaliacao.peitoral || ''} onChange={e => setAvaliacao({...avaliacao, peitoral: e.target.value})} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Abdômen:</label>
                  <input type="number" step="0.1" value={avaliacao.abdominal || ''} onChange={e => setAvaliacao({...avaliacao, abdominal: e.target.value})} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Coxa:</label>
                  <input type="number" step="0.1" value={avaliacao.coxa || ''} onChange={e => setAvaliacao({...avaliacao, coxa: e.target.value})} style={inputStyle} required />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Tríceps:</label>
                  <input type="number" step="0.1" value={avaliacao.triceps || ''} onChange={e => setAvaliacao({...avaliacao, triceps: e.target.value})} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Supra-ilíaca:</label>
                  <input type="number" step="0.1" value={avaliacao.suprailiaca || ''} onChange={e => setAvaliacao({...avaliacao, suprailiaca: e.target.value})} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Coxa:</label>
                  <input type="number" step="0.1" value={avaliacao.coxa || ''} onChange={e => setAvaliacao({...avaliacao, coxa: e.target.value})} style={inputStyle} required />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. Sinais Vitais e Esteira */}
        <div>
          <h4 style={sectionTitleStyle}>4. Sinais Vitais e Esteira</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>PA (Repouso):</label>
              <input type="text" value={avaliacao.pa || ''} onChange={e => setAvaliacao({...avaliacao, pa: e.target.value})} style={inputStyle} placeholder="120/80" />
            </div>
            <div>
              <label style={labelStyle}>SpO2 (%):</label>
              <input type="number" value={avaliacao.oximetria || ''} onChange={e => setAvaliacao({...avaliacao, oximetria: e.target.value})} style={inputStyle} placeholder="98" />
            </div>
            <div>
              <label style={labelStyle}>FC Máx Esteira:</label>
              <input type="number" value={avaliacao.fcMaxAtg || ''} onChange={e => setAvaliacao({...avaliacao, fcMaxAtg: e.target.value})} style={inputStyle} placeholder="bpm" />
            </div>
            <div>
              <label style={labelStyle}>Vel. Final (km/h):</label>
              <input type="number" step="0.1" value={avaliacao.velFinal || ''} onChange={e => setAvaliacao({...avaliacao, velFinal: e.target.value})} style={inputStyle} placeholder="km/h" />
            </div>
          </div>
        </div>

        {/* 5. Testes de Força Funcional (INCLUÍDOS AGORA) */}
        <div>
          <h4 style={sectionTitleStyle}>5. Testes de Força Funcional</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Flexão (1min):</label>
              <input type="number" value={avaliacao.flexaoBraco || ''} onChange={e => setAvaliacao({...avaliacao, flexaoBraco: e.target.value})} style={inputStyle} placeholder="reps" />
            </div>
            <div>
              <label style={labelStyle}>Senta/Levanta:</label>
              <input type="number" value={avaliacao.sentaLevanta || ''} onChange={e => setAvaliacao({...avaliacao, sentaLevanta: e.target.value})} style={inputStyle} placeholder="reps" />
            </div>
            <div>
              <label style={labelStyle}>Prancha (seg):</label>
              <input type="number" value={avaliacao.prancha || ''} onChange={e => setAvaliacao({...avaliacao, prancha: e.target.value})} style={inputStyle} placeholder="seg" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={salvando} style={submitBtnStyle}>
          {salvando ? 'Recalculando e Salvando...' : 'Salvar Alterações da Avaliação'}
        </button>
      </form>
    </div>
  );
}

const sectionTitleStyle = { margin: '0 0 8px 0', color: '#4a5568', fontSize: '1rem', borderBottom: '1px solid #cbd5e0', paddingBottom: '4px' };
const inputStyle = { padding: '9px', borderRadius: '6px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '0.95rem' };
const labelStyle = { fontSize: '0.85rem', fontWeight: '500', color: '#4a5568', display: 'block', marginBottom: '3px' };
const subLabelStyle = { fontSize: '0.8rem', color: '#4a5568', display: 'block', marginBottom: '2px' };
const submitBtnStyle = { background: '#3182ce', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', width: '100%', marginTop: '10px' };