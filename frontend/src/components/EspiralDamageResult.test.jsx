import React from 'react';
import { render, screen } from '@testing-library/react';
import EspiralDamageResult from './EspiralDamageResult';

test.each([[0, 'Sem lesão'], [1, 'Lesão Superficial'], [3, 'Lesão Superficial'], [4, 'Lesão Moderada'], [6, 'Lesão Moderada'], [7, 'Lesão Grave'], [9, 'Lesão Grave'], [10, 'Lesão Crítica'], [12, 'Lesão Crítica'], [13, 'Lesão Catastrófica / Fatal']])('dano %s mostra %s', (damage, label) => {
  render(<EspiralDamageResult damage={damage} />);
  expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
});
