import React from 'react';
import {render,screen} from '@testing-library/react';
import Diff from './AbilityEditDiff';
test('resumo mostra localização e alteração, sem repetir conteúdo intacto',()=>{render(<Diff current={{nome:'A',paginas:[{titulo:'Regras',conteudo:'Texto intacto\nDano 5\nOutro trecho intacto'}]}} proposal={{nome:'A',paginas:[{titulo:'Regras',conteudo:'Texto intacto\nDano 10\nOutro trecho intacto'}]}}/>);expect(screen.getByText('Página 1 · Regras')).toBeInTheDocument();expect(screen.getByText('+ Adicionado')).toBeInTheDocument();expect(screen.getByText('− Removido')).toBeInTheDocument();expect(screen.queryByText(/Texto intacto/)).toBeNull();expect(screen.getByText('10')).toBeInTheDocument();});
