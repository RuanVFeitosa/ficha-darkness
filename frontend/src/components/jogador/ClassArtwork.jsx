import React, { useEffect, useState } from 'react';

export default function ClassArtwork({ classe }) {
  const [camadas, setCamadas] = useState([classe]);
  useEffect(() => {
    setCamadas(atuais => {
      const anterior = atuais[atuais.length - 1];
      return anterior.id === classe.id ? atuais : [anterior, classe];
    });
    const timer = setTimeout(() => setCamadas([classe]), 650);
    return () => clearTimeout(timer);
  }, [classe]);
  return <div className="classe-arte-transicao" aria-hidden="true">
    {camadas.map((camada,i) => <img key={camada.id} src={camada.imagem} alt="" decoding="async" className={`classe-bg-img ${i === camadas.length-1 ? 'classe-imagem-entrada' : 'classe-imagem-saida'}`}/>) }
  </div>;
}
