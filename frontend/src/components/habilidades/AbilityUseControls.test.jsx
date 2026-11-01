import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import AbilityUseControls from './AbilityUseControls';
test('card mostra custo, usa uma vez por clique e comunica resultado',async()=>{
 const onUse=jest.fn().mockResolvedValue({});
 render(<AbilityUseControls habilidade={{nome:'Foco',custo:'4 PE'}} personagem={{esperanca:{atual:3}}} onUse={onUse}/>);
 expect(screen.getByText('2 PE')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Usar Foco'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Usar Foco'})).toBeEnabled());
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
 expect(onUse).toHaveBeenCalledTimes(1);
});

test('efeito ativo permite desativar mesmo sem PE e não cobra outro uso',async()=>{
 const onUse=jest.fn(),onDeactivate=jest.fn().mockResolvedValue({});
 render(<AbilityUseControls habilidade={{nome:'Foco',custo:'4 PE'}} personagem={{esperanca:{atual:0},efeitosHabilidadesAtivos:[{id:'efeito-1',idUso:'habilidade:Foco'}]}} onUse={onUse} onDeactivate={onDeactivate}/>);
 const button=screen.getByRole('button',{name:'Desativar Foco'});
 expect(button).toBeEnabled();fireEvent.click(button);
 await waitFor(()=>expect(onDeactivate).toHaveBeenCalledWith('efeito-1'));
 expect(onUse).not.toHaveBeenCalled();
 expect(screen.queryByText(/Uso registrado/)).not.toBeInTheDocument();
});
test('bloqueia saldo insuficiente e passivas',()=>{
 const {rerender}=render(<AbilityUseControls habilidade={{nome:'Foco',custo:'4 PE'}} personagem={{esperanca:{atual:1}}}/>);
 expect(screen.getByRole('button',{name:'Usar Foco'})).toBeDisabled();
 rerender(<AbilityUseControls habilidade={{nome:'Sempre',custo:'Passiva'}} personagem={{esperanca:{atual:0}}}/>);
 expect(screen.getByText('Sempre ativa')).toBeDisabled();
});
