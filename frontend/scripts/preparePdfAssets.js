const fs=require('fs');
const path=require('path');
const root=path.dirname(require.resolve('pdfjs-dist/package.json'));
const target=path.join(__dirname,'../public/pdfjs');
fs.mkdirSync(target,{recursive:true});
for(const name of ['pdf.worker.min.mjs','pdf.renderer.min.mjs'])fs.copyFileSync(path.join(root,'build',name),path.join(target,name));
for(const name of ['cmaps','standard_fonts','wasm','iccs'])fs.cpSync(path.join(root,name),path.join(target,name),{recursive:true});
fs.copyFileSync(path.join(root,'LICENSE'),path.join(target,'LICENSE'));
