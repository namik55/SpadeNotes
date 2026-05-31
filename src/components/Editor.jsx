import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Extension, Mark, Node } from '@tiptap/core';
import { MessageSquare, X, ChevronDown, Trash2, Check, Pencil } from 'lucide-react';
import FormatBar from './FormatBar.jsx';
import CitationSidebar from './CitationSidebar.jsx';

// ── FontSize extension ─────────────────────────────────────────────────────
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{ types: ['textStyle'], attributes: { fontSize: {
      default: null,
      parseHTML: el => el.style.fontSize || null,
      renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
    }}}];
  },
  addCommands() {
    return { setFontSize: size => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run() };
  },
});

// ── Indent extension ───────────────────────────────────────────────────────
const IndentExtension = Extension.create({
  name: 'indent',
  addOptions() { return { indentSize: 40 }; },
  addGlobalAttributes() {
    return [{ types: ['paragraph','heading'], attributes: { indent: {
      default: 0,
      parseHTML: el => { const m=(el.style.marginLeft||'').match(/(\d+)/); return m?Math.round(parseInt(m[1])/this.options.indentSize):0; },
      renderHTML: attrs => attrs.indent ? { style: `margin-left: ${attrs.indent*this.options.indentSize}px` } : {},
    }}}];
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if(this.editor.isActive('bulletList')||this.editor.isActive('orderedList')||this.editor.isActive('taskList'))
          return this.editor.commands.sinkListItem('listItem')||this.editor.commands.sinkListItem('taskItem');
        return applyIndentToSelection(this.editor, +1, this.options.indentSize);
      },
      'Shift-Tab': () => {
        if(this.editor.isActive('bulletList')||this.editor.isActive('orderedList')||this.editor.isActive('taskList'))
          return this.editor.commands.liftListItem('listItem')||this.editor.commands.liftListItem('taskItem');
        return applyIndentToSelection(this.editor, -1, this.options.indentSize);
      },
      Backspace: () => {
        const {$from,empty}=this.editor.state.selection;
        if(!empty||$from.parentOffset!==0) return false;
        if(this.editor.isActive('bulletList')||this.editor.isActive('orderedList')||this.editor.isActive('taskList')) return false;
        const cur=$from.node().attrs?.indent??0; if(cur<=0) return false;
        return applyIndentToSelection(this.editor, -1, this.options.indentSize);
      },
    };
  },
  addCommands() {
    return {
      indent:  ()=>({editor})=>{ if(editor.isActive('bulletList')||editor.isActive('orderedList')||editor.isActive('taskList')) return editor.commands.sinkListItem('listItem'); return applyIndentToSelection(editor,+1,this.options.indentSize); },
      outdent: ()=>({editor})=>{ if(editor.isActive('bulletList')||editor.isActive('orderedList')||editor.isActive('taskList')) return editor.commands.liftListItem('listItem'); return applyIndentToSelection(editor,-1,this.options.indentSize); },
    };
  },
});

// Applies indent delta to every paragraph/heading node touched by the current selection
function applyIndentToSelection(editor, delta, indentSize) {
  const { state, view } = editor;
  const { from, to } = state.selection;
  const tr = state.tr;
  let changed = false;
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name !== 'paragraph' && node.type.name !== 'heading') return;
    const cur = node.attrs?.indent ?? 0;
    const next = Math.max(0, cur + delta);
    if (next === cur) return;
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
    changed = true;
  });
  if (!changed) return false;
  view.dispatch(tr);
  return true;
}

// ── Comment mark ───────────────────────────────────────────────────────────
export const CommentMark = Mark.create({
  name: 'comment',
  addAttributes() {
    return {
      commentId:   { default:null, parseHTML:el=>el.getAttribute('data-comment-id'),   renderHTML:attrs=>attrs.commentId  ?{'data-comment-id':attrs.commentId}:{} },
      commentText: { default:null, parseHTML:el=>el.getAttribute('data-comment-text'), renderHTML:attrs=>attrs.commentText?{'data-comment-text':attrs.commentText}:{} },
    };
  },
  parseHTML()  { return [{ tag:'span[data-comment-id]' }]; },
  renderHTML({ HTMLAttributes }) { return ['span',{...HTMLAttributes,class:'comment-mark',style:'background:#FFD60044;border-bottom:2px solid #e6b800;cursor:pointer;border-radius:2px;padding:1px 0;'},0]; },
  addCommands() { return { setComment:attrs=>({commands})=>commands.setMark(this.name,attrs), unsetComment:()=>({commands})=>commands.unsetMark(this.name) }; },
});

