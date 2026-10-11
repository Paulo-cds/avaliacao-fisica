import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import AppAvaliacao from './AppAvaliacao';

const root = ReactDOM.createRoot(document.getElementById('root'));

export const formatarDataBr = (dataString) => {
  if (!dataString) return '';
  const partes = dataString.split('-');
  if (partes.length !== 3) return dataString; // Retorna original se não estiver no formato AAAA-MM-DD
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

root.render(
  <React.StrictMode>
    <AppAvaliacao />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
