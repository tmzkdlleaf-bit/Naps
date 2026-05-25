import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { Template, CanvasPage } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'blank', name: '빈 페이지', canvasWidth: 595, canvasHeight: 842,
    createdAt: '', isCustom: false,
    pages: [{ id: uuidv4(), name: '페이지 1', elements: [], background: '#ffffff' }],
  },
  {
    id: 'hero', name: '히어로 레이아웃', canvasWidth: 595, canvasHeight: 842,
    createdAt: '', isCustom: false,
    pages: [{
      id: uuidv4(), name: '페이지 1', background: '#ffffff',
      elements: [
        { id: uuidv4(), type: 'shape', x: 0, y: 0, width: 595, height: 280, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 0, visible: true, locked: false, shapeType: 'rect', fill: '#1e293b', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
        { id: uuidv4(), type: 'text', x: 40, y: 90, width: 515, height: 60, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 1, visible: true, locked: false, text: '포트폴리오 타이틀', fontSize: 32, fontFamily: 'DM Sans', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#ffffff', lineHeight: 1.2, fill: 'transparent' },
        { id: uuidv4(), type: 'text', x: 40, y: 160, width: 515, height: 36, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 2, visible: true, locked: false, text: '디자이너 · 개발자 · 크리에이터', fontSize: 14, fontFamily: 'DM Sans', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#94a3b8', lineHeight: 1.5, fill: 'transparent' },
        { id: uuidv4(), type: 'text', x: 40, y: 310, width: 515, height: 60, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 3, visible: true, locked: false, text: '소개', fontSize: 18, fontFamily: 'DM Sans', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#0f172a', lineHeight: 1.3, fill: 'transparent' },
        { id: uuidv4(), type: 'text', x: 40, y: 350, width: 515, height: 80, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 4, visible: true, locked: false, text: '안녕하세요. 저는 사용자 중심의 디자인과 깔끔한 코드를 추구하는 크리에이터입니다.', fontSize: 13, fontFamily: 'DM Sans', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#475569', lineHeight: 1.6, fill: 'transparent' },
      ]
    }],
  },
  {
    id: 'grid2', name: '2열 그리드', canvasWidth: 595, canvasHeight: 842,
    createdAt: '', isCustom: false,
    pages: [{
      id: uuidv4(), name: '페이지 1', background: '#ffffff',
      elements: [
        { id: uuidv4(), type: 'text', x: 30, y: 30, width: 535, height: 50, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 0, visible: true, locked: false, text: '프로젝트', fontSize: 24, fontFamily: 'DM Sans', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', color: '#0f172a', lineHeight: 1.2, fill: 'transparent' },
        { id: uuidv4(), type: 'shape', x: 30, y: 90, width: 252, height: 180, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 1, visible: true, locked: false, shapeType: 'rect', fill: '#f1f5f9', stroke: 'transparent', strokeWidth: 0, borderRadius: 8 },
        { id: uuidv4(), type: 'shape', x: 313, y: 90, width: 252, height: 180, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 2, visible: true, locked: false, shapeType: 'rect', fill: '#f1f5f9', stroke: 'transparent', strokeWidth: 0, borderRadius: 8 },
        { id: uuidv4(), type: 'shape', x: 30, y: 290, width: 252, height: 180, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 3, visible: true, locked: false, shapeType: 'rect', fill: '#f1f5f9', stroke: 'transparent', strokeWidth: 0, borderRadius: 8 },
        { id: uuidv4(), type: 'shape', x: 313, y: 290, width: 252, height: 180, rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex: 4, visible: true, locked: false, shapeType: 'rect', fill: '#f1f5f9', stroke: 'transparent', strokeWidth: 0, borderRadius: 8 },
      ]
    }],
  },
]

export const TemplatesModal: React.FC<Props> = ({ onClose }) => {
  const { templates, applyTemplate, saveAsTemplate } = useStore()
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)

  const allTemplates = [...BUILTIN_TEMPLATES, ...templates.filter(t => t.isCustom)]

  const handleApply = (t: Template) => {
    applyTemplate(t)
    onClose()
    toast.success(`"${t.name}" 템플릿이 적용되었습니다`)
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    await saveAsTemplate(saveName.trim())
    setSaveName('')
    setShowSave(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, width: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>템플릿</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowSave(!showSave)} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text1)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={11} /> 현재 페이지 저장
            </button>
            <button onClick={onClose} style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
          </div>
        </div>

        {showSave && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <input
              autoFocus
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="템플릿 이름..."
              style={{ flex: 1, height: 28, padding: '0 8px', border: '1px solid var(--accent)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
            />
            <button onClick={handleSave} style={{ height: 28, padding: '0 12px', borderRadius: 5, border: 'none', background: 'var(--accent)', color: '#000', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>저장</button>
          </div>
        )}

        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {allTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => handleApply(t)}
                style={{
                  padding: 10, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg2)', cursor: 'pointer', textAlign: 'center',
                  fontFamily: 'var(--font-sans)', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
              >
                {/* Mini preview */}
                <div style={{ width: '100%', aspectRatio: '3/4', background: t.pages[0]?.background || 'white', borderRadius: 5, marginBottom: 6, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                  {t.pages[0]?.elements.slice(0, 6).map(el => (
                    <div key={el.id} style={{
                      position: 'absolute',
                      left: `${(el.x / (t.canvasWidth || 595)) * 100}%`,
                      top: `${(el.y / (t.canvasHeight || 842)) * 100}%`,
                      width: `${(el.width / (t.canvasWidth || 595)) * 100}%`,
                      height: `${(el.height / (t.canvasHeight || 842)) * 100}%`,
                      background: el.type === 'shape' ? (el.fill || '#e2e8f0') : el.type === 'text' ? 'rgba(0,0,0,0.15)' : '#dde1e7',
                      borderRadius: el.type === 'shape' ? (el.borderRadius || 0) : 1,
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text0)' }}>{t.name}</div>
                {t.isCustom && <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>내 템플릿</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
