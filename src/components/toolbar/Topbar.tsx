import React, { useState } from 'react'
import {
  MousePointer2, Type, Square, Hand, Minus,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Layers, FlipHorizontal2, FlipVertical2, RotateCw, Trash2,
  Undo2, Redo2, Grid3X3, Magnet, Save, FileDown, Link,
  Droplets, Sun, Moon, Leaf, Sparkles, Copy, Lock,
  ChevronDown, Triangle, Circle, Star, ArrowRight, MessageSquare, Minus as LineIcon,
  Group, Ungroup,
} from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { exportToPDF, generateShareLink, copyToClipboard } from '@/utils/export'
import { makeShapeElement, makeLineElement } from '@/utils/canvas'
import toast from 'react-hot-toast'

const FONTS = [
  'Noto Sans KR', 'Nanum Gothic', 'Nanum Myeongjo', 'Nanum Pen Script',
  'Black Han Sans', 'Jua', 'Gugi', 'Hahmlet',
  'DM Sans', 'Georgia', 'Arial', 'Helvetica', 'Courier New', 'Verdana',
]
const FONT_SIZES = [10,11,12,13,14,16,18,20,24,28,32,36,40,48,56,64,72,96]

const SHAPES = [
  { id:'rect', label:'사각형', icon:'▭' },
  { id:'ellipse', label:'원/타원', icon:'○' },
  { id:'triangle', label:'삼각형', icon:'△' },
  { id:'diamond', label:'마름모', icon:'◇' },
  { id:'pentagon', label:'오각형', icon:'⬠' },
  { id:'hexagon', label:'육각형', icon:'⬡' },
  { id:'star', label:'별', icon:'★' },
  { id:'arrow', label:'화살표', icon:'→' },
  { id:'speech', label:'말풍선', icon:'💬' },
  { id:'cross', label:'십자', icon:'+' },
]

const LINES = [
  { id:'line_straight', label:'실선', dash: 'none' },
  { id:'line_dashed', label:'점선', dash: '10,5' },
  { id:'line_dotted', label:'점점선', dash: '2,5' },
]

