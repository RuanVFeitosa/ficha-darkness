import React from 'react';

export default function PlayerViewSettings({master,children}) {
 if(master)return <div className="tt3-session-meta">{children}</div>;
 return <details className="tt3-player-settings"><summary>Ajustes de visão <span aria-hidden="true">⌄</span></summary><div className="tt3-session-meta">{children}<p className="tt3-player-controls-help">WASD · mover<br/>Arrastar · olhar ao redor<br/>Roda · aproximar<br/>H · ocultar interface</p></div></details>;
}
