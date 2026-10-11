import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SistemaAvaliacao from './SistemaAvaliacao';
import DashboardAluno from './DashboardAluno';
//cod implantação - AKfycbzNetCzswFf7KGjy8m08ADZVagyi7Q-jK3goRDRRQIUYOJhk9MIHXke_28NL4wkIPhI
const AppAvaliacao = () => {
  return(
    <Router>
      {/* Barra de navegação global opcional */}
      <nav style={{ padding: '15px', backgroundColor: '#1a365d', color: '#fff', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Sistema de Avaliação Física</h2>
        <div style={{ marginTop: '10px' }}>
          <Link to="/" style={{ color: '#fff', marginRight: '15px', textDecoration: 'none' }}>Início / Alunos</Link>
        </div>
      </nav>

      {/* Definição das Rotas */}
      <div style={{ padding: '0 20px' }}>
        <Routes>
          {/* Rota inicial: Lista de Alunos */}
          <Route path="/" element={<SistemaAvaliacao />} />

          {/* Rota para o Dashboard do Aluno recebendo o ID por parâmetro (:id) */}
          <Route path="/aluno/:id/dashboard" element={<DashboardAluno />} />

          {/* Rota de fallback caso digitem um endereço inexistente */}
          <Route path="*" element={<h2 style={{ textAlign: 'center', color: 'red' }}>Página não encontrada</h2>} />
        </Routes>
      </div>
    </Router>
    
  )
}

export default AppAvaliacao;