export const Topbar: React.FC = () => {
  const {
    activeTool, setTool, theme, setTheme,
    showGrid, toggleGrid, snapEnabled, toggleSnap,
    selectedIds, elements, updateElement, updateElements,
    deleteSelected, duplicateSelected, flipH, flipV,
    layerToFront, layerToBack, layerUp, layerDown,
    undo, redo, historyIndex, history,
    saveFile, activeFile, watermarkEnabled, toggleWatermark,
    pages, currentPageIndex, canvasWidth, canvasHeight,
    lockSelected, addElement, groupSelected, ungroupSelected,
    activeShapeType, setActiveShapeType,
  } = useStore()

  const [showShapes, setShowShapes] = useState(false)
  const [showLines, setShowLines] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const selectedEl = selectedIds.length === 1 ? elements.find(e => e.id === selectedIds[0]) : null
  const multiSel = selectedIds.length > 1

  const fmt = (key: string, val: any) => {
    if (!selectedIds.length) return
    updateElements(selectedIds, { [key]: val })
  }

  const handleExportPDF = async () => {
    const el = document.getElementById('naps-canvas')
    if (!el) { toast.error('캔버스를 찾을 수 없습니다'); return }
    await exportToPDF(el, pages, currentPageIndex, canvasWidth, canvasHeight, activeFile?.name || 'portfolio')
  }

  const handleShareLink = async () => {
    const link = generateShareLink(activeFile?.id || 'demo')
    await copyToClipboard(link)
  }

  const handleAITemplate = async () => {
    const prompt = window.prompt('AI 템플릿 설명 (예: 이력서, 포트폴리오 표지, 명함)')
    if (!prompt) return
    setAiLoading(true)
    try {
      const system = `당신은 포트폴리오 레이아웃 디자이너입니다. 설명 없이 JSON 배열만 출력하세요.
캔버스 크기: ${canvasWidth}x${canvasHeight}
반환 형식: [{"type":"text"|"shape","x":숫자,"y":숫자,"width":숫자,"height":숫자,"text":"텍스트내용","shapeType":"rect"|"ellipse"|"triangle","fill":"#색상","stroke":"#색상","fontSize":숫자,"fontWeight":"normal"|"bold","color":"#색상"}]
요소 6~12개. 좌표는 캔버스 범위 내.`
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system, messages: [{ role: 'user', content: prompt }] }),
      })
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const raw = data.content?.map((b: any) => b.text || '').join('') || ''
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('JSON 형식 없음')
      const parsed = JSON.parse(match[0])
      parsed.forEach((el: any, i: number) => {
        const base = { id: `el_${Date.now()}_${i}`, x: el.x||50, y: el.y||50, width: el.width||200, height: el.height||80, zIndex: elements.length+i+1, opacity:1, visible:true, locked:false, rotation:0, flipH:false, flipV:false }
        if (el.type === 'text') {
          addElement({ ...base, type:'text', text:el.text||'텍스트', fontSize:el.fontSize||16, fontFamily:'Noto Sans KR', fontWeight:el.fontWeight||'normal', color:el.color||'#111', fill:'transparent', textAlign:'left', lineHeight:1.4, fontStyle:'normal', textDecoration:'none' })
        } else {
          addElement({ ...base, type:'shape', shapeType:el.shapeType||'rect', fill:el.fill||'#e2e8f0', stroke:el.stroke||'transparent', strokeWidth:1, borderRadius:4, innerText:'', innerTextSize:14, innerTextColor:'#111', innerTextWeight:'normal', innerTextAlign:'center' })
        }
      })
      toast.success('AI 템플릿 생성 완료!')
    } catch (err: any) {
      toast.error('AI 오류: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const sep = () => <div style={{ width:1, height:22, background:'var(--border)', margin:'0 2px', flexShrink:0 }} />

  const toolBtn = (tool: string, Icon: React.FC<any>, label: string) => (
    <button title={label} onClick={() => { setTool(tool as any); setShowShapes(false); setShowLines(false) }}
      style={{ width:30, height:30, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background: activeTool===tool?'var(--accent-dim)':'transparent', color: activeTool===tool?'var(--accent)':'var(--text1)', border:'none', cursor:'pointer' }}
      onMouseEnter={e => { if (activeTool!==tool) (e.currentTarget as HTMLElement).style.background='var(--bg3)' }}
      onMouseLeave={e => { if (activeTool!==tool) (e.currentTarget as HTMLElement).style.background='transparent' }}>
      <Icon size={15} />
    </button>
  )

  const iconBtn = (onClick: () => void, Icon: React.FC<any>, label: string, danger=false, disabled=false, active=false) => (
    <button title={label} onClick={onClick} disabled={disabled}
      style={{ width:30, height:30, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background: active?'var(--accent-dim)':'transparent', border:'none', cursor:disabled?'not-allowed':'pointer', color:disabled?'var(--text2)':danger?'var(--red)':active?'var(--accent)':'var(--text1)', opacity:disabled?0.4:1 }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background='var(--bg3)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=active?'var(--accent-dim)':'transparent' }}>
      <Icon size={15} />
    </button>
  )

  return (
    <div style={{ height:46, background:'var(--bg1)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 8px', gap:1, flexShrink:0, zIndex:50, overflowX:'auto' }}>

      {/* 로고 */}
      <span style={{ fontSize:15, fontWeight:700, color:'var(--accent)', marginRight:6, letterSpacing:-0.5, userSelect:'none', flexShrink:0 }}>Naps</span>
      {sep()}

      {/* 기본 툴 */}
      {toolBtn('select', MousePointer2, '선택 (V)')}
      {toolBtn('text', Type, '텍스트 (T)')}
      {toolBtn('hand', Hand, '이동 (H)')}

      {/* 도형 툴 드롭다운 */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <button
          onClick={() => { setShowShapes(!showShapes); setShowLines(false) }}
          style={{ height:30, padding:'0 6px', borderRadius:6, display:'flex', alignItems:'center', gap:3, background: activeTool==='shape'?'var(--accent-dim)':'transparent', color: activeTool==='shape'?'var(--accent)':'var(--text1)', border:'none', cursor:'pointer', fontSize:13 }}
          onMouseEnter={e => { if (activeTool!=='shape') (e.currentTarget as HTMLElement).style.background='var(--bg3)' }}
          onMouseLeave={e => { if (activeTool!=='shape') (e.currentTarget as HTMLElement).style.background='transparent' }}>
          <Square size={14} />
          <span style={{ fontSize:11 }}>도형</span>
          <ChevronDown size={11} />
        </button>
        {showShapes && (
          <div style={{ position:'fixed', top:50, left:'auto', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:6, display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:3, zIndex:200, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', minWidth:220 }}>
            {SHAPES.map(s => (
              <button key={s.id} title={s.label}
                onClick={() => {
                  setActiveShapeType(s.id)
                  const el = makeShapeElement(canvasWidth/2-60, canvasHeight/2-40, 120, 80, elements.length, s.id)
                  addElement(el); setTool('select'); setShowShapes(false)
                }}
                style={{ padding:'6px 4px', borderRadius:6, border:`1px solid ${activeShapeType===s.id?'var(--accent)':'var(--border)'}`, background: activeShapeType===s.id?'var(--accent-dim)':'var(--bg3)', cursor:'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <span style={{ fontSize:18, lineHeight:1 }}>{s.icon}</span>
                <span style={{ fontSize:9, color:'var(--text2)' }}>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 선 툴 드롭다운 */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <button
          onClick={() => { setShowLines(!showLines); setShowShapes(false) }}
          style={{ height:30, padding:'0 6px', borderRadius:6, display:'flex', alignItems:'center', gap:3, background: activeTool==='line'?'var(--accent-dim)':'transparent', color: activeTool==='line'?'var(--accent)':'var(--text1)', border:'none', cursor:'pointer', fontSize:13 }}
          onMouseEnter={e => { if (activeTool!=='line') (e.currentTarget as HTMLElement).style.background='var(--bg3)' }}
          onMouseLeave={e => { if (activeTool!=='line') (e.currentTarget as HTMLElement).style.background='transparent' }}>
          <Minus size={14} />
          <span style={{ fontSize:11 }}>선</span>
          <ChevronDown size={11} />
        </button>
        {showLines && (
          <div style={{ position:'fixed', top:50, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:8, zIndex:200, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', minWidth:160, display:'flex', flexDirection:'column', gap:4 }}>
            {LINES.map(l => (
              <button key={l.id}
                onClick={() => {
                  const el = makeLineElement(canvasWidth/2-100, canvasHeight/2, elements.length)
                  addElement({ ...el, shapeType: l.id as any, lineStyle: l.id === 'line_dashed' ? 'dashed' : l.id === 'line_dotted' ? 'dotted' : 'solid' })
                  setTool('select'); setShowLines(false)
                }}
                style={{ padding:'6px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg3)', cursor:'pointer', textAlign:'left', fontSize:12, color:'var(--text1)', display:'flex', alignItems:'center', gap:8 }}>
                <svg width={40} height={8}><line x1={2} y1={4} x2={38} y2={4} stroke="currentColor" strokeWidth={2} strokeDasharray={l.dash === 'none' ? undefined : l.dash} /></svg>
                {l.label}
              </button>
            ))}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:4, marginTop:2 }}>
              <div style={{ fontSize:10, color:'var(--text2)', marginBottom:4 }}>화살표 옵션</div>
              {selectedEl?.type === 'line' && (
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => fmt('arrowStart', !selectedEl.arrowStart)} style={{ flex:1, padding:'4px 6px', borderRadius:5, border:`1px solid ${selectedEl.arrowStart?'var(--accent)':'var(--border)'}`, background:selectedEl.arrowStart?'var(--accent-dim)':'var(--bg3)', fontSize:11, cursor:'pointer', color:'var(--text1)' }}>←시작</button>
                  <button onClick={() => fmt('arrowEnd', !selectedEl.arrowEnd)} style={{ flex:1, padding:'4px 6px', borderRadius:5, border:`1px solid ${selectedEl.arrowEnd?'var(--accent)':'var(--border)'}`, background:selectedEl.arrowEnd?'var(--accent-dim)':'var(--bg3)', fontSize:11, cursor:'pointer', color:'var(--text1)' }}>끝→</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {sep()}

      {/* 텍스트 서식 */}
      {selectedEl?.type === 'text' && <>
        <select data-font-select value={selectedEl.fontFamily || 'Noto Sans KR'} onChange={e => fmt('fontFamily', e.target.value)}
          style={{ height:26, padding:'0 4px', border:'1px solid var(--border)', borderRadius:5, background:'var(--bg2)', color:'var(--text0)', fontSize:12, maxWidth:120 }}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={selectedEl.fontSize || 16} onChange={e => fmt('fontSize', parseInt(e.target.value))}
          style={{ height:26, padding:'0 4px', border:'1px solid var(--border)', borderRadius:5, background:'var(--bg2)', color:'var(--text0)', fontSize:12, width:52 }}>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {iconBtn(() => fmt('fontWeight', selectedEl.fontWeight==='bold'?'normal':'bold'), Bold, '굵게', false, false, selectedEl.fontWeight==='bold')}
        {iconBtn(() => fmt('fontStyle', selectedEl.fontStyle==='italic'?'normal':'italic'), Italic, '기울기', false, false, selectedEl.fontStyle==='italic')}
        {iconBtn(() => fmt('textDecoration', selectedEl.textDecoration==='underline'?'none':'underline'), Underline, '밑줄', false, false, selectedEl.textDecoration==='underline')}
        {iconBtn(() => fmt('textAlign', 'left'), AlignLeft, '왼쪽')}
        {iconBtn(() => fmt('textAlign', 'center'), AlignCenter, '가운데')}
        {iconBtn(() => fmt('textAlign', 'right'), AlignRight, '오른쪽')}
        <div title="글자색" style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <div style={{ width:20, height:20, borderRadius:4, border:'1px solid var(--border)', background:selectedEl.color||'#111', cursor:'pointer' }} onClick={() => (document.getElementById('tc-pick') as HTMLInputElement)?.click()} />
          <input type="color" id="tc-pick" value={selectedEl.color||'#111111'} onChange={e => fmt('color', e.target.value)} style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
        </div>
        <div title="배경색" style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <div style={{ width:20, height:20, borderRadius:4, border:'1.5px dashed var(--border2)', background:(selectedEl.fill&&selectedEl.fill!=='transparent')?selectedEl.fill:'transparent', cursor:'pointer' }} onClick={() => (document.getElementById('bc-pick') as HTMLInputElement)?.click()} />
          <input type="color" id="bc-pick" value={selectedEl.fill||'#ffffff'} onChange={e => fmt('fill', e.target.value)} style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
        </div>
        <button title="배경 투명" onClick={() => fmt('fill', 'transparent')} style={{ fontSize:10, padding:'0 5px', height:24, borderRadius:4, border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', cursor:'pointer' }}>투명</button>
        {sep()}
      </>}

      {/* 도형 서식 */}
      {selectedEl?.type === 'shape' && <>
        <div title="채우기" style={{ position:'relative', display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ fontSize:10, color:'var(--text2)' }}>채우기</span>
          <div style={{ width:20, height:20, borderRadius:4, border:'1px solid var(--border)', background:selectedEl.fill||'#e2e8f0', cursor:'pointer' }} onClick={() => (document.getElementById('fill-pick') as HTMLInputElement)?.click()} />
          <input type="color" id="fill-pick" value={selectedEl.fill||'#e2e8f0'} onChange={e => fmt('fill', e.target.value)} style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
        </div>
        <div title="테두리" style={{ position:'relative', display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ fontSize:10, color:'var(--text2)' }}>테두리</span>
          <div style={{ width:20, height:20, borderRadius:4, border:'1px solid var(--border)', background:selectedEl.stroke||'transparent', cursor:'pointer' }} onClick={() => (document.getElementById('stroke-pick') as HTMLInputElement)?.click()} />
          <input type="color" id="stroke-pick" value={selectedEl.stroke||'#000000'} onChange={e => fmt('stroke', e.target.value)} style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
        </div>
        <input type="number" min={0} max={20} value={selectedEl.strokeWidth||0}
          onChange={e => fmt('strokeWidth', parseInt(e.target.value))}
          title="테두리 두께"
          style={{ width:36, height:26, padding:'0 4px', border:'1px solid var(--border)', borderRadius:5, background:'var(--bg2)', color:'var(--text0)', fontSize:12, textAlign:'center' }} />
        {sep()}
        {/* 도형 내 텍스트 */}
        <input value={selectedEl.innerText||''} onChange={e => fmt('innerText', e.target.value)}
          placeholder="도형 내 텍스트"
          style={{ width:90, height:26, padding:'0 6px', border:'1px solid var(--border)', borderRadius:5, background:'var(--bg2)', color:'var(--text0)', fontSize:12 }} />
        <input type="number" min={8} max={72} value={selectedEl.innerTextSize||14} onChange={e => fmt('innerTextSize', parseInt(e.target.value))}
          style={{ width:36, height:26, padding:'0 4px', border:'1px solid var(--border)', borderRadius:5, background:'var(--bg2)', color:'var(--text0)', fontSize:12, textAlign:'center' }} />
        <div style={{ position:'relative' }}>
          <div style={{ width:20, height:20, borderRadius:4, border:'1px solid var(--border)', background:selectedEl.innerTextColor||'#111', cursor:'pointer' }} onClick={() => (document.getElementById('itc-pick') as HTMLInputElement)?.click()} />
          <input type="color" id="itc-pick" value={selectedEl.innerTextColor||'#111111'} onChange={e => fmt('innerTextColor', e.target.value)} style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
        </div>
        {sep()}
      </>}

      {/* 선 서식 */}
      {selectedEl?.type === 'line' && <>
        <div style={{ position:'relative' }}>
          <div style={{ width:20, height:20, borderRadius:4, border:'1px solid var(--border)', background:selectedEl.stroke||'#475569', cursor:'pointer' }} onClick={() => (document.getElementById('lc-pick') as HTMLInputElement)?.click()} />
          <input type="color" id="lc-pick" value={selectedEl.stroke||'#475569'} onChange={e => fmt('stroke', e.target.value)} style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
        </div>
        <input type="number" min={1} max={20} value={selectedEl.strokeWidth||2} onChange={e => fmt('strokeWidth', parseInt(e.target.value))}
          style={{ width:36, height:26, padding:'0 4px', border:'1px solid var(--border)', borderRadius:5, background:'var(--bg2)', color:'var(--text0)', fontSize:12, textAlign:'center' }} />
        <button onClick={() => fmt('arrowStart', !selectedEl.arrowStart)} style={{ padding:'0 6px', height:26, borderRadius:5, border:`1px solid ${selectedEl.arrowStart?'var(--accent)':'var(--border)'}`, background:selectedEl.arrowStart?'var(--accent-dim)':'transparent', fontSize:11, cursor:'pointer', color:'var(--text1)' }}>←</button>
        <button onClick={() => fmt('arrowEnd', !selectedEl.arrowEnd)} style={{ padding:'0 6px', height:26, borderRadius:5, border:`1px solid ${selectedEl.arrowEnd?'var(--accent)':'var(--border)'}`, background:selectedEl.arrowEnd?'var(--accent-dim)':'transparent', fontSize:11, cursor:'pointer', color:'var(--text1)' }}>→</button>
        {sep()}
      </>}

      {/* 요소 액션 */}
      {selectedIds.length > 0 && <>
        {iconBtn(flipH, FlipHorizontal2, '좌우 반전')}
        {iconBtn(flipV, FlipVertical2, '상하 반전')}
        {iconBtn(() => { if(selectedEl) fmt('rotation', ((selectedEl.rotation||0)+15)%360) }, RotateCw, '회전 +15°')}
        {iconBtn(layerToFront, Layers, '맨 앞으로')}
        {iconBtn(lockSelected, Lock, '잠금', false, false, selectedEl?.locked)}
        {iconBtn(duplicateSelected, Copy, '복제')}
        {multiSel && iconBtn(groupSelected, Group, '그룹화 (Ctrl+G)')}
        {selectedEl && iconBtn(ungroupSelected, Ungroup, '그룹 해제 (Ctrl+Shift+G)')}
        {iconBtn(deleteSelected, Trash2, '삭제', true)}
        {sep()}
      </>}

      {/* 실행취소/다시실행 */}
      {iconBtn(undo, Undo2, '실행취소', false, historyIndex <= 0)}
      {iconBtn(redo, Redo2, '다시실행', false, historyIndex >= history.length-1)}
      {sep()}

      {/* 보기 */}
      {iconBtn(toggleGrid, Grid3X3, showGrid?'눈금 숨기기':'눈금 보기', false, false, showGrid)}
      {iconBtn(toggleSnap, Magnet, snapEnabled?'스냅 끄기':'스냅 켜기', false, false, snapEnabled)}
      {iconBtn(toggleWatermark, Droplets, watermarkEnabled?'워터마크 끄기':'워터마크 켜기', false, false, watermarkEnabled)}
      {sep()}

      {/* 저장/내보내기 */}
      {iconBtn(saveFile, Save, '저장 (Ctrl+S)')}
      {iconBtn(handleExportPDF, FileDown, 'PDF 내보내기')}
      {sep()}

      {/* AI */}
      <button title="AI 템플릿 생성" onClick={handleAITemplate} disabled={aiLoading}
        style={{ height:28, padding:'0 8px', borderRadius:6, border:'1px solid var(--accent)', background:'transparent', color:'var(--accent)', cursor:aiLoading?'not-allowed':'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4, flexShrink:0, opacity:aiLoading?0.6:1 }}>
        <Sparkles size={12} />{aiLoading?'생성 중...':'AI'}
      </button>

      <div style={{ flex:1 }} />

      {/* 테마 */}
      <div style={{ display:'flex', gap:2, background:'var(--bg2)', borderRadius:8, padding:2, border:'1px solid var(--border)', flexShrink:0 }}>
        {(['dark','light','green'] as const).map((t, i) => {
          const icons = [Moon, Sun, Leaf]
          const Icon = icons[i]
          return (
            <button key={t} onClick={() => setTheme(t)} title={['다크','라이트','그린'][i]}
              style={{ width:26, height:26, borderRadius:6, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background: theme===t?'var(--bg4)':'transparent', color: theme===t?'var(--text0)':'var(--text2)' }}>
              <Icon size={13} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
