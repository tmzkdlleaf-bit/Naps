import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { CanvasElementRenderer } from './CanvasElementRenderer'
import { CanvasElement } from '@/types'
import { snapElement, getCanvasPos, makeTextElement, makeShapeElement, makeLineElement, makeImageElement, loadImageDimensions, fitZoom } from '@/utils/canvas'

interface SnapGuide { type: 'h' | 'v'; pos: number }

export const Canvas: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const {
    elements, selectedIds, selectElement, addElement, updateElement,
    updateElements, pushHistory, activeTool, setTool,
    canvasWidth, canvasHeight, zoom, setZoom,
    showGrid, snapEnabled, watermark, watermarkEnabled, pages, currentPageIndex,
  } = useStore()

  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])
  const dragRef = useRef<{ el: CanvasElement, startX: number, startY: number, elX: number, elY: number } | null>(null)
  const resizeRef = useRef<{ el: CanvasElement, handle: string, startX: number, startY: number, origW: number, origH: number, origX: number, origY: number, ratio: number } | null>(null)
  const selBoxRef = useRef<{ startX: number; startY: number } | null>(null)
  const [selBox, setSelBox] = useState<{ x:number;y:number;w:number;h:number }|null>(null)

  // Auto-fit zoom
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

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const { deleteSelected, duplicateSelected, undo, redo, ungroupSelected } = useStore.getState()
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateSelected() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') { e.preventDefault(); useStore.getState().groupSelected() }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') { e.preventDefault(); ungroupSelected() }
      if (e.key === 'Escape') { selectElement(null); setTool('select') }
      if (e.key === 'v') setTool('select')
      if (e.key === 't') setTool('text')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 단순 휠로 확대/축소 (Ctrl 필요 없음)
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 1.1 : 0.9
    setZoom(Math.min(Math.max(zoom * delta, 0.1), 4))
  }, [zoom, setZoom])

  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const pos = getCanvasPos(e.clientX, e.clientY, canvasRef.current, zoom)

    if (activeTool === 'text') {
      const el = makeTextElement(pos.x, pos.y, elements.length)
      addElement(el); setTool('select'); return
    }
    if (activeTool === 'shape') {
      const el = makeShapeElement(pos.x, pos.y, 120, 80, elements.length)
      addElement(el); setTool('select'); return
    }
    if (activeTool === 'line') {
      const el = makeLineElement(pos.x, pos.y, elements.length)
      addElement(el); setTool('select'); return
    }
    if (activeTool === 'select' && e.target === canvasRef.current) {
      selectElement(null)
      selBoxRef.current = { startX: pos.x, startY: pos.y }
      const onMove = (ev: MouseEvent) => {
        if (!selBoxRef.current || !canvasRef.current) return
        const p = getCanvasPos(ev.clientX, ev.clientY, canvasRef.current, zoom)
        const x = Math.min(p.x, selBoxRef.current.startX)
        const y = Math.min(p.y, selBoxRef.current.startY)
        const w = Math.abs(p.x - selBoxRef.current.startX)
        const h = Math.abs(p.y - selBoxRef.current.startY)
        setSelBox({ x, y, w, h })
      }
      const onUp = () => {
        if (selBoxRef.current && selBox) {
          const { x, y, w, h } = selBox
          const inBox = elements.filter(el => el.x < x+w && el.x+el.width > x && el.y < y+h && el.y+el.height > y)
          if (inBox.length > 0) {
            inBox.forEach((el, i) => selectElement(el.id, i > 0))
          }
        }
        setSelBox(null)
        selBoxRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }, [activeTool, elements, addElement, selectElement, setTool, zoom, selBox])

  const onDragStart = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    if (el.locked) return
    e.stopPropagation(); e.preventDefault()
    if (!selectedIds.includes(el.id)) selectElement(el.id, e.shiftKey)
    dragRef.current = { el, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !canvasRef.current) return
      const dx = (ev.clientX - dragRef.current.startX) / zoom
      const dy = (ev.clientY - dragRef.current.startY) / zoom
      const nx = dragRef.current.elX + dx, ny = dragRef.current.elY + dy
      const others = elements.filter(o => o.id !== el.id)
      const snapped = snapElement(nx, ny, el.width, el.height, canvasWidth, canvasHeight, others, snapEnabled)
      setSnapGuides(snapped.guides)
      updateElement(el.id, { x: snapped.x, y: snapped.y })
    }
    const onUp = () => {
      setSnapGuides([]); pushHistory()
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [selectedIds, selectElement, zoom, elements, canvasWidth, canvasHeight, snapEnabled, updateElement, pushHistory])

  const onResizeStart = useCallback((e: React.MouseEvent, el: CanvasElement, handle: string) => {
    e.stopPropagation(); e.preventDefault()
    resizeRef.current = { el, handle, startX: e.clientX, startY: e.clientY, origW: el.width, origH: el.height, origX: el.x, origY: el.y, ratio: el.width / el.height }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const { handle, startX, startY, origW, origH, origX, origY, ratio } = resizeRef.current
      const dx = (ev.clientX - startX) / zoom, dy = (ev.clientY - startY) / zoom
      let nw = origW, nh = origH, nx = origX, ny = origY

      if (handle === 'br') { nw = Math.max(20, origW + dx); nh = Math.max(20, origH + dy) }
      else if (handle === 'bl') { nw = Math.max(20, origW - dx); nx = origX + origW - nw; nh = Math.max(20, origH + dy) }
      else if (handle === 'tr') { nw = Math.max(20, origW + dx); nh = Math.max(20, origH - dy); ny = origY + origH - nh }
      else if (handle === 'tl') { nw = Math.max(20, origW - dx); nx = origX + origW - nw; nh = Math.max(20, origH - dy); ny = origY + origH - nh }
      else if (handle === 'mr') { nw = Math.max(20, origW + dx) }
      else if (handle === 'ml') { nw = Math.max(20, origW - dx); nx = origX + origW - nw }
      else if (handle === 'bm') { nh = Math.max(20, origH + dy) }
      else if (handle === 'tm') { nh = Math.max(20, origH - dy); ny = origY + origH - nh }

      updateElement(el.id, { width: Math.round(nw), height: Math.round(nh), x: Math.round(nx), y: Math.round(ny) })
    }
    const onUp = () => {
      pushHistory(); resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [zoom, updateElement, pushHistory])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return
    const pos = getCanvasPos(e.clientX, e.clientY, canvasRef.current, zoom)
    const src = e.dataTransfer.getData('asset-src')
    if (src) {
      const dims = await loadImageDimensions(src)
      const ratio = dims.width / dims.height, w = Math.min(250, canvasWidth / 2), h = w / ratio
      addElement(makeImageElement(src, pos.x - w/2, pos.y - h/2, w, h, elements.length))
    }
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    for (const file of files) {
      const url = URL.createObjectURL(file)
      const dims = await loadImageDimensions(url)
      const ratio = dims.width / dims.height, w = Math.min(300, canvasWidth / 2), h = w / ratio
      addElement(makeImageElement(url, pos.x - w/2, pos.y - h/2, w, h, elements.length))
    }
  }, [zoom, canvasWidth, elements, addElement])

  // 거리 가이드
  const renderDistanceGuides = () => {
    if (selectedIds.length !== 1) return null
    const sel = elements.find(e => e.id === selectedIds[0])
    if (!sel) return null
    const SL=sel.x, SR=sel.x+sel.width, ST=sel.y, SB=sel.y+sel.height
    const SCX=sel.x+sel.width/2, SCY=sel.y+sel.height/2
    const guides: React.ReactNode[] = []

    elements.forEach(el => {
      if (el.id === sel.id) return
      const EL=el.x, ER=el.x+el.width, ET=el.y, EB=el.y+el.height
      const overlapY=ST<EB&&SB>ET, overlapX=SL<ER&&SR>EL

      if (overlapY) {
        if (EL > SR) {
          const gap = EL - SR
          guides.push(
            <div key={`R-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:SR, top:SCY-0.5, width:gap, height:1, background:'rgba(248,113,113,0.8)' }} />,
            <div key={`Rl-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:SR+gap/2, top:SCY-10, transform:'translateX(-50%)', background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap' }}>{Math.round(gap)}px</div>
          )
        }
        if (ER < SL) {
          const gap = SL - ER
          guides.push(
            <div key={`L-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:ER, top:SCY-0.5, width:gap, height:1, background:'rgba(248,113,113,0.8)' }} />,
            <div key={`Ll-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:ER+gap/2, top:SCY-10, transform:'translateX(-50%)', background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap' }}>{Math.round(gap)}px</div>
          )
        }
      }
      if (overlapX) {
        if (ET > SB) {
          const gap = ET - SB
          guides.push(
            <div key={`D-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:SCX-0.5, top:SB, width:1, height:gap, background:'rgba(248,113,113,0.8)' }} />,
            <div key={`Dl-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:SCX+4, top:SB+gap/2, transform:'translateY(-50%)', background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap' }}>{Math.round(gap)}px</div>
          )
        }
        if (EB < ST) {
          const gap = ST - EB
          guides.push(
            <div key={`U-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:SCX-0.5, top:EB, width:1, height:gap, background:'rgba(248,113,113,0.8)' }} />,
            <div key={`Ul-${el.id}`} style={{ position:'absolute', pointerEvents:'none', zIndex:9999, left:SCX+4, top:EB+gap/2, transform:'translateY(-50%)', background:'#ef4444', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap' }}>{Math.round(gap)}px</div>
          )
        }
      }
    })
    return guides
  }

  const sortedEls = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div ref={wrapRef} onWheel={onWheel} onDrop={onDrop} onDragOver={e => e.preventDefault()}
      style={{
        flex:1, overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center',
        padding:32, position:'relative', background:'var(--bg0)',
        backgroundImage: showGrid ? 'radial-gradient(var(--bg3) 1px, transparent 1px)' : undefined,
        backgroundSize: showGrid ? `${20*zoom}px ${20*zoom}px` : undefined,
      }}>

      {/* 줌 래퍼 — 거리 가이드를 overflow:hidden 밖에서 렌더 */}
      <div style={{ position:'relative', transform:`scale(${zoom})`, transformOrigin:'center center', flexShrink:0 }}>
        {/* 거리 가이드 */}
        {renderDistanceGuides()}

        {/* 캔버스 */}
        <div id="naps-canvas" ref={canvasRef} onMouseDown={onCanvasMouseDown}
          style={{
            width:canvasWidth, height:canvasHeight,
            background: pages[currentPageIndex]?.background || '#ffffff',
            position:'relative', overflow:'hidden', flexShrink:0,
            boxShadow:'0 0 0 1px rgba(0,0,0,0.1), 0 8px 48px rgba(0,0,0,0.4)',
            cursor: activeTool==='text'?'text':activeTool==='shape'?'crosshair':activeTool==='line'?'crosshair':'default',
          }}>

          {/* 스냅 가이드 */}
          {snapGuides.map((g, i) => (
            <div key={i} style={{ position:'absolute', zIndex:9999, pointerEvents:'none', background:'rgba(74,222,128,0.7)', ...(g.type==='h' ? {left:0,right:0,top:g.pos,height:1} : {top:0,bottom:0,left:g.pos,width:1}) }} />
          ))}

          {/* 워터마크 */}
          {watermarkEnabled && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:9998, transform:'rotate(-30deg)', fontSize:Math.max(16,canvasWidth*0.05), fontWeight:500, color:'rgba(0,0,0,0.08)', whiteSpace:'nowrap', userSelect:'none' }}>
              {watermark}
            </div>
          )}

          {/* 드래그 선택 박스 */}
          {selBox && (
            <div style={{ position:'absolute', zIndex:9997, pointerEvents:'none', left:selBox.x, top:selBox.y, width:selBox.w, height:selBox.h, border:'1.5px dashed #4ade80', background:'rgba(74,222,128,0.06)' }} />
          )}

          {sortedEls.map(el => (
            <CanvasElementRenderer key={el.id} element={el} zoom={zoom}
              isSelected={selectedIds.length===1 && selectedIds[0]===el.id}
              isMultiSelected={selectedIds.length>1 && selectedIds.includes(el.id)}
              onDragStart={onDragStart} onResizeStart={onResizeStart} />
          ))}
        </div>
      </div>

      {/* 줌 인디케이터 */}
      <div style={{ position:'absolute', bottom:16, right:16, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px', fontSize:11, color:'var(--text2)', fontFamily:'var(--font-mono)', display:'flex', alignItems:'center', gap:6 }}>
        <button onClick={() => setZoom(Math.max(0.1, zoom-0.1))} style={{ color:'var(--text1)', fontSize:14, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>−</button>
        <span>{Math.round(zoom*100)}%</span>
        <button onClick={() => setZoom(Math.min(4, zoom+0.1))} style={{ color:'var(--text1)', fontSize:14, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>+</button>
        <button onClick={() => { const z=fitZoom(canvasWidth,canvasHeight,wrapRef.current?.clientWidth||800,wrapRef.current?.clientHeight||600); setZoom(z) }}
          style={{ color:'var(--text2)', fontSize:10, background:'none', border:'none', cursor:'pointer', marginLeft:2 }}>맞춤</button>
      </div>
    </div>
  )
}
