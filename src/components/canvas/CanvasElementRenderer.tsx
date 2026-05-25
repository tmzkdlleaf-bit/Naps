import React, { useRef, useCallback, useEffect, useState } from 'react'
import { CanvasElement } from '@/types'
import { useStore } from '@/stores/useStore'
import { getShapePath } from '@/utils/canvas'

interface Props {
  element: CanvasElement
  zoom: number
  isSelected: boolean
  isMultiSelected: boolean
  onDragStart: (e: React.MouseEvent, el: CanvasElement) => void
  onResizeStart: (e: React.MouseEvent, el: CanvasElement, handle: string) => void
}

const HANDLES = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br']
const handleCursors: Record<string, string> = {
  tl: 'nwse-resize', tm: 'ns-resize', tr: 'nesw-resize',
  ml: 'ew-resize', mr: 'ew-resize',
  bl: 'nesw-resize', bm: 'ns-resize', br: 'nwse-resize',
}

export const CanvasElementRenderer: React.FC<Props> = ({
  element: el, zoom, isSelected, isMultiSelected, onDragStart, onResizeStart
}) => {
  const updateElement = useStore(s => s.updateElement)
  const pushHistory = useStore(s => s.pushHistory)
  const activeTool = useStore(s => s.activeTool)
  const [editing, setEditing] = useState(false)
  const [editingInner, setEditingInner] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus()
      textRef.current.select()
    }
  }, [editing])

  const handleDoubleClick = useCallback(() => {
    if (el.locked) return
    if (el.type === 'text') setEditing(true)
    if (el.type === 'shape') setEditingInner(true)
  }, [el])

  const handleBlur = useCallback(() => {
    setEditing(false)
    setEditingInner(false)
    pushHistory()
  }, [pushHistory])

  const transform = `rotate(${el.rotation}deg) scaleX(${el.flipH ? -1 : 1}) scaleY(${el.flipV ? -1 : 1})`
  const showHandles = (isSelected || isMultiSelected) && !el.locked && activeTool === 'select'

  const style: React.CSSProperties = {
    position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
    transform, opacity: el.opacity, zIndex: el.zIndex,
    cursor: el.locked ? 'not-allowed' : activeTool === 'select' ? 'move' : 'default',
    display: el.visible ? undefined : 'none', userSelect: 'none',
  }

  const renderShape = () => {
    const { shapeType = 'rect', fill = '#e2e8f0', stroke = 'transparent', strokeWidth = 0, borderRadius = 0 } = el
    const w = el.width, h = el.height

    let shapeEl: React.ReactNode

    if (shapeType === 'rect') {
      shapeEl = (
        <rect x={strokeWidth/2} y={strokeWidth/2}
          width={w - strokeWidth} height={h - strokeWidth}
          rx={borderRadius} ry={borderRadius}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )
    } else if (shapeType === 'ellipse') {
      shapeEl = (
        <ellipse cx={w/2} cy={h/2} rx={w/2 - strokeWidth/2} ry={h/2 - strokeWidth/2}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      )
    } else if (['line_straight','line_dashed','line_dotted'].includes(shapeType)) {
      const dash = shapeType === 'line_dashed' ? '10,5' : shapeType === 'line_dotted' ? '2,5' : undefined
      const mid = `arr_${el.id}`
      return (
        <svg width={w} height={Math.max(h, (el.strokeWidth||2)+20)} viewBox={`0 0 ${w} ${Math.max(h, (el.strokeWidth||2)+20)}`}
          style={{ display:'block', overflow:'visible', position:'absolute', inset:0 }}>
          <defs>
            <marker id={mid} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={stroke||'#475569'} />
            </marker>
          </defs>
          <line x1={4} y1={Math.max(h,(el.strokeWidth||2)+20)/2}
            x2={w-4} y2={Math.max(h,(el.strokeWidth||2)+20)/2}
            stroke={stroke||'#475569'} strokeWidth={el.strokeWidth||2}
            strokeDasharray={dash}
            markerStart={el.arrowStart ? `url(#${mid})` : undefined}
            markerEnd={el.arrowEnd ? `url(#${mid})` : undefined} />
        </svg>
      )
    } else {
      const path = getShapePath(shapeType, w, h)
      shapeEl = <path d={path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    }

    const innerText = el.innerText
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        style={{ display:'block', overflow:'visible', position:'absolute', inset:0, pointerEvents:'none' }}>
        {shapeEl}
        {innerText && !editingInner && (
          <text x={w/2} y={h/2} textAnchor={el.innerTextAlign === 'left' ? 'start' : el.innerTextAlign === 'right' ? 'end' : 'middle'}
            dominantBaseline="central"
            fill={el.innerTextColor || '#111111'}
            fontSize={el.innerTextSize || 14}
            fontWeight={el.innerTextWeight || 'normal'}
            style={{ userSelect:'none' }}>
            {innerText}
          </text>
        )}
      </svg>
    )
  }

  const renderContent = () => {
    if (el.type === 'image') {
      return <img src={el.src} alt="" draggable={false}
        style={{ width:'100%', height:'100%', objectFit:'contain', pointerEvents:'none', display:'block' }} />
    }

    if (el.type === 'text') {
      const textStyle: React.CSSProperties = {
        width:'100%', height:'100%',
        fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: el.fontWeight,
        fontStyle: el.fontStyle, textDecoration: el.textDecoration, textAlign: el.textAlign,
        color: el.color, lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
        background: el.fill && el.fill !== 'transparent' ? el.fill : 'transparent',
        padding: '4px',
      }
      if (editing) {
        return <textarea ref={textRef} defaultValue={el.text}
          onChange={e => updateElement(el.id, { text: e.target.value })}
          onBlur={handleBlur}
          style={{ ...textStyle, border:'none', outline:'none', resize:'none', cursor:'text', overflow:'hidden', display:'block' }} />
      }
      return <div onDoubleClick={handleDoubleClick}
        style={{ ...textStyle, whiteSpace:'pre-wrap', wordBreak:'break-word', overflow:'hidden', pointerEvents:'none' }}>
        {el.text || '텍스트를 입력하세요'}
      </div>
    }

    if (el.type === 'shape' || el.type === 'line') {
      return (
        <>
          {renderShape()}
          {/* 도형 내 텍스트 편집 모드 */}
          {editingInner && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
              <textarea
                autoFocus
                defaultValue={el.innerText || ''}
                onBlur={e => { updateElement(el.id, { innerText: e.target.value }); handleBlur() }}
                style={{
                  background:'transparent', border:'none', outline:'none', resize:'none',
                  fontSize: el.innerTextSize || 14, color: el.innerTextColor || '#111',
                  fontWeight: el.innerTextWeight || 'normal', textAlign: el.innerTextAlign as any || 'center',
                  width:'90%', textShadow:'0 0 4px rgba(255,255,255,0.8)',
                }}
              />
            </div>
          )}
        </>
      )
    }
    return null
  }

  return (
    <div data-el-id={el.id} style={style}
      onMouseDown={e => { if (!el.locked && activeTool === 'select') onDragStart(e, el) }}
      onClick={e => { if (el.type === 'text' && !el.locked) { e.stopPropagation(); setEditing(true) } }}
      onDoubleClick={handleDoubleClick}>

      {isSelected && !isMultiSelected && (
        <div style={{ position:'absolute', inset:-2, border:'2px solid #4ade80', borderRadius:2, pointerEvents:'none', zIndex:1 }} />
      )}
      {isMultiSelected && (
        <div style={{ position:'absolute', inset:-1, border:'1.5px dashed #4ade80', borderRadius:2, pointerEvents:'none', zIndex:1 }} />
      )}

      {renderContent()}

      {showHandles && HANDLES.map(h => (
        <div key={h}
          onMouseDown={e => { e.stopPropagation(); onResizeStart(e, el, h) }}
          style={{
            position:'absolute', width:8, height:8, background:'#4ade80',
            border:'2px solid white', borderRadius:2, zIndex:10, cursor:handleCursors[h],
            ...getHandlePosition(h),
          }} />
      ))}

      {el.locked && (
        <div style={{ position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.5)', borderRadius:3, padding:'1px 3px', fontSize:10, color:'#fff', pointerEvents:'none' }}>🔒</div>
      )}
    </div>
  )
}

function getHandlePosition(h: string): React.CSSProperties {
  const off = -5, mid = 'calc(50% - 4px)'
  const positions: Record<string, React.CSSProperties> = {
    tl: { top:off, left:off }, tm: { top:off, left:mid }, tr: { top:off, right:off },
    ml: { top:mid, left:off }, mr: { top:mid, right:off },
    bl: { bottom:off, left:off }, bm: { bottom:off, left:mid }, br: { bottom:off, right:off },
  }
  return positions[h] || {}
}
