import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Trash2, Copy } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { AlignDirection } from '@/types'
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal
} from 'lucide-react'

export const RightPanel: React.FC = () => {
  const {
    selectedIds, elements, updateElement, updateElements,
    alignSelected, layerUp, layerDown, layerToFront, layerToBack,
    selectElement, deleteSelected, duplicateSelected, lockSelected,
    watermark, setWatermark, watermarkEnabled,
    canvasWidth, canvasHeight, setCanvasSize,
  } = useStore()

  const [tab, setTab] = useState<'properties' | 'layers'>('properties')

  const selectedEl = selectedIds.length === 1 ? elements.find(e => e.id === selectedIds[0]) : null
  const multiSel = selectedIds.length > 1

  const upd = (key: string, val: any) => {
    if (!selectedEl) return
    updateElement(selectedEl.id, { [key]: val })
  }

  const InputRow = ({ label, k, type = 'number', val, onChange }: { label: string; k?: string; type?: string; val: any; onChange: (v: any) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: 'var(--text2)', width: 46, flexShrink: 0, userSelect: 'none' }}>{label}</span>
      <input
        type={type}
        value={val ?? ''}
        onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        style={{
          flex: 1, height: 26, padding: '0 6px', border: '1px solid var(--border)',
          borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  )

  const AlignBtn = ({ dir, Icon, label }: { dir: AlignDirection; Icon: React.FC<any>; label: string }) => (
    <button
      onClick={() => alignSelected(dir)}
      title={label}
      style={{ flex: 1, height: 26, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
    >
      <Icon size={12} />
    </button>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, userSelect: 'none' }}>{title}</div>
      {children}
    </div>
  )

  const Tab = ({ id, label }: { id: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        flex: 1, height: 32, border: 'none', cursor: 'pointer',
        background: tab === id ? 'var(--bg2)' : 'transparent',
        color: tab === id ? 'var(--text0)' : 'var(--text2)',
        fontSize: 12, fontFamily: 'var(--font-sans)', borderRadius: 6,
        fontWeight: tab === id ? 500 : 400,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      width: 230, background: 'var(--bg1)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', gap: 2, padding: 6, borderBottom: '1px solid var(--border)' }}>
        <Tab id="properties" label="속성" />
        <Tab id="layers" label="레이어" />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'properties' && (
          <>
            {(selectedEl || multiSel) ? (
              <>
                {!multiSel && selectedEl && (
                  <Section title="크기 및 위치">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
                      {[['X', 'x'], ['Y', 'y']].map(([l, k]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text2)', width: 14, userSelect: 'none' }}>{l}</span>
                          <input
                            type="number"
                            value={Math.round(selectedEl[k as 'x' | 'y'])}
                            onChange={e => upd(k, parseFloat(e.target.value))}
                            style={{ flex: 1, height: 26, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text2)', width: 14, userSelect: 'none' }}>W</span>
                        <input
                          type="number"
                          value={Math.round(selectedEl.width)}
                          onChange={e => {
                            const w = Math.max(10, parseFloat(e.target.value) || 10)
                            const ratio = selectedEl.width / selectedEl.height
                            upd('width', w); upd('height', Math.round(w / ratio))
                          }}
                          style={{ flex: 1, height: 26, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text2)', width: 14, userSelect: 'none' }}>H</span>
                        <input
                          type="number"
                          value={Math.round(selectedEl.height)}
                          onChange={e => {
                            const h = Math.max(10, parseFloat(e.target.value) || 10)
                            const ratio = selectedEl.width / selectedEl.height
                            upd('height', h); upd('width', Math.round(h * ratio))
                          }}
                          style={{ flex: 1, height: 26, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }}
                        />
                      </div>
                    </div>
                    <InputRow label="회전" val={selectedEl.rotation || 0} onChange={v => upd('rotation', v)} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)', width: 46, userSelect: 'none' }}>투명도</span>
                      <input
                        type="range" min={0} max={100} step={1}
                        value={Math.round((selectedEl.opacity || 1) * 100)}
                        onChange={e => upd('opacity', parseFloat(e.target.value) / 100)}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--text1)', width: 28, textAlign: 'right', userSelect: 'none' }}>
                        {Math.round((selectedEl.opacity || 1) * 100)}%
                      </span>
                    </div>
                  </Section>
                )}

                {/* Align */}
                <Section title="정렬">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 3 }}>
                    <AlignBtn dir="left" Icon={AlignStartVertical} label="왼쪽" />
                    <AlignBtn dir="center" Icon={AlignCenterVertical} label="가운데" />
                    <AlignBtn dir="right" Icon={AlignEndVertical} label="오른쪽" />
                    <AlignBtn dir="top" Icon={AlignStartHorizontal} label="위" />
                    <AlignBtn dir="middle" Icon={AlignCenterHorizontal} label="중간" />
                    <AlignBtn dir="bottom" Icon={AlignEndHorizontal} label="아래" />
                  </div>
                </Section>

                {/* Layer order */}
                <Section title="레이어 순서">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {[
                      { label: '맨 앞', onClick: layerToFront },
                      { label: '앞으로', onClick: layerUp },
                      { label: '뒤로', onClick: layerDown },
                      { label: '맨 뒤', onClick: layerToBack },
                    ].map(({ label, onClick }) => (
                      <button
                        key={label} onClick={onClick}
                        style={{ height: 26, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-sans)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
                      >{label}</button>
                    ))}
                  </div>
                </Section>
              </>
            ) : (
              <Section title="캔버스">
                <InputRow label="너비" val={canvasWidth} onChange={v => setCanvasSize(Math.max(100, v), canvasHeight)} />
                <InputRow label="높이" val={canvasHeight} onChange={v => setCanvasSize(canvasWidth, Math.max(100, v))} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>워터마크</div>
                  <input
                    value={watermark}
                    onChange={e => setWatermark(e.target.value)}
                    placeholder="© My Portfolio"
                    style={{ width: '100%', height: 26, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
                  />
                </div>
              </Section>
            )}

            {/* Custom font upload */}
            <Section title="폰트 업로드">
              <button
                onClick={() => document.getElementById('font-upload')?.click()}
                style={{
                  width: '100%', padding: '5px 8px', borderRadius: 6,
                  border: '1px dashed var(--border2)', background: 'transparent',
                  color: 'var(--text2)', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
              >
                + 사용자 폰트 (.ttf/.otf)
              </button>
              <input id="font-upload" type="file" accept=".ttf,.otf,.woff,.woff2" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const name = file.name.replace(/\.[^.]+$/, '')
                    const style = document.createElement('style')
                    style.textContent = `@font-face { font-family: '${name}'; src: url('${ev.target?.result}'); }`
                    document.head.appendChild(style)
                    // Add to font select in toolbar
                    const selects = document.querySelectorAll<HTMLSelectElement>('select[data-font-select]')
                    selects.forEach(sel => {
                      const opt = document.createElement('option')
                      opt.value = name; opt.textContent = `${name} (사용자)`
                      sel.appendChild(opt)
                    })
                    alert(`"${name}" 폰트가 추가되었습니다`)
                  }
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
            </Section>
          </>
        )}

        {tab === 'layers' && (
          <div style={{ padding: 6 }}>
            {[...elements].reverse().map(el => {
              const icons: Record<string, string> = { image: '🖼', text: 'T', shape: '□' }
              const isSelected = selectedIds.includes(el.id)
              return (
                <div
                  key={el.id}
                  onClick={e => selectElement(el.id, e.shiftKey)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px',
                    borderRadius: 5, cursor: 'pointer', fontSize: 12, marginBottom: 1,
                    background: isSelected ? 'var(--accent-dim)' : 'transparent',
                    color: isSelected ? 'var(--accent)' : 'var(--text1)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 11, width: 14, textAlign: 'center', userSelect: 'none' }}>{icons[el.type] || '?'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {el.type === 'text' ? (el.text || '텍스트').slice(0, 16) : `${el.type} ${el.id.slice(0, 4)}`}
                  </span>
                  <button
                    onClick={ev => { ev.stopPropagation(); updateElement(el.id, { visible: !el.visible }) }}
                    style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: el.visible ? 'var(--text1)' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}
                  >
                    {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  </button>
                  <button
                    onClick={ev => { ev.stopPropagation(); updateElement(el.id, { locked: !el.locked }) }}
                    style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: el.locked ? 'var(--accent)' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}
                  >
                    {el.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                </div>
              )
            })}
            {elements.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text2)', padding: 12, textAlign: 'center' }}>레이어가 없습니다</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
