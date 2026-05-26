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
    showGrid, snapEnabled, watermark, watermarkEnabled,
    watermarkRotation, watermarkOpacity, watermarkSize,
    pages, currentPageIndex,
    setPageBackground,
  } = useStore()

  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])
  const dragRef = useRef<{ el: CanvasElement, startX: number, startY: number, elX: number, elY: number } | null>(null)
  const resizeRef = useRef<{ el: CanvasElement, handle: string, startX: number, startY: number, origW: number, origH: number, origX: number, origY: number } | null>(null)
  const selBoxRef = useRef<{ startX: number; startY: number } | null>(null)
  const [selBox, setSelBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // 도형/선 드래그 그리기
  const drawRef = useRef<{ startX: number; startY: number; elId: string } | null>(null)
  // 손 도구 패닝
  const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

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
      const { deleteSelected, duplicateSelected, undo, redo, ungroupSelected, groupSelected, copySelected, pasteSelected } = useStore.getState()
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateSelected() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') { e.preventDefault(); copySelected() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') { e.preventDefault(); pasteSelected() }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'g') { e.preventDefault(); groupSelected() }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') { e.preventDefault(); ungroupSelected() }
      if (e.key === 'Escape') { selectElement(null); setTool('select') }
      if (e.key === 'v') setTool('select')
      if (e.key === 't') setTool('text')
      if (e.key === 'h') setTool('hand')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 휠로 확대/축소 - passive: false 로 등록해야 preventDefault 가능
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
  }) // 의존성 없이 매 렌더마다 재등록해서 ref 확실히 연결

  // 손 도구: 스페이스바 누르는 동안도 패닝 활성화
  const [spaceDown, setSpaceDown] = useState(false)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  const isPanMode = activeTool === 'hand' || spaceDown

  // 손 도구 패닝
  const onWrapMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPanMode) return
    e.preventDefault()
    setIsPanning(true)
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: wrapRef.current?.scrollLeft || 0,
      scrollTop: wrapRef.current?.scrollTop || 0,
    }
    const onMove = (ev: MouseEvent) => {
      if (!panRef.current || !wrapRef.current) return
      wrapRef.current.scrollLeft = panRef.current.scrollLeft - (ev.clientX - panRef.current.startX)
      wrapRef.current.scrollTop = panRef.current.scrollTop - (ev.clientY - panRef.current.startY)
    }
    const onUp = () => {
      setIsPanning(false)
      panRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [isPanMode])

  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || isPanMode) return
    const pos = getCanvasPos(e.clientX, e.clientY, canvasRef.current, zoom)

    // 텍스트 도구: 클릭 즉시 편집 가능한 텍스트 생성
    if (activeTool === 'text') {
      const el = makeTextElement(pos.x, pos.y, elements.length)
      addElement(el)
      setTool('select')
      return
    }

    // 도형 드래그로 그리기
    if (activeTool === 'shape' || activeTool === 'line') {
      const el = activeTool === 'shape'
        ? makeShapeElement(pos.x, pos.y, 1, 1, elements.length, useStore.getState().activeShapeType)
        : makeLineElement(pos.x, pos.y, elements.length)
      addElement(el)
      drawRef.current = { startX: pos.x, startY: pos.y, elId: el.id }

      const onMove = (ev: MouseEvent) => {
        if (!drawRef.current || !canvasRef.current) return
        const p = getCanvasPos(ev.clientX, ev.clientY, canvasRef.current, zoom)
        const w = Math.abs(p.x - drawRef.current.startX)
        const h = Math.abs(p.y - drawRef.current.startY)
        const x = Math.min(p.x, drawRef.current.startX)
        const y = Math.min(p.y, drawRef.current.startY)
        updateElement(drawRef.current.elId, {
          x, y,
          width: Math.max(w, 4),
          height: activeTool === 'line' ? Math.max(h, 4) : Math.max(h, 4),
        })
      }
      const onUp = () => {
        pushHistory()
        drawRef.current = null
        setTool('select')
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      return
    }

    // 선택 도구: 드래그 다중 선택
    if (activeTool === 'select' && e.target === canvasRef.current) {
      selectElement(null)
      selBoxRef.current = { startX: pos.x, startY: pos.y }
      const onMove = (ev: MouseEvent) => {
        if (!selBoxRef.current || !canvasRef.current) return
        const p = getCanvasPos(ev.clientX, ev.clientY, canvasRef.current, zoom)
        setSelBox({
          x: Math.min(p.x, selBoxRef.current.startX),
          y: Math.min(p.y, selBoxRef.current.startY),
          w: Math.abs(p.x - selBoxRef.current.startX),
          h: Math.abs(p.y - selBoxRef.current.startY),
        })
      }
      const onUp = () => {
        const box = selBoxRef.current
        if (box) {
          const cur = { x: 0, y: 0, w: 0, h: 0 }
          setSelBox(prev => { if (prev) { cur.x=prev.x; cur.y=prev.y; cur.w=prev.w; cur.h=prev.h } return null })
          setTimeout(() => {
            const inBox = elements.filter(el =>
              el.x < cur.x+cur.w && el.x+el.width > cur.x &&
              el.y < cur.y+cur.h && el.y+el.height > cur.y
            )
            inBox.forEach((el, i) => selectElement(el.id, i > 0))
          }, 0)
        }
        setSelBox(null)
        selBoxRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
  }, [activeTool, elements, addElement, selectElement, setTool, zoom, updateElement, pushHistory])

  const onDragStart = useCallback((e: React.MouseEvent, el: CanvasElement) => {
    if (el.locked || activeTool !== 'select') return
    e.stopPropagation(); e.preventDefault()

    // Ctrl/Cmd 클릭으로 다중 선택 토글
    if (e.ctrlKey || e.metaKey) {
      selectElement(el.id, true)
      return
    }

    if (!selectedIds.includes(el.id)) selectElement(el.id, e.shiftKey)

    const state = useStore.getState()
    // 같은 groupId를 가진 요소들도 함께 선택
    const groupId = el.groupId
    const affectedIds = groupId
      ? state.elements.filter(e => e.groupId === groupId).map(e => e.id)
      : state.selectedIds.length > 1 ? state.selectedIds : [el.id]

    const startPositions = state.elements
      .filter(e => affectedIds.includes(e.id))
      .map(e => ({ id: e.id, x: e.x, y: e.y }))

    const startX = e.clientX, startY = e.clientY

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom
      const dy = (ev.clientY - startY) / zoom
      const cur = useStore.getState()

      if (affectedIds.length > 1) {
        startPositions.forEach(sp => {
          cur.updateElement(sp.id, { x: Math.round(sp.x + dx), y: Math.round(sp.y + dy) })
        })
      } else {
        const nx = startPositions[0].x + dx
        const ny = startPositions[0].y + dy
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
  }, [selectedIds, selectElement, zoom, elements, canvasWidth, canvasHeight, snapEnabled, updateElement, pushHistory, activeTool])

  const onResizeStart = useCallback((e: React.MouseEvent, el: CanvasElement, handle: string) => {
    e.stopPropagation(); e.preventDefault()
    resizeRef.current = { el, handle, startX: e.clientX, startY: e.clientY, origW: el.width, origH: el.height, origX: el.x, origY: el.y }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const { handle, startX, startY, origW, origH, origX, origY } = resizeRef.current
      const dx = (ev.clientX - startX) / zoom, dy = (ev.clientY - startY) / zoom
      let nw = origW, nh = origH, nx = origX, ny = origY

      if (handle === 'br') { nw = Math.max(4, origW + dx); nh = Math.max(4, origH + dy) }
      else if (handle === 'bl') { nw = Math.max(4, origW - dx); nx = origX + origW - nw; nh = Math.max(4, origH + dy) }
      else if (handle === 'tr') { nw = Math.max(4, origW + dx); nh = Math.max(4, origH - dy); ny = origY + origH - nh }
      else if (handle === 'tl') { nw = Math.max(4, origW - dx); nx = origX + origW - nw; nh = Math.max(4, origH - dy); ny = origY + origH - nh }
      else if (handle === 'mr') { nw = Math.max(4, origW + dx) }
      else if (handle === 'ml') { nw = Math.max(4, origW - dx); nx = origX + origW - nw }
      else if (handle === 'bm') { nh = Math.max(4, origH + dy) }
      else if (handle === 'tm') { nh = Math.max(4, origH - dy); ny = origY + origH - nh }

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
  const pageBackground = pages[currentPageIndex]?.background || '#ffffff'

  return (
    <div
      ref={wrapRef}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      onMouseDown={onWrapMouseDown}
      style={{
        flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative',
        background: 'var(--bg0)',
        backgroundImage: showGrid ? 'radial-gradient(var(--bg3) 1.5px, transparent 1.5px)' : undefined,
        backgroundSize: showGrid ? `${20*zoom}px ${20*zoom}px` : undefined,
        cursor: isPanMode ? (isPanning ? 'grabbing' : 'grab') : 'default',
      }}>

      <div style={{ position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'center center', flexShrink: 0 }}>
        {renderDistanceGuides()}

        <div id="naps-canvas" ref={canvasRef} onMouseDown={onCanvasMouseDown}
          style={{
            width: canvasWidth, height: canvasHeight,
            background: pageBackground,
            position: 'relative', overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.12), 0 8px 48px rgba(0,0,0,0.35)',
            cursor: isPanMode ? (isPanning ? 'grabbing' : 'grab')
              : activeTool === 'text' ? 'text'
              : activeTool === 'shape' || activeTool === 'line' ? 'crosshair'
              : 'default',
          }}>

          {snapGuides.map((g, i) => (
            <div key={i} style={{ position: 'absolute', zIndex: 9999, pointerEvents: 'none', background: 'rgba(74,222,128,0.7)', ...(g.type==='h' ? {left:0,right:0,top:g.pos,height:1} : {top:0,bottom:0,left:g.pos,width:1}) }} />
          ))}

          {watermarkEnabled && watermark && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', pointerEvents: 'none', zIndex: 9998,
              transform: `rotate(${watermarkRotation ?? -30}deg)`,
              fontSize: Math.max(16, canvasWidth * ((watermarkSize ?? 5) / 100)),
              fontWeight: 500,
              color: `rgba(0,0,0,${(watermarkOpacity ?? 8) / 100})`,
              whiteSpace: 'nowrap', userSelect: 'none',
            }}>
              {watermark}
            </div>
          )}

          {selBox && (
            <div style={{ position: 'absolute', zIndex: 9997, pointerEvents: 'none', left: selBox.x, top: selBox.y, width: selBox.w, height: selBox.h, border: '1.5px dashed #4ade80', background: 'rgba(74,222,128,0.06)' }} />
          )}

          {sortedEls.map(el => (
            <CanvasElementRenderer key={el.id} element={el} zoom={zoom}
              isSelected={selectedIds.length === 1 && selectedIds[0] === el.id}
              isMultiSelected={selectedIds.length > 1 && selectedIds.includes(el.id)}
              onDragStart={onDragStart} onResizeStart={onResizeStart} />
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} style={{ color: 'var(--text1)', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>−</button>
        <span style={{ minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(4, zoom + 0.1))} style={{ color: 'var(--text1)', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>+</button>
        <button onClick={() => { const z = fitZoom(canvasWidth, canvasHeight, wrapRef.current?.clientWidth || 800, wrapRef.current?.clientHeight || 600); setZoom(z) }} style={{ color: 'var(--text2)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>맞춤</button>
      </div>
    </div>
  )
}
