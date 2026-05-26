import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { CanvasElementRenderer } from './CanvasElementRenderer'
import { CanvasElement } from '@/types'
import {
  snapElement, getCanvasPos, makeTextElement,
  makeShapeElement, makeLineElement, makeImageElement,
  loadImageDimensions, fitZoom
} from '@/utils/canvas'

interface SnapGuide { type: 'h' | 'v'; pos: number }

export const Canvas: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1) // zoom을 ref로도 관리 — 클로저 문제 해결

  const {
    elements, selectedIds, selectElement, addElement, updateElement,
    updateElements, pushHistory, activeTool, setTool,
    canvasWidth, canvasHeight, zoom, setZoom,
    showGrid, snapEnabled,
    watermark, watermarkEnabled, watermarkRotation, watermarkOpacity, watermarkSize,
    pages, currentPageIndex,
  } = useStore()

  // zoomRef 동기화
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])
  const selBoxRef = useRef<{ startX: number; startY: number } | null>(null)
  const selBoxDataRef = useRef<{ x:number;y:number;w:number;h:number }|null>(null)
  const [selBox, setSelBox] = useState<{ x:number;y:number;w:number;h:number }|null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panRef = useRef<{ startX:number; startY:number; scrollLeft:number; scrollTop:number }|null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const isPanMode = activeTool === 'hand' || spaceDown

  // ── 자동 맞춤 줌 ──
  useEffect(() => {
    const fit = () => {
      if (!wrapRef.current) return
      const z = fitZoom(canvasWidth, canvasHeight, wrapRef.current.clientWidth, wrapRef.current.clientHeight)
      setZoom(z)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [canvasWidth, canvasHeight])

  // ── 휠 확대/축소 (passive:false 필수) ──
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 1.08 : 0.92
      setZoom(z => Math.min(Math.max(z * delta, 0.05), 5))
    }
    wrap.addEventListener('wheel', onWheel, { passive: false })
    return () => wrap.removeEventListener('wheel', onWheel)
  }, []) // 마운트 1회만 등록 — wrapRef는 마운트 후 변경 없음

  // ── 스페이스바 패닝 ──
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target as HTMLElement).matches('input,textarea')) { e.preventDefault(); setSpaceDown(true) } }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceDown(false) }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  // ── 키보드 단축키 ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const s = useStore.getState()

      if ((e.key === 'Delete' || e.key === 'Backspace') && (target as any).dataset?.pageIdx !== undefined) {
        e.preventDefault()
        const idx = parseInt((target as any).dataset.pageIdx)
        if (!isNaN(idx)) s.deletePage(idx)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') s.deleteSelected()
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); s.duplicateSelected() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') { e.preventDefault(); s.copySelected() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') { e.preventDefault(); s.pasteSelected() }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'g') { e.preventDefault(); s.groupSelected() }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') { e.preventDefault(); s.ungroupSelected() }
      if (e.key === 'Escape') { selectElement(null); setTool('select') }
      if (e.key === 'v') setTool('select')
      if (e.key === 't') setTool('text')
      if (e.key === 'h') setTool('hand')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── 손 도구 패닝 ──
  const onWrapMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPanMode) return
    e.preventDefault()
    setIsPanning(true)
    panRef.current = { startX: e.clientX, startY: e.clientY, scrollLeft: wrapRef.current?.scrollLeft || 0, scrollTop: wrapRef.current?.scrollTop || 0 }
    const onMove = (ev: MouseEvent) => {
      if (!panRef.current || !wrapRef.current) return
      wrapRef.current.scrollLeft = panRef.current.scrollLeft - (ev.clientX - panRef.current.startX)
      wrapRef.current.scrollTop = panRef.current.scrollTop - (ev.clientY - panRef.current.startY)
    }
    const onUp = () => {
      setIsPanning(false); panRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [isPanMode])

  // ── 캔버스 mousedown ──
  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || isPanMode) return
    const z = zoomRef.current
    const pos = getCanvasPos(e.clientX, e.clientY, canvasRef.current, z)
    // 항상 최신 activeTool을 store에서 직접 읽기 (클로저 문제 방지)
    const tool = useStore.getState().activeTool

    // 텍스트 추가
    if (tool === 'text') {
      const el = makeTextElement(pos.x, pos.y, useStore.getState().elements.length)
      addElement(el); setTool('select'); return
    }

    // 도형/선 드래그로 그리기
    if (tool === 'shape' || tool === 'line') {
      const st = useStore.getState()
      const el = tool === 'shape'
        ? makeShapeElement(pos.x, pos.y, 4, 4, st.elements.length, st.activeShapeType)
        : makeLineElement(pos.x, pos.y, st.elements.length)
      addElement(el)
      const startX = pos.x, startY = pos.y, elId = el.id
      const onMove = (ev: MouseEvent) => {
        if (!canvasRef.current) return
        const p = getCanvasPos(ev.clientX, ev.clientY, canvasRef.current, zoomRef.current)
        useStore.getState().updateElement(elId, {
          x: Math.min(p.x, startX), y: Math.min(p.y, startY),
          width: Math.max(Math.abs(p.x - startX), 4),
          height: Math.max(Math.abs(p.y - startY), 4),
        })
      }
      const onUp = () => {
        pushHistory(); setTool('select')
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return
    }

    // 드래그 선택 박스 — e.target 조건 제거해서 아무데서나 드래그 선택 가능
    if (tool === 'select') {
      // 요소 위에서 시작한 경우는 onDragStart가 처리하므로 캔버스 직접 클릭만
      if (e.target !== canvasRef.current) return
      selectElement(null)
      selBoxRef.current = { startX: pos.x, startY: pos.y }
      const onMove = (ev: MouseEvent) => {
        if (!selBoxRef.current || !canvasRef.current) return
        const p = getCanvasPos(ev.clientX, ev.clientY, canvasRef.current, zoomRef.current)
        const box = {
          x: Math.min(p.x, selBoxRef.current.startX),
          y: Math.min(p.y, selBoxRef.current.startY),
          w: Math.abs(p.x - selBoxRef.current.startX),
          h: Math.abs(p.y - selBoxRef.current.startY),
        }
        selBoxDataRef.current = box
        setSelBox(box)
      }
      const onUp = () => {
        const cur = selBoxDataRef.current
        setSelBox(null); selBoxDataRef.current = null; selBoxRef.current = null
        if (cur && (cur.w > 4 || cur.h > 4)) {
          const els = useStore.getState().elements
          els.filter(el =>
            el.x < cur.x + cur.w && el.x + el.width > cur.x &&
            el.y < cur.y + cur.h && el.y + el.height > cur.y
          ).forEach((el, i) => selectElement(el.id, i > 0))
        }
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }, [addElement, selectElement, setTool, pushHistory, isPanMode])

  // ── 요소 드래그 이동 ──
  const onDragStart = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    if (el.locked || activeTool !== 'select') return
    e.stopPropagation(); e.preventDefault()

    // Ctrl+클릭 다중 선택
    if (e.ctrlKey || e.metaKey) { selectElement(el.id, true); return }
    if (!selectedIds.includes(el.id)) selectElement(el.id, e.shiftKey)

    const st = useStore.getState()
    const groupId = el.groupId
    const affectedIds = groupId
      ? st.elements.filter(e => e.groupId === groupId).map(e => e.id)
      : st.selectedIds.length > 1 ? [...st.selectedIds] : [el.id]

    const startPositions = st.elements
      .filter(e => affectedIds.includes(e.id))
      .map(e => ({ id: e.id, x: e.x, y: e.y }))
    const startX = e.clientX, startY = e.clientY

    const onMove = (ev: MouseEvent) => {
      const z = zoomRef.current
      const dx = (ev.clientX - startX) / z
      const dy = (ev.clientY - startY) / z
      const cur = useStore.getState()
      if (affectedIds.length > 1) {
        startPositions.forEach(sp => cur.updateElement(sp.id, { x: Math.round(sp.x + dx), y: Math.round(sp.y + dy) }))
      } else {
        const nx = startPositions[0].x + dx, ny = startPositions[0].y + dy
        const others = cur.elements.filter(o => o.id !== el.id)
        const snapped = snapElement(nx, ny, el.width, el.height, cur.canvasWidth, cur.canvasHeight, others, cur.snapEnabled)
        setSnapGuides(snapped.guides)
        cur.updateElement(el.id, { x: snapped.x, y: snapped.y })
      }
    }
    const onUp = () => {
      setSnapGuides([]); pushHistory()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [selectedIds, selectElement, activeTool, pushHistory])

  // ── 크기 조절 ──
  const onResizeStart = useCallback((e: React.MouseEvent, el: CanvasElement, handle: string) => {
    e.stopPropagation(); e.preventDefault()
    const orig = { w: el.width, h: el.height, x: el.x, y: el.y }
    const startX = e.clientX, startY = e.clientY
    const onMove = (ev: MouseEvent) => {
      const z = zoomRef.current
      const dx = (ev.clientX - startX) / z, dy = (ev.clientY - startY) / z
      let { w: nw, h: nh, x: nx, y: ny } = orig
      if (handle==='br') { nw=Math.max(4,orig.w+dx); nh=Math.max(4,orig.h+dy) }
      else if (handle==='bl') { nw=Math.max(4,orig.w-dx); nx=orig.x+orig.w-nw; nh=Math.max(4,orig.h+dy) }
      else if (handle==='tr') { nw=Math.max(4,orig.w+dx); nh=Math.max(4,orig.h-dy); ny=orig.y+orig.h-nh }
      else if (handle==='tl') { nw=Math.max(4,orig.w-dx); nx=orig.x+orig.w-nw; nh=Math.max(4,orig.h-dy); ny=orig.y+orig.h-nh }
      else if (handle==='mr') { nw=Math.max(4,orig.w+dx) }
      else if (handle==='ml') { nw=Math.max(4,orig.w-dx); nx=orig.x+orig.w-nw }
      else if (handle==='bm') { nh=Math.max(4,orig.h+dy) }
      else if (handle==='tm') { nh=Math.max(4,orig.h-dy); ny=orig.y+orig.h-nh }
      updateElement(el.id, { width:Math.round(nw), height:Math.round(nh), x:Math.round(nx), y:Math.round(ny) })
    }
    const onUp = () => {
      pushHistory()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [updateElement, pushHistory])

  // ── 파일 드롭 ──
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return
    const pos = getCanvasPos(e.clientX, e.clientY, canvasRef.current, zoomRef.current)
    const src = e.dataTransfer.getData('asset-src')
    const st = useStore.getState()
    if (src) {
      const dims = await loadImageDimensions(src)
      const w = Math.min(250, st.canvasWidth / 2), h = w / (dims.width / dims.height)
      addElement(makeImageElement(src, pos.x-w/2, pos.y-h/2, w, h, st.elements.length))
    }
    for (const file of Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))) {
      const url = URL.createObjectURL(file)
      const dims = await loadImageDimensions(url)
      const w = Math.min(300, st.canvasWidth / 2), h = w / (dims.width / dims.height)
      addElement(makeImageElement(url, pos.x-w/2, pos.y-h/2, w, h, st.elements.length))
    }
  }, [addElement])

  // ── 거리 가이드 ──
  const renderDistanceGuides = () => {
    if (selectedIds.length !== 1) return null
    const sel = elements.find(e => e.id === selectedIds[0])
    if (!sel) return null
    const SL=sel.x, SR=sel.x+sel.width, ST=sel.y, SB=sel.y+sel.height
    const SCX=sel.x+sel.width/2, SCY=sel.y+sel.height/2
    const nodes: React.ReactNode[] = []
    elements.forEach(el => {
      if (el.id === sel.id) return
      const EL=el.x, ER=el.x+el.width, ET=el.y, EB=el.y+el.height
      const oY=ST<EB&&SB>ET, oX=SL<ER&&SR>EL
      const line = (key:string, l:number, t:number, w:number, h:number) =>
        <div key={key} style={{position:'absolute',pointerEvents:'none',zIndex:9999,left:l,top:t,width:w,height:h,background:'rgba(248,113,113,0.85)'}}/>
      const lbl = (key:string, l:number, t:number, v:number) =>
        <div key={key} style={{position:'absolute',pointerEvents:'none',zIndex:10000,left:l,top:t,transform:'translate(-50%,-50%)',background:'#ef4444',color:'#fff',fontSize:9,fontWeight:700,padding:'1px 4px',borderRadius:3,whiteSpace:'nowrap'}}>{Math.round(v)}px</div>
      if (oY) {
        if (EL>SR) { const g=EL-SR; nodes.push(line(`R-${el.id}`,SR,SCY-.5,g,1),lbl(`Rl-${el.id}`,SR+g/2,SCY-8,g)) }
        if (ER<SL) { const g=SL-ER; nodes.push(line(`L-${el.id}`,ER,SCY-.5,g,1),lbl(`Ll-${el.id}`,ER+g/2,SCY-8,g)) }
      }
      if (oX) {
        if (ET>SB) { const g=ET-SB; nodes.push(line(`D-${el.id}`,SCX-.5,SB,1,g),lbl(`Dl-${el.id}`,SCX+6,SB+g/2,g)) }
        if (EB<ST) { const g=ST-EB; nodes.push(line(`U-${el.id}`,SCX-.5,EB,1,g),lbl(`Ul-${el.id}`,SCX+6,EB+g/2,g)) }
      }
    })
    return nodes
  }

  const sortedEls = [...elements].sort((a,b) => a.zIndex-b.zIndex)
  const pageBg = pages[currentPageIndex]?.background || '#ffffff'

  return (
    <div ref={wrapRef} onDrop={onDrop} onDragOver={e=>e.preventDefault()} onMouseDown={onWrapMouseDown}
      style={{
        flex:1, overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center',
        padding:48, position:'relative', background:'var(--bg0)',
        backgroundImage: showGrid ? 'radial-gradient(var(--bg3) 1.5px, transparent 1.5px)' : undefined,
        backgroundSize: showGrid ? `${20*zoom}px ${20*zoom}px` : undefined,
        cursor: isPanMode ? (isPanning?'grabbing':'grab') : 'default',
      }}>

      <div style={{ position:'relative', transform:`scale(${zoom})`, transformOrigin:'center center', flexShrink:0 }}>
        {renderDistanceGuides()}

        <div id="naps-canvas" ref={canvasRef} onMouseDown={onCanvasMouseDown}
          style={{
            width:canvasWidth, height:canvasHeight, background:pageBg,
            position:'relative', overflow:'hidden', flexShrink:0,
            boxShadow:'0 0 0 1px rgba(0,0,0,0.12), 0 8px 48px rgba(0,0,0,0.35)',
            cursor: isPanMode ? (isPanning?'grabbing':'grab')
              : activeTool==='text' ? 'text'
              : activeTool==='shape'||activeTool==='line' ? 'crosshair'
              : 'default',
          }}>

          {snapGuides.map((g,i) => (
            <div key={i} style={{position:'absolute',zIndex:9999,pointerEvents:'none',background:'rgba(74,222,128,0.7)',...(g.type==='h'?{left:0,right:0,top:g.pos,height:1}:{top:0,bottom:0,left:g.pos,width:1})}}/>
          ))}

          {watermarkEnabled && watermark && (
            <div style={{
              position:'absolute', inset:0, display:'flex', alignItems:'center',
              justifyContent:'center', pointerEvents:'none', zIndex:9998,
              transform:`rotate(${watermarkRotation??-30}deg)`,
              fontSize:Math.max(16, canvasWidth*((watermarkSize??5)/100)),
              fontWeight:500, color:`rgba(0,0,0,${(watermarkOpacity??8)/100})`,
              whiteSpace:'nowrap', userSelect:'none',
            }}>{watermark}</div>
          )}

          {selBox && (
            <div style={{position:'absolute',zIndex:9997,pointerEvents:'none',left:selBox.x,top:selBox.y,width:selBox.w,height:selBox.h,border:'1.5px dashed #4ade80',background:'rgba(74,222,128,0.06)'}}/>
          )}

          {sortedEls.map(el => (
            <CanvasElementRenderer key={el.id} element={el} zoom={zoom}
              isSelected={selectedIds.length===1&&selectedIds[0]===el.id}
              isMultiSelected={selectedIds.length>1&&selectedIds.includes(el.id)}
              onDragStart={onDragStart} onResizeStart={onResizeStart}/>
          ))}
        </div>
      </div>

      <div style={{position:'absolute',bottom:16,right:16,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'4px 10px',fontSize:11,color:'var(--text2)',fontFamily:'var(--font-mono)',display:'flex',alignItems:'center',gap:8}}>
        <button onClick={()=>setZoom(z=>Math.max(0.05,z-0.1))} style={{color:'var(--text1)',fontSize:16,lineHeight:1,background:'none',border:'none',cursor:'pointer',padding:'0 2px'}}>−</button>
        <span style={{minWidth:36,textAlign:'center'}}>{Math.round(zoom*100)}%</span>
        <button onClick={()=>setZoom(z=>Math.min(5,z+0.1))} style={{color:'var(--text1)',fontSize:16,lineHeight:1,background:'none',border:'none',cursor:'pointer',padding:'0 2px'}}>+</button>
        <button onClick={()=>{const z=fitZoom(canvasWidth,canvasHeight,wrapRef.current?.clientWidth||800,wrapRef.current?.clientHeight||600);setZoom(z)}} style={{color:'var(--text2)',fontSize:11,background:'none',border:'none',cursor:'pointer',marginLeft:4,padding:'2px 6px',borderRadius:4,border:'1px solid var(--border)'}}>맞춤</button>
      </div>
    </div>
  )
}
