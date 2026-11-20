import React,{useState} from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import SheetThemeGallery,{PortraitThemeBackdrop} from './SheetThemeGallery';
import {sheetTheme} from '../../data/sheetThemes';

test('aplica temas e permite escolher bandeira e personalizar faixas',()=>{
 function Sheet(){const [sheet,setSheet]=useState({name:'Ana'});return <><SheetThemeGallery sheet={sheet} setSheet={setSheet}/><div data-testid="sheet">{JSON.stringify(sheet)}</div></>;}
 render(<Sheet/>);
 fireEvent.click(screen.getByRole('button',{name:'Aplicar tema Espiral'}));
 expect(JSON.parse(screen.getByTestId('sheet').textContent).themePreset).toBe('espiral');
 fireEvent.click(screen.getByRole('button',{name:'Orgulho LGBTQI+'}));
 fireEvent.click(screen.getByRole('button',{name:'Aplicar tema Transgênero'}));
 expect(JSON.parse(screen.getByTestId('sheet').textContent).themePreset).toBe('pride-trans');
 fireEvent.click(screen.getByRole('button',{name:'Aplicar tema Minha bandeira'}));
 fireEvent.change(screen.getByLabelText('Cor da faixa 1'),{target:{value:'#aa2255'}});
 expect(JSON.parse(screen.getByTestId('sheet').textContent).customPrideFlag[0]).toBe('#aa2255');
});
test('usa a imagem do Julgamento e a bandeira escolhida no fundo do retrato',()=>{
 const {container,rerender}=render(<PortraitThemeBackdrop theme={sheetTheme('ato-iii')}/>);
 expect(container.querySelector('img')).toHaveAttribute('src','/tema-ato-iii-julgamento.png');
 rerender(<PortraitThemeBackdrop theme={sheetTheme('pride-trans')}/>);
 expect(container.querySelector('svg')).toHaveAttribute('aria-label','Bandeira Transgênero');
});
