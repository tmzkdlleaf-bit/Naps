import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { CANVAS_SIZES, CanvasSize } from '@/types'
import { mmToPx } from '@/utils/canvas'

interface Props {
  onClose: () => void
}

export const CanvasSizeModal: React.FC<Props> = ({ onClose }) => {
  const { canvasWidth, canvasHeight, setCanvasSize } = useStore()
  const [selected, setSelected] = useState<string>('사용자 지정')
  const [customW, setCustomW] = useState(canvasWidth)
  const [customH, setCustomH] = useState(canvasHeight)
  const [unit, setUnit] = useState<'px' | 'mm'>('px')

  const handleSelect = (size: CanvasSize) => {
    setSelected(size.name)
    setCustomW(size.width)
    setCustomH(size.height)
  }

  const handleApply = () => {
    let w = customW, h = customH
    if (unit === 'mm') { w = mmToPx(w); h = mmToPx(h) }
    setCanvasSize(Math.round(w), Math.round(h))
    onClose()
  }

  const displayW = unit === 'mm' ? Math.round(customW / 3.7795) : customW
  const displayH = unit === 'mm' ? Math.round(customH / 3.7795) : customH

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, width: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>캔버스 크기</span>
          <button onClick={onClose} style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
          {CANVAS_SIZES.filter(s => s.name !== '사용자 지정').map(size => (
            <button
              key={size.name}
              onClick={() => handleSelect(size)}
              style={{
                padding: '8px 6px', borderRadius: 7,
                border: `1px solid ${selected === size.name ? 'var(--accent)' : 'var(--border)'}`,
                background: selected === size.name ? 'var(--accent-dim)' : 'var(--bg2)',
                color: selected === size.name ? 'var(--accent)' : 'var(--text1)',
                cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-sans)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 500 }}>{size.name}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{size.width}×{size.height}</div>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text2)', width: 28 }}>단위</span>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as 'px' | 'mm')}
              style={{ height: 28, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }}
            >
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)', width: 28 }}>너비</span>
            <input
              type="number"
              value={displayW}
              onChange={e => {
                const v = parseFloat(e.target.value)
                setCustomW(unit === 'mm' ? Math.round(v * 3.7795) : v)
                setSelected('사용자 지정')
              }}
              style={{ flex: 1, height: 28, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>×</span>
            <input
              type="number"
              value={displayH}
              onChange={e => {
                const v = parseFloat(e.target.value)
                setCustomH(unit === 'mm' ? Math.round(v * 3.7795) : v)
                setSelected('사용자 지정')
              }}
              style={{ flex: 1, height: 28, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ height: 30, padding: '0 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text1)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)' }}>취소</button>
          <button onClick={handleApply} style={{ height: 30, padding: '0 14px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>적용</button>
        </div>
      </div>
    </div>
  )
}