// ── Citation node (superscript number in canvas) ───────────────────────────
// Using an atom inline Node instead of a Mark so cursor always lands OUTSIDE
export const CitationNode = Node.create({
  name: 'citationRef',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      citeId:   { default: null },
      citeNum:  { default: 1 },
      citeText: { default: '' },
    };
  },
  parseHTML() { return [{ tag: 'sup[data-cite-id]' }]; },
  renderHTML({ node }) {
    return ['sup', {
      class: 'citation-ref',
      'data-cite-id': node.attrs.citeId,
      'data-cite-num': String(node.attrs.citeNum),
      title: node.attrs.citeText,
    }, `[${node.attrs.citeNum}]`];
  },
  addNodeView() {
    return ({ node }) => {
      const sup = document.createElement('sup');
      sup.className = 'citation-ref';
      sup.setAttribute('data-cite-id', node.attrs.citeId);
      sup.setAttribute('data-cite-num', String(node.attrs.citeNum));
      sup.title = node.attrs.citeText;
      sup.textContent = `[${node.attrs.citeNum}]`;
      sup.contentEditable = 'false';
      return { dom: sup };
    };
  },
  addCommands() {
    return {
      insertCitationRef: attrs => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
});


const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block', atom: true, draggable: true,
  addAttributes() { return { src:{default:null}, alt:{default:null}, width:{default:'100%'}, align:{default:'left'} }; },
  parseHTML() { return [{ tag:'img[src]', getAttrs:el=>({ src:el.getAttribute('src'), alt:el.getAttribute('alt'), width:el.style.width||el.getAttribute('width')||'100%', align:el.getAttribute('data-align')||'left' }) }]; },
  renderHTML({ HTMLAttributes }) {
    const {width,align,...rest}=HTMLAttributes;
    return ['img',{...rest,style:`width:${width};max-width:100%;display:block;`,'data-align':align}];
  },
  addNodeView() {
    return ({ node, updateAttributes }) => {
      const wrap=document.createElement('div');
      wrap.style.cssText=`display:block;position:relative;width:fit-content;margin:8px 0;${node.attrs.align==='center'?'margin-left:auto;margin-right:auto;':''}`;

      const img=document.createElement('img');
      img.src=node.attrs.src||''; img.alt=node.attrs.alt||'';
      img.style.cssText=`display:block;width:${node.attrs.width||'100%'};max-width:100%;border-radius:4px;box-sizing:border-box;`;
      img.draggable=false;

      // Right-click context menu for size presets
      img.addEventListener('contextmenu',e=>{
        e.preventDefault();
        document.querySelectorAll('[data-img-ctx]').forEach(m=>m.remove());
        const menu=document.createElement('div');
        menu.setAttribute('data-img-ctx','1');
        menu.style.cssText=`position:fixed;top:${e.clientY}px;left:${e.clientX}px;background:var(--bg);border:1px solid var(--border-strong);border-radius:6px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:99999;min-width:160px;font-family:var(--sans);font-size:13px;`;
        [
          {label:'Small (25%)',  action:()=>updateAttributes({width:'25%'})},
          {label:'Medium (50%)', action:()=>updateAttributes({width:'50%'})},
          {label:'Large (75%)',  action:()=>updateAttributes({width:'75%'})},
          {label:'Full width',   action:()=>updateAttributes({width:'100%'})},
          null,
          {label:'Align left',   action:()=>updateAttributes({align:'left'})},
          {label:'Align center', action:()=>updateAttributes({align:'center'})},
        ].forEach(item=>{
          if(!item){const sep=document.createElement('div');sep.style.cssText='height:1px;background:var(--border);margin:4px 0;';menu.appendChild(sep);return;}
          const btn=document.createElement('button');
          btn.textContent=item.label;
          btn.style.cssText='display:block;width:100%;padding:6px 14px;border:none;background:transparent;cursor:pointer;color:var(--fg);text-align:left;font-size:13px;';
          btn.onmouseenter=()=>btn.style.background='var(--bg-hover)';
          btn.onmouseleave=()=>btn.style.background='transparent';
          btn.onclick=()=>{item.action();menu.remove();};
          menu.appendChild(btn);
        });
        document.body.appendChild(menu);
        const close=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',close);}};
        setTimeout(()=>document.addEventListener('mousedown',close),10);
      });

      // Resize handle — uses setPointerCapture to avoid stuck drag
      const handle=document.createElement('div');
      handle.style.cssText='position:absolute;bottom:6px;right:6px;width:14px;height:14px;background:var(--fg);border-radius:50%;cursor:se-resize;opacity:0;transition:opacity 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.3);touch-action:none;';
      wrap.addEventListener('mouseenter',()=>handle.style.opacity='0.85');
      wrap.addEventListener('mouseleave',()=>handle.style.opacity='0');

      handle.addEventListener('pointerdown',e=>{
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        const startX=e.clientX;
        const startW=img.getBoundingClientRect().width;
        function onMove(e2){
          const newW=Math.max(60,startW+(e2.clientX-startX));
          img.style.width=newW+'px';
        }
        function onUp(e2){
          const newW=Math.max(60,startW+(e2.clientX-startX));
          updateAttributes({width:newW+'px'});
          handle.removeEventListener('pointermove',onMove);
          handle.removeEventListener('pointerup',onUp);
        }
        handle.addEventListener('pointermove',onMove);
        handle.addEventListener('pointerup',onUp);
      });

      wrap.appendChild(img);
      wrap.appendChild(handle);
      return {
        dom:wrap,
        update(n){
          if(n.type!==node.type) return false;
          img.src=n.attrs.src||''; img.style.width=n.attrs.width||'100%';
          wrap.style.marginLeft=n.attrs.align==='center'?'auto':'';
          wrap.style.marginRight=n.attrs.align==='center'?'auto':'';
          return true;
        },
      };
    };
  },
  addCommands() { return { setResizableImage:attrs=>({commands})=>commands.insertContent({type:this.name,attrs}) }; },
});

