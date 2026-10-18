import {ACEITAR_AUDIO} from '../../utils/audioUpload';
import React,{useEffect,useState} from 'react';
import Icon from '@mdi/react';
import {mdiClose,mdiDeleteOutline} from '@mdi/js';
import SceneAnimationEditor from './SceneAnimationEditor';
import '../../styles/TabletopSceneEditor.css';
function SceneAssetThumbnail({src,file}){const [url,setUrl]=useState(src);useEffect(()=>{if(!file){setUrl(src);return;}const preview=URL.createObjectURL(file);setUrl(preview);return()=>URL.revokeObjectURL(preview);},[src,file]);return url?<img className="sce-thumbnail" src={url} alt=""/>:<span className="sce-thumbnail" aria-hidden="true">◇</span>;}
export default function TabletopSceneEditor({editando,setEditando,arquivos,campanha,nomesPastasCenas,selecionarArquivosCena,alternarJogadorCena,removerMidiaExistente,removerArquivoPendente,atualizarMapaExistente,atualizarMapaPendente,confirmarCena,salvando,erro,onClose}){
 const [tab,setTab]=useState('cena'),[selectedImage,setSelectedImage]=useState('');
 const media=(editando.imagensCena || []).find(m=>m.id===selectedImage) || editando.imagensCena?.[0];
 const tabs=[['cena','Cena'],['mapas','Mapas'],['animacao','Animação'],['configuracoes','Configurações']];
 return <div className="cena-editor-fundo sce-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!salvando)onClose();}}><form className="cena-editor sce-dialog" role="dialog" aria-modal="true" aria-label={editando.id?'Editar cena':'Nova cena'} onSubmit={confirmarCena} onKeyDown={e=>{if(e.key==='Escape'&&!salvando)onClose();}}>
            <header>
              <div>
                <span>Biblioteca</span>
                <h2>{editando.id ? "Editar cena" : "Nova cena"}</h2>
              </div>
              <button type="button" aria-label="Fechar editor de cena" disabled={salvando} onClick={() => onClose()}>
                <Icon path={mdiClose} size={0.85} />
              </button>
            </header>

<label className="sce-name">Nome da cena<input autoFocus required value={editando.nome || ''} onChange={e=>setEditando({...editando,nome:e.target.value})} placeholder="Ex.: A chegada do guardião"/></label>
<nav className="sce-tabs" role="tablist" aria-label="Seções do editor de cena">{tabs.map(([id,label])=><button type="button" role="tab" key={id} id={'sce-tab-'+id} aria-selected={tab===id} aria-controls={'sce-panel-'+id} tabIndex={tab===id?0:-1} onClick={()=>setTab(id)} onKeyDown={e=>{const delta=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(delta){e.preventDefault();const next=tabs[(tabs.findIndex(t=>t[0]===id)+delta+tabs.length)%tabs.length][0];setTab(next);e.currentTarget.parentElement.querySelector('#sce-tab-'+next)?.focus();}}}>{label}</button>)}</nav>
<div className="sce-content">
<section role="tabpanel" id="sce-panel-cena" aria-labelledby="sce-tab-cena" hidden={tab!=='cena'}><p className="sce-intro">As imagens que os jogadores verão durante a cena.</p><div className="cena-editor-midias sce-upload"><label>
                Adicionar imagens
                <input
                  type="file"
                  multiple
                  accept="image/webp,image/jpeg,image/png,image/avif"
                  onChange={(e) =>
                    selecionarArquivosCena("cena", e.target.files, e.target)
                  }
                />
                <small>Até 2 MB por imagem.</small>
              </label></div>
            {(editando.imagensCena?.length > 0 || arquivos.cena.length > 0) && (
              <div className="cena-editor-lista-midias">
                <strong>
                  Imagens (
                  {(editando.imagensCena?.length || 0) + arquivos.cena.length})
                </strong>
                {(editando.imagensCena || []).map((midia, indice) => (
                  <div className="cena-editor-midia-item sce-asset-row" key={midia.id}>
                    <SceneAssetThumbnail src={midia.url}/>
                    <span>{midia.nome || `Cena ${indice + 1}`}</span>
                    <button type="button" onClick={()=>{setSelectedImage(midia.id);setTab("animacao");}}>Animar</button>
                    <button
                      type="button"
                      onClick={() => removerMidiaExistente("cena", midia.id)}
                      title="Remover imagem"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
                {arquivos.cena.map((item) => (
                  <div className="cena-editor-midia-item sce-asset-row" key={item.id}>
                    <SceneAssetThumbnail file={item.arquivo}/>
                    <span>
                      {item.nome} <small>novo</small>
                    </span>
                    <button
                      type="button"
                      onClick={() => removerArquivoPendente("cena", item.id)}
                      title="Remover imagem"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
              </div>
            )}

{!editando.imagensCena?.length&&!arquivos.cena.length&&<p className="sce-empty">Adicione a primeira imagem desta cena.</p>}
<details className="sce-options"><summary>Usar link de imagem</summary><label>
                URL da cena
                <input
                  value={editando.imagemUrl || ""}
                  onChange={(e) =>
                    setEditando({ ...editando, imagemUrl: e.target.value })
                  }
                />
              </label></details><details className="sce-options"><summary>Descrição da cena</summary>            <label>
              Descricao
              <textarea
                rows="3"
                value={editando.descricao || ""}
                onChange={(e) =>
                  setEditando({ ...editando, descricao: e.target.value })
                }
              />
            </label>
</details></section>
<section role="tabpanel" id="sce-panel-mapas" aria-labelledby="sce-tab-mapas" hidden={tab!=='mapas'}><p className="sce-intro">Mapas e grade para encontros táticos.</p><div className="cena-editor-midias sce-upload"><label>
                Adicionar mapas
                <input
                  type="file"
                  multiple
                  accept="image/webp,image/jpeg,image/png,image/avif"
                  onChange={(e) =>
                    selecionarArquivosCena("mapa", e.target.files, e.target)
                  }
                />
                <small>Até 5 MB por mapa.</small>
              </label></div>            {(editando.mapasBatalha?.length > 0 ||
              arquivos.mapa.length > 0) && (
              <div className="cena-editor-lista-midias">
                <strong>
                  Mapas de batalha (
                  {(editando.mapasBatalha?.length || 0) + arquivos.mapa.length})
                </strong>
                {(editando.mapasBatalha || []).map((midia, indice) => (
                  <div
                    className="cena-editor-midia-item cena-editor-mapa-item"
                    key={midia.id}
                  >
                    <span>{midia.nome || `Mapa ${indice + 1}`}</span>
                    <label>
                      Colunas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={midia.larguraGrade || 12}
                        onChange={(e) =>
                          atualizarMapaExistente(
                            midia.id,
                            "larguraGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      Linhas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={midia.alturaGrade || 8}
                        onChange={(e) =>
                          atualizarMapaExistente(
                            midia.id,
                            "alturaGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label className="cena-editor-grade-toggle">
                      <input type="checkbox" checked={midia.exibirGrade !== false} onChange={(e) => atualizarMapaExistente(midia.id, "exibirGrade", e.target.checked)} />
                      Exibir grade
                    </label>
                    <button
                      type="button"
                      onClick={() => removerMidiaExistente("mapa", midia.id)}
                      title="Remover mapa"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
                {arquivos.mapa.map((item) => (
                  <div
                    className="cena-editor-midia-item cena-editor-mapa-item"
                    key={item.id}
                  >
                    <span>
                      {item.nome} <small>novo</small>
                    </span>
                    <label>
                      Colunas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.larguraGrade}
                        onChange={(e) =>
                          atualizarMapaPendente(
                            item.id,
                            "larguraGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      Linhas
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={item.alturaGrade}
                        onChange={(e) =>
                          atualizarMapaPendente(
                            item.id,
                            "alturaGrade",
                            e.target.value,
                          )
                        }
                      />
                    </label>
                    <label className="cena-editor-grade-toggle">
                      <input type="checkbox" checked={item.exibirGrade !== false} onChange={(e) => atualizarMapaPendente(item.id, "exibirGrade", e.target.checked)} />
                      Exibir grade
                    </label>
                    <button
                      type="button"
                      onClick={() => removerArquivoPendente("mapa", item.id)}
                      title="Remover mapa"
                    >
                      <Icon path={mdiDeleteOutline} size={0.68} />
                    </button>
                  </div>
                ))}
              </div>
            )}
<details className="sce-options"><summary>Link do mapa e grade padrão</summary><label>
                URL do mapa
                <input
                  value={editando.mapaUrl || ""}
                  onChange={(e) =>
                    setEditando({ ...editando, mapaUrl: e.target.value })
                  }
                />
              </label>            <div className="cena-editor-grade">
              <label>
                Colunas padrao
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editando.larguraGrade}
                  onChange={(e) =>
                    setEditando({ ...editando, larguraGrade: e.target.value })
                  }
                />
              </label>
              <label>
                Linhas padrao
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editando.alturaGrade}
                  onChange={(e) =>
                    setEditando({ ...editando, alturaGrade: e.target.value })
                  }
                />
              </label>
            </div>
</details></section>
<section role="tabpanel" id="sce-panel-animacao" aria-labelledby="sce-tab-animacao" hidden={tab!=='animacao'}><p className="sce-intro">Dê movimento a um personagem importante ou boss.</p>{tab==='animacao' && (media?<><label>Imagem para animar<select value={media.id} onChange={e=>setSelectedImage(e.target.value)}>{(editando.imagensCena || []).map(m=><option key={m.id} value={m.id}>{m.nome || 'Imagem da cena'}</option>)}</select></label><SceneAnimationEditor key={media.id} defaultOpen media={media} onChange={animation=>setEditando(prev=>({...prev,imagensCena:prev.imagensCena.map(m=>m.id===media.id?{...m,animation}:m)}))}/></>:<p className="sce-empty">Salve uma imagem na aba Cena para preparar a animação.</p>)}</section>
<section role="tabpanel" id="sce-panel-configuracoes" aria-labelledby="sce-tab-configuracoes" hidden={tab!=='configuracoes'}><div className="sce-folder"><label>
                Pasta
                <input
                  value={editando.pasta || "Sem pasta"}
                  onChange={(e) => setEditando({ ...editando, pasta: e.target.value })}
                  list="pastas-cenas-existentes"
                  placeholder="Ex.: Ato II"
                />
              </label>            <datalist id="pastas-cenas-existentes">
              {nomesPastasCenas.map((pasta) => <option value={pasta} key={pasta} />)}
            </datalist>
</div>            <section className="cena-editor-visibilidade">
              <div className="cena-editor-visibilidade-cabecalho">
                <div>
                  <strong>Visibilidade da cena</strong>
                  <small>
                    {editando.visualizarTodos !== false
                      ? "Todos os jogadores verão esta cena quando ela estiver ativa."
                      : "Apenas as fichas selecionadas verão a cena."}
                  </small>
                </div>
                <button
                  type="button"
                  className={editando.visualizarTodos !== false ? "ativo" : ""}
                  onClick={() => setEditando((atual) => ({
                    ...atual,
                    visualizarTodos: atual.visualizarTodos === false,
                  }))}
                >
                  {editando.visualizarTodos !== false ? "Todos" : "Específicos"}
                </button>
              </div>
              {editando.visualizarTodos === false && (
                <div className="cena-editor-jogadores">
                  {(campanha.membros || []).map((membro) => {
                    const fichaId = String(membro.ficha_id || "");
                    const selecionado = (editando.jogadoresVisiveis || [])
                      .map(String)
                      .includes(fichaId);
                    return (
                      <label key={membro.id || fichaId} className={selecionado ? "selecionado" : ""}>
                        <input
                          type="checkbox"
                          checked={selecionado}
                          onChange={() => alternarJogadorCena(fichaId)}
                        />
                        <span>
                          <b>{membro.nome || fichaId}</b>
                          <small>{fichaId}</small>
                        </span>
                      </label>
                    );
                  })}
                  {!campanha.membros?.length && (
                    <small>Vincule fichas à campanha antes de restringir a cena.</small>
                  )}
                </div>
              )}
            </section>
<details className="sce-options"><summary>Dificuldades · Espiral</summary>              <fieldset className="tt3-scene-difficulties"><legend>Dificuldades da cena · ESPIRAL</legend>{[['ambiente','Ambiente'],['combateAmbiente','Combate — ambiente'],['conflitos','Conflitos — perseguições e outros']].map(([key,label])=><label key={key}>{label}<input type="number" min="0" max="30" value={editando.dificuldades?.[key] ?? 4} onChange={event=>setEditando({...editando,dificuldades:{ambiente:4,combateAmbiente:4,conflitos:4,...editando.dificuldades,[key]:Math.max(0,Math.min(30,Number(event.target.value)||0))}})}/></label>)}<small>No combate, a dificuldade de cada inimigo é sua Defesa.</small></fieldset>

</details><details className="sce-options"><summary>Cena especial · abertura e áudio</summary>            <section className="cena-editor-especial">
              <label className="cena-editor-loja">
                <input
                  type="checkbox"
                  checked={Boolean(editando.cenaEspecial?.ativo)}
                  onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...(editando.cenaEspecial || {}), ativo: e.target.checked, transicao: editando.cenaEspecial?.transicao || "cinema", loop: editando.cenaEspecial?.loop !== false, loopAudio: editando.cenaEspecial?.loopAudio !== false, exibirTitulo: editando.cenaEspecial?.exibirTitulo !== false } })}
                />
                <span><strong>Cena especial em tela cheia</strong><small>Para aberturas, revelacoes e confrontos importantes.</small></span>
              </label>
              {editando.cenaEspecial?.ativo && <div className="cena-editor-especial-campos">
                <label>GIF, imagem ou video · max. 25 MB<input type="file" accept="image/gif,image/webp,image/jpeg,image/png,image/avif,video/mp4,video/webm" onChange={(e) => selecionarArquivosCena("especial", e.target.files, e.target)} /><small>{arquivos.especial[0]?.arquivo.name || editando.cenaEspecial.midiaUrl || "Nenhuma midia selecionada"}</small></label>
                <label>Musica de fundo · max. 20 MB<input type="file" accept={ACEITAR_AUDIO} onChange={(e) => selecionarArquivosCena("audio", e.target.files, e.target)} /><small>{arquivos.audio[0]?.arquivo.name || editando.cenaEspecial.audioUrl || "Sem trilha propria"}</small></label>
                <label>URL da midia<input value={editando.cenaEspecial.midiaUrl || ""} onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...editando.cenaEspecial, midiaUrl: e.target.value } })} placeholder="https://.../abertura.gif" /></label>
                <label>URL da musica ou YouTube<input value={editando.cenaEspecial.audioUrl || ""} onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...editando.cenaEspecial, audioUrl: e.target.value, audioUrlPersistida: "" } })} placeholder="https://youtube.com/watch?v=..." /><small>Aceita um video do YouTube ou um link direto de audio.</small></label>
                <label>Transicao<select value={editando.cenaEspecial.transicao || "cinema"} onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...editando.cenaEspecial, transicao: e.target.value } })}><option value="cinema">Cortinas de cinema</option><option value="fade">Fade sombrio</option><option value="impacto">Impacto</option></select></label>
                <label>Atraso da musica (ms)<input type="number" min="0" max="30000" step="100" value={editando.cenaEspecial.atrasoAudio || 0} onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...editando.cenaEspecial, atrasoAudio: e.target.value } })} /></label>
                <label className="cena-especial-opcao"><input type="checkbox" checked={editando.cenaEspecial.exibirTitulo !== false} onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...editando.cenaEspecial, exibirTitulo: e.target.checked } })} />Exibir titulo</label>
                <label className="cena-especial-opcao"><input type="checkbox" checked={editando.cenaEspecial.loop !== false} onChange={(e) => setEditando({ ...editando, cenaEspecial: { ...editando.cenaEspecial, loop: e.target.checked } })} />Repetir video</label>
              </div>}
            </section>
</details><label className="cena-editor-loja">
              <input
                type="checkbox"
                checked={Boolean(editando.lojaDisponivel)}
                onChange={(e) => setEditando({ ...editando, lojaDisponivel: e.target.checked })}
              />
              <span>
                <strong>Loja disponível nesta cena</strong>
                <small>Jogadores poderão abrir a Loja diretamente no tabletop enquanto esta cena estiver ativa.</small>
              </span>
            </label>
</section>
</div>            {erro && <p className="cena-editor-erro">{erro}</p>}
            <footer>
              <button type="button" onClick={() => onClose()}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar cena"}
              </button>
            </footer>
</form></div>;
}
