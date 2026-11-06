import {DoubleSide} from 'three';

const VINTAGE_HOUSE_SOURCE='5a9e087fbd3a4ae79b4c51d6279f0466';
const LEGACY_OPENINGS=new Set(['auto','auto_4','auto_55','auto_78','auto_195']);

export function isInvisibleMapMaterial(material) {
  return !material || material.visible===false || (material.transparent && material.opacity===0);
}

// This SketchUp export stores the holes in its window/grille textures as opaque
// black, and exports black backing faces as separate materials. Restrict the
// repair to that asset: black in unrelated models must remain black.
export function legacyOpeningPixels(data) {
  for(let i=0;i<data.length;i+=4) {
    if(data[i]<=1 && data[i+1]<=1 && data[i+2]<=1) data[i+3]=0;
  }
}

// Keep the loader's cached materials intact; each placed model owns its copies.
export function prepareTabletopMaterials(scene) {
  const copies=new Map();
  const textures=[];
  const legacyHouse=String(scene.userData.tabletopModelSource || '').includes(VINTAGE_HOUSE_SOURCE);
  const prepare=material=>{
    if(!material) return material;
    if(copies.has(material)) return copies.get(material);
    const copy=material.clone();
    // Respect the original winding on the legacy export: it has backing faces
    // coincident with the textured faces.
    if(!legacyHouse) copy.side=DoubleSide;
    if(isInvisibleMapMaterial(copy) || (legacyHouse && ['material_1','auto_32'].includes(copy.name))) copy.visible=false;
    if(legacyHouse && LEGACY_OPENINGS.has(copy.name) && copy.map?.image) {
      const image=copy.map.image;
      const canvas=document.createElement('canvas');
      canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d');
      context.drawImage(image,0,0);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height);
      legacyOpeningPixels(pixels.data);
      context.putImageData(pixels,0,0);
      copy.map=copy.map.clone();copy.map.image=canvas;copy.map.needsUpdate=true;
      copy.userData.tabletopCutout={width:canvas.width,height:canvas.height,alpha:Uint8Array.from({length:canvas.width*canvas.height},(_,i)=>pixels.data[i*4+3])};
      textures.push(copy.map);
      copy.alphaTest=.5;
    }
    // Blended glass must not hide the room behind it in the depth buffer.
    // Alpha-tested surfaces still need depth writes for their opaque pixels.
    if(copy.transparent && !copy.alphaTest) copy.depthWrite=false;
    copy.needsUpdate=true;
    copies.set(material,copy);
    return copy;
  };
  scene.traverse(child=>{
    if(!child.isMesh) return;
    child.material=Array.isArray(child.material)
      ? child.material.map(prepare) : prepare(child.material);
  });
  return ()=>{
    copies.forEach(material=>material.dispose());
    textures.forEach(texture=>texture.dispose());
  };
}