const makeStyles=fontSize=>`
  .tiptap-editor{outline:none;font-family:var(--sans);font-size:${fontSize};line-height:1.7;color:var(--fg);cursor:text;min-height:200px;}
  .tiptap-editor .ProseMirror { outline: none !important; }
  .ProseMirror{outline:none !important;box-shadow:none !important;border:none !important;}
  .ProseMirror:focus{outline:none !important;}
  .tiptap-editor h1{font-family:var(--serif);font-weight:500;font-size:36px;line-height:1.15;letter-spacing:-0.02em;margin:0 0 6px;}
  .tiptap-editor h2{font-family:var(--serif);font-weight:500;font-size:24px;margin:28px 0 10px;}
  .tiptap-editor h3{font-family:var(--serif);font-weight:500;font-size:20px;margin:22px 0 8px;}
  .tiptap-editor h4{font-weight:600;font-size:16px;margin:18px 0 6px;}
  .tiptap-editor p{margin:0 0 12px;}
  .tiptap-editor ul,.tiptap-editor ol{padding-left:22px;margin:0 0 12px;}
  .tiptap-editor li{margin-bottom:4px;}
  .tiptap-editor blockquote{border-left:2px solid var(--fg);padding-left:14px;margin:16px 0;color:var(--fg-muted);font-style:italic;font-family:var(--serif);}
  .tiptap-editor code{font-family:var(--mono);font-size:13px;background:var(--bg-sunken);padding:1px 5px;border-radius:3px;}
  .tiptap-editor pre{background:var(--bg-sunken);padding:14px 16px;border-radius:var(--radius);margin:0 0 14px;font-family:var(--mono);font-size:13px;overflow-x:auto;}
  .tiptap-editor pre code{background:none;padding:0;}
  .tiptap-editor mark{border-radius:2px;padding:1px 2px;}
  .tiptap-editor a{color:var(--fg);text-decoration:underline;cursor:pointer;}
  .tiptap-editor hr{border:none;border-top:1px solid var(--border);margin:20px 0;}
  .tiptap-editor .is-editor-empty:first-child::before{content:attr(data-placeholder);color:var(--fg-subtle);pointer-events:none;float:left;height:0;}
  .tiptap-editor ul[data-type="taskList"]{list-style:none;padding-left:4px;}
  .tiptap-editor ul[data-type="taskList"] li{display:flex;align-items:flex-start;gap:8px;}
  .tiptap-editor ul[data-type="taskList"] li>label{margin-top:2px;}
  .tiptap-editor ul[data-type="taskList"] li>label input[type="checkbox"]{width:15px;height:15px;cursor:pointer;accent-color:var(--fg);}
  .tiptap-editor ul[data-type="taskList"] li[data-checked="true"]>div{text-decoration:line-through;color:var(--fg-muted);}
  .comment-mark{background:#FFD60044 !important;border-bottom:2px solid #e6b800 !important;}
  .comment-mark:hover{background:#FFD60088 !important;}
  /* Citation superscript */
  .citation-ref{font-size:0.72em;vertical-align:super;color:var(--fg-muted);cursor:pointer;font-style:normal;border-bottom:1px dotted var(--fg-muted);line-height:1;padding:0 1px;}
  .citation-ref:hover{color:var(--fg);border-color:var(--fg);}
  @keyframes cite-flash{0%,100%{background:transparent}40%{background:var(--bg-active)}}
  .cite-highlight{animation:cite-flash 1.2s ease;border-radius:4px;}

`;

