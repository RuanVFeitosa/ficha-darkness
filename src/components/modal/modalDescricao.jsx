// src/components/ModalDescricao.jsx
import React from 'react';
import './ModalDescricao.css';

const ModalDescricao = ({ isOpen, onClose, titulo, descricao }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-titulo">{titulo}</h3>
          <button className="modal-fechar" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-descricao">{descricao}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-fechar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDescricao;