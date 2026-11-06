import { Box3, Triangle, Vector3 } from 'three';

const cache = new WeakMap();

// Median splits store each triangle once. Large coplanar surfaces cannot cause
// the repeated subdivision/triangle duplication of an octree.
export function collisionGeometry(geometry) {
  const position = geometry.attributes.position, index = geometry.index;
  const saved = cache.get(geometry);
  if (saved?.position === position && saved?.index === index && saved.version === position.version && saved.indexVersion === index?.version) return saved;
  const count = Math.floor((index ? index.count : position.count) / 3);
  const ids = Uint32Array.from({length:count}, (_,i) => i);
  const bounds = new Float64Array(count*6);
  const triangle = new Triangle();
  const read = (id, target) => {
    [target.a,target.b,target.c].forEach((point,i) => point.fromBufferAttribute(position,index ? index.getX(id*3+i) : id*3+i));
    return target;
  };
  for (let id=0;id<count;id+=1) {
    read(id,triangle);
    for (let axis=0;axis<3;axis+=1) {
      const key=['x','y','z'][axis];
      bounds[id*6+axis]=Math.min(triangle.a[key],triangle.b[key],triangle.c[key]);
      bounds[id*6+axis+3]=Math.max(triangle.a[key],triangle.b[key],triangle.c[key]);
    }
  }
  const center = (id,axis) => bounds[id*6+axis]+bounds[id*6+axis+3];
  const swap = (a,b) => {const value=ids[a];ids[a]=ids[b];ids[b]=value;};
  const select = (middle,start,end,axis) => {
    while (start<end) {
      const pivot=center(ids[(start+end)>>>1],axis);
      let low=start, cursor=start, high=end;
      while(cursor<=high) {
        const value=center(ids[cursor],axis);
        if(value<pivot) {swap(low,cursor);low+=1;cursor+=1;}
        else if(value>pivot) {swap(cursor,high);high-=1;}
        else cursor+=1;
      }
      if(middle<low) end=low-1;
      else if(middle>high) start=high+1;
      else return;
    }
  };
  const build = (start,end) => {
    const box=new Box3();
    for(let i=start;i<end;i+=1) {
      const offset=ids[i]*6;
      box.min.x=Math.min(box.min.x,bounds[offset]);
      box.min.y=Math.min(box.min.y,bounds[offset+1]);
      box.min.z=Math.min(box.min.z,bounds[offset+2]);
      box.max.x=Math.max(box.max.x,bounds[offset+3]);
      box.max.y=Math.max(box.max.y,bounds[offset+4]);
      box.max.z=Math.max(box.max.z,bounds[offset+5]);
    }
    if(end-start<=16) return {box,start,end};
    const size=box.getSize(new Vector3());
    const axis=size.x>=size.y && size.x>=size.z ? 0 : size.y>=size.z ? 1 : 2;
    const middle=(start+end)>>>1;
    select(middle,start,end-1,axis);
    return {box,left:build(start,middle),right:build(middle,end)};
  };
  const root=build(0,count);
  const query = (box,visit) => {
    const walk = node => {
      if(!node.box.intersectsBox(box)) return;
      if(node.left) {walk(node.left);walk(node.right);}
      else for(let i=node.start;i<node.end;i+=1) visit(ids[i]);
    };
    walk(root);
  };
  const result={position,index,version:position.version,indexVersion:index?.version,query,read,root};
  cache.set(geometry,result);
  return result;
}
