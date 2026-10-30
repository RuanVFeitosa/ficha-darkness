import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import '../../styles/NumberInput.css';

// Setas desenhadas com a cor do tema, sem a caixa nativa do navegador.
const NumberInput = forwardRef(function NumberInput({ hideArrows = false, ...props }, forwardedRef) {
  const inputRef = useRef(null);
  useImperativeHandle(forwardedRef, () => inputRef.current);
  const ajustar = direcao => {
    const input = inputRef.current;
    if (!input || input.disabled || input.readOnly) return;
    input.focus();
    const anterior = input.value;
    try { direcao > 0 ? input.stepUp() : input.stepDown(); } catch { return; }
    const proximo = input.value;
    if (proximo === anterior) return;
    // React acompanha o setter do campo; publique uma alteração nativa real.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, anterior);
    setter.call(input, proximo);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  return <span className={`themed-number-input${hideArrows ? '' : ' has-number-arrows'}`}>
    <input {...props} type="number" ref={inputRef}/>
    {!hideArrows && <span className="themed-number-arrows">
      <button type="button" aria-label="Aumentar valor" tabIndex={-1} disabled={props.disabled || props.readOnly} onMouseDown={e => e.preventDefault()} onClick={() => ajustar(1)}><svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 5 5 1 9 5"/></svg></button>
      <button type="button" aria-label="Diminuir valor" tabIndex={-1} disabled={props.disabled || props.readOnly} onMouseDown={e => e.preventDefault()} onClick={() => ajustar(-1)}><svg viewBox="0 0 10 6" aria-hidden="true"><path d="m1 1 4 4 4-4"/></svg></button>
    </span>}
  </span>;
});
export default NumberInput;
