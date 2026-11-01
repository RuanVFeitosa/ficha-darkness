import React from 'react';
import { createPortal } from 'react-dom';
import '../../styles/HopeVoid.css';
export default function HopeVoid({resource,portrait=false}) {
 const current=Number(resource?.atual);
 if(resource?.atual==null || !Number.isFinite(current) || current>0)return null;
 const effect=<div className={`abs-hope-void${portrait ? ' is-portrait' : ''}`} aria-hidden="true"/>;
 return portrait ? effect : createPortal(effect,document.body);
}
