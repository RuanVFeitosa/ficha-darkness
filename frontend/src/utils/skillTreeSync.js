// Serialize writes of the shared catalog and reject reads that started before
// an edit. Failed saves keep local work protected until a retry succeeds.
export function createSkillTreeSync(save) {
 let revision=0,pending=0,dirty=false,tail=Promise.resolve();
 return {
  get revision(){return revision;},
  get pending(){return pending;},
  canApplyRemote(version=revision){return version===revision && !pending && !dirty;},
  enqueue(trees){
   const version=++revision;pending++;dirty=true;
   const operation=tail.catch(()=>{}).then(()=>save(trees));tail=operation;
   return operation.then(data=>{
    pending--;const latest=version===revision;
    if(latest)dirty=false;
    return {data,latest};
   },error=>{pending--;throw error;});
  },
 };
}
