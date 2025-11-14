import React from "react";
import "./TabelaClientes.css";

const TabelaClientes = ({ clientes = [], onEditar }) => {
  return (
    <div className="tabela-clientes-wrapper">
      <table className="tabela-clientes">
        <thead>
          <tr style={{ backgroundColor: "#181893" }}>
            <th style={{ fontSize: '16px', color: "white" }}>Cliente</th>
            <th style={{ fontSize: '16px', color: "white" }}>CNPJ</th>
            <th style={{ fontSize: '16px', color: "white" }}>Responsável</th>
            <th style={{ fontSize: '16px', color: "white" }}>Telefone</th>
            <th style={{ fontSize: '16px', color: "white" }}>E-mail</th>
            <th style={{ fontSize: '16px', color: "white", width: 120 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {(clientes || []).map((c) => (
            <tr key={c._id || `${c.cnpj}-${c.email}`}>
              <td>{c.cliente}</td>
              <td>{c.cnpj}</td>
              <td>{c.responsavel}</td>
              <td>{c.telefone}</td>
              <td>{c.email}</td>
              <td>
                <button className="botao" onClick={() => onEditar?.(c)}>Editar</button>
              </td>
            </tr>
          ))}
          {!clientes?.length && (
            <tr>
              <td colSpan={7} className="td-vazio">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaClientes;
