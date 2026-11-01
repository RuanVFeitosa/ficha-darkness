import React from 'react';
export default function RollDieOutline({sides=6}){
 return <svg className="abs-roll-die-outline" viewBox="0 0 100 100" aria-hidden="true"><polygon points={sides===4?'50,7 95,88 5,88':sides===6?'20,12 80,12 92,24 92,80 80,92 20,92 8,80 8,24':'50,4 94,28 94,74 50,97 6,74 6,28'}/>{sides!==6&&sides!==4&&<path d="M50 4 24 70 76 70 50 4 M6 28 24 70 50 97 76 70 94 28"/>}</svg>;
}
