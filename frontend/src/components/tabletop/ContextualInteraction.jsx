import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Box3,Vector3,Raycaster,Vector2,BoxHelper} from 'three';
import {nearInteraction} from '../../utils/tabletopExploration';
import {mapCollisionMeshes} from '../../utils/tabletopCollision';
import {closedDoorBounds,doorStateKey} from '../../utils/tabletopDoors';
export default function ContextualInteraction({enabled,position,height=.65,elevation=0,onHint,onDoor,onClue,getPose}) {
 const {camera,scene}=useThree(),last=useRef(null),helper=useRef(null),elapsed=useRef(0),action=useRef(null);
 const callbacks=useRef({onDoor,onClue});callbacks.current={onDoor,onClue};
 useEffect(()=>{
 const key=event=>{if(event.code!=='KeyE' || event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target?.closest?.('input,textarea,select,button,[contenteditable=true]'))return;if(enabled&&action.current){event.preventDefault();action.current();}};
 window.addEventListener('keydown',key);
 return ()=>{window.removeEventListener('keydown',key);onHint(null);if(helper.current){scene.remove(helper.current);helper.current.dispose();helper.current=null;}};
 },[enabled,scene,onHint]);
 useFrame((_,delta)=>{
 elapsed.current+=delta;if(elapsed.current<.1)return;elapsed.current=0;
 let candidate=null;
 if(enabled&&position){
 scene.updateMatrixWorld();
 const ray=new Raycaster();ray.setFromCamera(new Vector2(0,0),camera);
 // Include annotations, whose geometry deliberately has no physical collision.
 const objects=[...mapCollisionMeshes(scene)];
 scene.traverse(node=>{if(node.userData?.tabletopClue && node.visible)objects.push(node);});
 const hits=ray.intersectObjects(objects,true);
 for(const hit of hits){
 let node=hit.object,door=null,clue=null,instance=null,visible=true;
 while(node){if(node.visible===false)visible=false;if(node.userData?.tabletopDoorId)door=node;if(node.userData?.tabletopClue)clue=node;if(node.userData?.tabletopInstanceId)instance=node.userData.tabletopInstanceId;node=node.parent;}
 if(!visible)continue;
 if(!door&&!clue)break;
 const object=door || clue,center=new Box3().setFromObject(object).getCenter(new Vector3());
 const pose=getPose?.(),feet=pose?.position||position;
 if(nearInteraction([feet[0],(pose?.elevation??elevation)+height*.6,feet[1]],center.toArray(),height)){
 const id=door ? doorStateKey(instance,door.userData.tabletopDoorId) : instance;
 candidate={id,object,label:door?'Abrir / fechar porta':'Examinar pista',run:()=>door?callbacks.current.onDoor(id,closedDoorBounds(door)):callbacks.current.onClue(clue.userData.tabletopClue)};
 }
 break;
 }
 }
 action.current=candidate?.run || null;
 if(last.current!==candidate?.id){
 last.current=candidate?.id;
 if(helper.current){scene.remove(helper.current);helper.current.dispose();helper.current=null;}
 if(candidate){helper.current=new BoxHelper(candidate.object,0xffffff);helper.current.userData.mapCollision=false;helper.current.raycast=()=>null;scene.add(helper.current);}
 onHint(candidate?{label:candidate.label,interact:candidate.run}:null);
 }
 helper.current?.update();
 });
 return null;
}