// ── Title block ────────────────────────────────────────────────────────────
const TitleBlock = React.memo(function TitleBlock({ note, zoom }) {
  const [titleSize,setTitleSize]=useState(36);
  const [titleAlign,setTitleAlign]=useState('left');
  const [showSizes,setShowSizes]=useState(false);
  const dropRef=useRef();
  const SIZES=[14,16,18,20,24,28,32,36,42,48,60];
  const fs=Math.round(titleSize*zoom/100);
  useEffect(()=>{
    if(!showSizes) return;
    const h=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setShowSizes(false);};
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[showSizes]);
  return(
    <div style={{marginBottom:Math.round(28*zoom/100)}}>
      <h1 style={{fontFamily:'var(--serif)',fontWeight:500,fontSize:fs,letterSpacing:'-0.02em',color:'var(--fg)',margin:0,textAlign:titleAlign,lineHeight:1.15}}>{note?.name??''}</h1>
      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6,opacity:0.6}}>
        <span style={{fontSize:10,color:'var(--fg-muted)',fontFamily:'var(--mono)',marginRight:2}}>Title:</span>
        <div ref={dropRef} style={{position:'relative'}}>
          <button onClick={()=>setShowSizes(s=>!s)}
            style={{height:20,padding:'0 6px',borderRadius:3,border:'1px solid var(--border)',background:'transparent',color:'var(--fg-muted)',fontFamily:'var(--mono)',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:2}}>
            {titleSize}px <ChevronDown size={8}/>
          </button>
          {showSizes&&(
            <div style={{position:'absolute',bottom:'100%',left:0,marginBottom:2,background:'var(--bg)',border:'1px solid var(--border-strong)',borderRadius:'var(--radius)',boxShadow:'0 -4px 20px rgba(0,0,0,0.12)',zIndex:9999,padding:'3px 0',minWidth:70,maxHeight:220,overflowY:'auto'}}>
              {SIZES.map(s=>(
                <button key={s} onClick={()=>{setTitleSize(s);setShowSizes(false);}}
                  style={{display:'block',width:'100%',padding:'4px 10px',border:'none',background:titleSize===s?'var(--bg-active)':'transparent',color:'var(--fg)',fontFamily:'var(--mono)',fontSize:11,cursor:'pointer',textAlign:'left'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                  onMouseLeave={e=>e.currentTarget.style.background=titleSize===s?'var(--bg-active)':'transparent'}>
                  {s}px
                </button>
              ))}
            </div>
          )}
        </div>
        {[['left','←'],['center','↔'],['right','→']].map(([a,icon])=>(
          <button key={a} onClick={()=>setTitleAlign(a)}
            style={{height:20,width:22,borderRadius:3,border:`1px solid ${titleAlign===a?'var(--fg)':'var(--border)'}`,background:titleAlign===a?'var(--fg)':'transparent',color:titleAlign===a?'var(--bg)':'var(--fg-muted)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Comment sidebar ────────────────────────────────────────────────────────
function CommentSidebar({ comments, activeId, onClose, onDelete, onEdit, onScrollTo, width, onResize }) {
  return(
    <div style={{width,flexShrink:0,background:'var(--bg-elev)',borderLeft:'1px solid var(--border)',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
      <div onMouseDown={e=>{
        e.preventDefault(); const startX=e.clientX,startW=width;
        const onMove=ev=>onResize(Math.max(200,Math.min(500,startW-(ev.clientX-startX))));
        const onUp=()=>{ window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
        window.addEventListener('mousemove',onMove); window.addEventListener('mouseup',onUp);
      }} style={{position:'absolute',left:0,top:0,bottom:0,width:5,cursor:'col-resize',zIndex:10}}
      onMouseEnter={e=>e.currentTarget.style.background='var(--border-strong)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}/>
      <div style={{height:42,display:'flex',alignItems:'center',padding:'0 12px 0 16px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <MessageSquare size={13} color="var(--fg-muted)" style={{marginRight:7}}/>
        <span style={{flex:1,fontSize:13,fontWeight:600,color:'var(--fg)'}}>Comments <span style={{fontSize:11,color:'var(--fg-muted)',fontWeight:400}}>({comments.length})</span></span>
        <button className="btn icon" onClick={onClose} style={{display:'flex',alignItems:'center',justifyContent:'center'}}><X size={13}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
        {comments.length===0&&(
          <div style={{padding:'32px 16px',textAlign:'center',color:'var(--fg-subtle)',fontSize:12,lineHeight:1.6}}>
            <MessageSquare size={22} style={{marginBottom:8,opacity:0.25}}/>
            <div>No comments yet.</div>
            <div style={{marginTop:4}}>Select text and click 💬 in the toolbar.</div>
          </div>
        )}
        {comments.map((c,i)=>(
          <CommentCard key={c.id} comment={c} index={i+1} active={c.id===activeId}
            onDelete={()=>onDelete(c.id)} onEdit={newText=>onEdit(c.id,newText)} onScrollTo={()=>onScrollTo(c.id)}/>
        ))}
      </div>
    </div>
  );
}

function CommentCard({ comment, index, active, onDelete, onEdit, onScrollTo }) {
  const [hover,setHover]=useState(false);
  const [editing,setEditing]=useState(false);
  const [editVal,setEditVal]=useState(comment.text);
  const inputRef=useRef();
  function startEdit(e){e.stopPropagation();setEditVal(comment.text);setEditing(true);setTimeout(()=>inputRef.current?.focus(),20);}
  function confirmEdit(){setEditing(false);if(editVal.trim()&&editVal!==comment.text)onEdit(editVal.trim());}
  const date=comment.createdAt?new Date(comment.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
  return(
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{margin:'0 8px 4px',borderRadius:6,border:`1px solid ${active?'#e6b800':'var(--border)'}`,background:active?'#FFD60011':hover?'var(--bg-hover)':'var(--bg)',overflow:'hidden',transition:'all 0.1s'}}>
      <div style={{display:'flex',alignItems:'flex-start',padding:'8px 10px',gap:7}}>
        <span style={{width:18,height:18,borderRadius:'50%',background:'var(--bg-active)',color:'var(--fg-muted)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1,cursor:'pointer'}} onClick={onScrollTo}>{index}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,color:'var(--fg-muted)',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4,cursor:'pointer'}} onClick={onScrollTo}>
            "{comment.quotedText?.slice(0,40)}{(comment.quotedText?.length??0)>40?'…':''}"
          </div>
          {editing?(
            <div>
              <textarea ref={inputRef} value={editVal} onChange={e=>setEditVal(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();confirmEdit();}if(e.key==='Escape')setEditing(false);}}
                style={{width:'100%',minHeight:60,padding:'5px 8px',fontSize:12,border:'1px solid var(--fg)',borderRadius:4,background:'var(--bg)',color:'var(--fg)',fontFamily:'var(--sans)',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
              <div style={{display:'flex',gap:4,marginTop:4}}>
                <button onClick={confirmEdit} style={{height:22,padding:'0 8px',borderRadius:3,border:'none',background:'var(--fg)',color:'var(--bg)',fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={10}/> Save</button>
                <button onClick={()=>setEditing(false)} style={{height:22,padding:'0 8px',borderRadius:3,border:'1px solid var(--border)',background:'transparent',color:'var(--fg-muted)',fontSize:11,cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          ):(
            <div style={{fontSize:12,color:'var(--fg)',lineHeight:1.5,background:'var(--bg-sunken)',borderRadius:4,padding:'5px 8px',cursor:'text'}} onClick={startEdit}>
              {comment.text}
            </div>
          )}
          {date&&!editing&&<div style={{fontSize:10,color:'var(--fg-subtle)',marginTop:4}}>{date}</div>}
        </div>
        {hover&&!editing&&(
          <div style={{display:'flex',flexDirection:'column',gap:2,flexShrink:0}}>
            <button onClick={startEdit} style={{background:'none',border:'none',cursor:'pointer',color:'var(--fg-muted)',padding:2,display:'flex',alignItems:'center'}} title="Edit"><Pencil size={10}/></button>
            <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:'none',border:'none',cursor:'pointer',color:'#e85a5a',padding:2,display:'flex',alignItems:'center'}} title="Delete"><Trash2 size={10}/></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Editor ────────────────────────────────────────────────────────────
export default function Editor({
  note, onWordCount, onSave, setSaveStatus,
  editorRef, spellCheck = true, fontSize = '15px',
  showComments, onToggleComments,
  showCitations, onToggleCitations,
  statusBar = null,
  pageMargin = { top: 96, bottom: 96, left: 110, right: 110 },
}) {
  const [zoom,setZoom]=useState(100);
  const [comments,setComments]=useState([]);
  const [activeComment,setActiveComment]=useState(null);
  const [commentSidebarW,setCommentSidebarW]=useState(280);
  const [citations,setCitations]=useState([]);
  const [citationSidebarW,setCitationSidebarW]=useState(300);

  useEffect(()=>{
    if(!note?.path) return;
    try{const s=localStorage.getItem(`cmt_${note.path}`);setComments(s?JSON.parse(s):[]);}
    catch{setComments([]);}
    try{const s=localStorage.getItem(`cite_${note.path}`);setCitations(s?JSON.parse(s):[]);}
    catch{setCitations([]);}
  },[note?.path]);

  const saveComments  = useCallback((next)=>{setComments(next);if(note?.path)try{localStorage.setItem(`cmt_${note.path}`,JSON.stringify(next));}catch{}},[note?.path]);
  const saveCitations = useCallback((next)=>{setCitations(next);if(note?.path)try{localStorage.setItem(`cite_${note.path}`,JSON.stringify(next));}catch{}},[note?.path]);

  const extensions = useMemo(()=>[
    StarterKit,Underline,TextStyle,Color,FontSize,IndentExtension,
    TextAlign.configure({types:['heading','paragraph']}),
    Highlight.configure({multicolor:true}),
    TaskList,TaskItem.configure({nested:true}),
    ResizableImage,
    Link.configure({openOnClick:false,HTMLAttributes:{rel:'noopener noreferrer'}}),
    Placeholder.configure({placeholder:'Start writing…'}),
    CharacterCount,CommentMark,CitationNode,
  ],[]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor=useEditor({
    extensions,
    content:note?.content??'',
    autofocus:false,
    editorProps:{
      attributes:{spellcheck:spellCheck?'true':'false'},
      handleClick(view,pos,event){
        const target=event.target;
        if(target.tagName==='A'&&target.href){
          event.preventDefault();
          if(window.electronAPI?.openExternal)window.electronAPI.openExternal(target.href);
          else window.open(target.href,'_blank');
          return true;
        }
        const mark=target.classList.contains('comment-mark')?target:target.closest?.('.comment-mark');
        if(mark){
          const id=mark.getAttribute('data-comment-id');
          if(id){setActiveComment(id);if(!showComments&&onToggleComments)onToggleComments();}
          return true;
        }
        const cite=target.classList.contains('citation-ref')?target:target.closest?.('.citation-ref');
        if(cite){
          const id=cite.getAttribute('data-cite-id');
          if(id){
            if(!showCitations&&onToggleCitations)onToggleCitations();
            setTimeout(()=>{
              const el=document.querySelector(`[data-sidebar-cite="${id}"]`);
              el?.scrollIntoView({behavior:'smooth',block:'nearest'});
              el?.classList.add('cite-highlight');
              setTimeout(()=>el?.classList.remove('cite-highlight'),1200);
            },80);
          }
          return true;
        }
        return false;
      },
    },
    onUpdate({editor}){
      const text=editor.getText();
      const words=text.trim()?text.trim().split(/\s+/).length:0;
      const chars=editor.storage.characterCount.characters();
      onWordCount?.(words,chars);
      if(!onSave) return;
      clearTimeout(window._saveTimer);
      window._saveTimer=setTimeout(()=>{setSaveStatus?.('Saving…');onSave?.(editor.getHTML());},1500);
    },
  });

  useEffect(()=>{if(editorRef)editorRef.current=editor;},[editor]);
  useEffect(()=>{
    if(editor&&note){
      editor.commands.setContent(note.content??'');
      requestAnimationFrame(()=>requestAnimationFrame(()=>editor.commands.focus('end')));
    }
  },[note?.path]);
  useEffect(()=>{
    if(!editor) return;
    editor.setOptions({editorProps:{...editor.options.editorProps,attributes:{spellcheck:spellCheck?'true':'false'}}});
  },[spellCheck]);

  function handleAddComment(text){
    if(!editor) return;
    const{from,to}=editor.state.selection;if(from===to)return;
    const quotedText=editor.state.doc.textBetween(from,to,' ');
    const id=`cmt_${Date.now()}`;
    editor.chain().focus().setComment({commentId:id,commentText:text}).run();
    const next=[...comments,{id,text,quotedText,createdAt:Date.now(),position:from}].sort((a,b)=>a.position-b.position);
    saveComments(next);setActiveComment(id);
    if(!showComments&&onToggleComments)onToggleComments();
  }
  function handleDeleteComment(id){
    if(editor){
      const{state,dispatch}=editor.view;const{doc,tr}=state;
      doc.descendants((node,pos)=>{node.marks.forEach(mark=>{if(mark.type.name==='comment'&&mark.attrs.commentId===id)tr.removeMark(pos,pos+node.nodeSize,state.schema.marks.comment);});});
      dispatch(tr);
    }
    saveComments(comments.filter(c=>c.id!==id));
    if(activeComment===id)setActiveComment(null);
  }
  function handleEditComment(id,newText){
    saveComments(comments.map(c=>c.id===id?{...c,text:newText}:c));
    const el=editor?.view?.dom?.querySelector(`[data-comment-id="${id}"]`);
    if(el)el.setAttribute('data-comment-text',newText);
  }
  function handleScrollToComment(id){
    const el=editor?.view?.dom?.querySelector(`[data-comment-id="${id}"]`);
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.outline='2px solid #e6b800';setTimeout(()=>{el.style.outline='';},1500);}
    setActiveComment(id);
  }

  // Citations — insert superscript node into canvas, full text in sidebar
  function handleInsertCitation(text, format){
    if(!editor) return;
    const id=`cite_${Date.now()}`;
    const number=citations.length+1;
    const next=[...citations,{id,text,format,number,createdAt:Date.now()}];
    saveCitations(next);
    editor.chain().focus()
      .insertCitationRef({ citeId: id, citeNum: number, citeText: text })
      .run();
    if(!showCitations&&onToggleCitations)onToggleCitations();
  }
  function handleDeleteCitation(id){
    saveCitations(citations.filter(c=>c.id!==id));
    if(editor){
      // Find and delete the citationRef node with matching citeId
      const { state, view } = editor;
      const tr = state.tr;
      let deleted = false;
      state.doc.descendants((node, pos) => {
        if(node.type.name === 'citationRef' && node.attrs.citeId === id){
          tr.delete(pos, pos + node.nodeSize);
          deleted = true;
          return false;
        }
      });
      if(deleted) view.dispatch(tr);
    }
  }

  async function insertImage(){
    if(!editor) return;
    if(window.electronAPI?.openFile){
      const fp=await window.electronAPI.openFile([{name:'Images',extensions:['jpg','jpeg','png','gif','webp']}]);
      if(!fp) return;
      const ext=fp.split('.').pop().toLowerCase();
      const mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='gif'?'image/gif':ext==='webp'?'image/webp':'image/png';
      if(window.electronAPI.readFileBase64){
        try{const b64=await window.electronAPI.readFileBase64(fp);if(b64){editor.chain().focus().setResizableImage({src:`data:${mime};base64,${b64}`}).run();return;}}catch{}
      }
      editor.chain().focus().setResizableImage({src:`file:///${fp.replace(/\\/g,'/')}`}).run();
    }else{
      const input=document.createElement('input');input.type='file';input.accept='image/*';
      input.onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>editor.chain().focus().setResizableImage({src:ev.target.result}).run();r.readAsDataURL(file);};
      input.click();
    }
  }

  const { outerPad, pageWidth, padTop, padBottom, padLeft, padRight } = useMemo(()=>({
    outerPad:   Math.round(32*zoom/100),
    pageWidth:  Math.round(794*zoom/100),
    padTop:     Math.round((pageMargin.top    ?? 96)  * zoom/100),
    padBottom:  Math.round((pageMargin.bottom ?? 96)  * zoom/100),
    padLeft:    Math.round((pageMargin.left   ?? 110) * zoom/100),
    padRight:   Math.round((pageMargin.right  ?? 110) * zoom/100),
  }),[zoom, pageMargin]);



  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
      <style>{makeStyles(fontSize)}</style>
      <FormatBar editor={editor} zoom={zoom} onZoomChange={setZoom}
        onAddComment={handleAddComment} onInsertImage={insertImage}
        onInsertCitation={handleInsertCitation}
        showComments={showComments} onToggleComments={onToggleComments} commentCount={comments.length}
        showCitations={showCitations} onToggleCitations={onToggleCitations} citationCount={citations.length}/>

      <div style={{display:'flex',flex:1,minHeight:0}}>
        {/* Canvas column — takes flex:1, StatusBar sits at its bottom */}
        <div style={{display:'flex',flexDirection:'column',flex:1,minWidth:0,minHeight:0}}>
          <div className="canvas-bg"
            style={{
              flex:1, overflowY:'auto', overflowX:'auto',
              background:'var(--bg-sunken)',
              display:'flex', flexDirection:'column', alignItems:'center',
              padding:`${outerPad}px`,
              cursor:'text',
            }}>
            <div className="canvas-page"
              style={{
                width: pageWidth,
                flexShrink: 0,
                background:'var(--bg)',
                border:'1px solid var(--border)',
                borderRadius: 2,
                padding:`${padTop}px ${padRight}px ${padBottom}px ${padLeft}px`,
                boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
                boxSizing:'border-box',
                minHeight: Math.round(500*zoom/100),
              }}>
              {note?(
                <><TitleBlock note={note} zoom={zoom}/><EditorContent editor={editor} className="tiptap-editor"/></>
              ):(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:400,textAlign:'center',color:'var(--fg-muted)'}}>
                  <div style={{width:64,height:64,borderRadius:12,border:'1.5px solid var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,background:'var(--bg)',fontSize:28}}>✎</div>
                  <h3 style={{fontFamily:'var(--serif)',fontSize:24,fontWeight:500,color:'var(--fg)',marginBottom:8}}>No note open</h3>
                  <p style={{fontSize:14,maxWidth:300,lineHeight:1.6}}>Select a note from the sidebar or create a new one.</p>
                </div>
              )}
            </div>
          </div>
          {/* StatusBar lives here — only as wide as the canvas column */}
          {statusBar}
        </div>

        {/* Right sidebars — full height, no StatusBar */}
        {showComments&&(
          <CommentSidebar comments={comments} activeId={activeComment}
            onClose={onToggleComments} onDelete={handleDeleteComment}
            onEdit={handleEditComment} onScrollTo={handleScrollToComment}
            width={commentSidebarW} onResize={setCommentSidebarW}/>
        )}
        {showCitations&&(
          <CitationSidebar citations={citations}
            onClose={onToggleCitations}
            onInsert={handleInsertCitation}
            onDelete={handleDeleteCitation}
            width={citationSidebarW} onResize={setCitationSidebarW}/>
        )}
      </div>
    </div>
  );
}
