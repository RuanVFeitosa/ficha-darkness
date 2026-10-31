import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {revealedByUV,uvVisibilityTools} from './uvVisibility.js';

function setup(){
 const scene=new THREE.Scene();
 const holder=new THREE.Group();scene.add(holder);
 const light=new THREE.SpotLight('#a46bff',35,18,Math.PI/18);light.userData.uvLight=true;
 light.position.set(0,0,0);light.target.position.set(0,0,-10);holder.add(light,light.target);
 const clue=new THREE.Group();clue.position.set(2,0,-5);clue.visible=false;
 clue.add(new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));
 scene.add(clue);
 return {scene,holder,light,clue,tools:uvVisibilityTools()};
}
test('reveals hidden text when UV hits an edge even if its center is outside the beam',()=>{
 const {scene,clue,tools}=setup();
 assert.equal(revealedByUV(clue,scene,tools),true);
 clue.position.x=10;assert.equal(revealedByUV(clue,scene,tools),false);
});
test('opaque wall blocks UV but normal light, hidden lights and out-of-range UV do not reveal',()=>{
 const {scene,holder,light,clue,tools}=setup();
 const wall=new THREE.Mesh(new THREE.BoxGeometry(10,4,.2),new THREE.MeshBasicMaterial());wall.position.set(1,0,-2.5);scene.add(wall);
 assert.equal(revealedByUV(clue,scene,tools),false);
 scene.remove(wall);light.userData.uvLight=false;
 assert.equal(revealedByUV(clue,scene,tools),false);
 light.userData.uvLight=true;holder.visible=false;
 assert.equal(revealedByUV(clue,scene,tools),false);
 holder.visible=true;light.distance=2;
 assert.equal(revealedByUV(clue,scene,tools),false);
 light.distance=18;assert.equal(revealedByUV(clue,scene,tools),true);
});
