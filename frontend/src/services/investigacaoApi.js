import {executarAcaoMural} from './personagemApi';
import {SENHA_MESTRE} from '../constants/masterAccess';

export function muralClient({scope,id,codigo,mestre=false,members=[]}) {
 const auth=mestre?{masterPassword:SENHA_MESTRE}:{playerCode:codigo};
 return {
  load:()=>executarAcaoMural(scope,id,{...auth,action:'load',...(mestre?{members}: {})}),
  mutate:(version,action,data)=>executarAcaoMural(scope,id,{...auth,version,action,...data}),
 };
}
