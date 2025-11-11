import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './VisualizarLogs.css';

const VisualizarLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/logs`);
        setLogs(response.data);
      } catch (error) {
        console.error('Erro ao buscar logs:', error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="logs-container">
      <h2>Logs de Atividades</h2>
      <table className="logs-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Data e Hora</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{log.usuario}</td>
              <td>{log.acao}</td>
              <td>{new Date(log.dataHora).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VisualizarLogs;
