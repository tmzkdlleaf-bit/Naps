import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { AlignDirection } from '@/types'
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal
} from 'lucide-react'

const SHORTCUTS = [
  { key: 'V', desc: '선택 도구' },
  { key: 'T', desc: '텍스트 도구' },
  { key: 'H', desc: '손 도구 (패닝)' },
  { key: 'Delete', desc: '선택 요소 삭제' },
  { key: 'Ctrl+Z', desc: '실행 취소' },
  { key: 'Ctrl+Shift+Z', desc: '다시 실행' },
  { key: 'Ctrl+C', desc: '복사' },
  { key: 'Ctrl+V', desc: '붙여넣기' },
  { key: 'Ctrl+D', desc: '복제' },
  { key: 'Ctrl+G', desc: '그룹화' },
  { key: 'Ctrl+Shift+G', desc: '그룹 해제' },
  { key: 'Ctrl+클릭', desc: '다중 선택' },
  { key: 'Escape', desc: '선택 해제' },
  { key: '휠', desc: '확대/축소' },
]

export const RightPanel: React.FC = () => {
  const {
    selectedIds, elements, updateElement, updateElements,
    alignSelected, layerUp, layerDown, layerToFront, layerToBack,
    selectElement, deleteSelected, duplicateSelected, lockSelected,
    watermark, setWatermark, watermarkEnabled, toggleWatermark,
    watermarkRotation, setWatermarkRotation, watermarkOpacity, setWatermarkOpacity, watermarkSize, setWatermarkSize,
    canvasWidth, canvasHeight, setCanvasSize,
    pages, currentPageIndex, setPageBackground,
    autoSaveInterval, setAutoSaveInterval,
    favoriteColors, addFavoriteColor,
  } = useStore()

  const [tab, setTab] = useState<'properties' | 'layers' | 'env'>('properties')

  const selectedEl = selectedIds.length === 1 ? elements.find(e => e.id === selectedIds[0]) : null
  const multiSel = selectedIds.length > 1
  const pageBackground = pages[currentPageIndex]?.background || '#ffffff'

  const upd = (key: string, val: any) => {
    if (!selectedEl) return
    updateElement(selectedEl.id, { [key]: val })
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, userSelect: 'none' }}>{title}</div>
      {children}
    </div>
  )

  const Tab = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)}
      style={{ flex: 1, height: 32, border: 'none', cursor: 'pointer', background: tab === id ? 'var(--bg2)' : 'transparent', color: tab === id ? 'var(--text0)' : 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-sans)', borderRadius: 6, fontWeight: tab === id ? 500 : 400 }}>
      {label}
    </button>
  )

  const AlignBtn = ({ dir, Icon, label }: { dir: AlignDirection; Icon: React.FC<any>; label: string }) => (
    <button onClick={() => alignSelected(dir)} title={label}
      style={{ flex: 1, height: 26, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}>
      <Icon size={12} />
    </button>
  )

  return (
    <div style={{ width: 240, background: 'var(--bg1)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 2, padding: 6, borderBottom: '1px solid var(--border)' }}>
        <Tab id="properties" label="속성" />
        <Tab id="layers" label="레이어" />
        <Tab id="env" label="환경" />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>

        {/* ── 속성 탭 ── */}
        {tab === 'properties' && <>
          {(selectedEl || multiSel) ? <>
            {!multiSel && selectedEl && (
              <Section title="크기 및 위치">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
                  {[['X', 'x'], ['Y', 'y']].map(([l, k]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)', width: 14, userSelect: 'none' }}>{l}</span>
                      <input type="number" value={Math.round(selectedEl[k as 'x' | 'y'])}
                        onChange={e => upd(k, parseFloat(e.target.value))}
                        style={{ flex: 1, height: 26, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
                  {[['W', 'width'], ['H', 'height']].map(([l, k]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)', width: 14, userSelect: 'none' }}>{l}</span>
                      <input type="number" value={Math.round(selectedEl[k as 'width' | 'height'])}
                        onChange={e => upd(k, Math.max(4, parseFloat(e.target.value) || 4))}
                        style={{ flex: 1, height: 26, padding: '0 5px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46, userSelect: 'none' }}>회전</span>
                  <input type="number" value={selectedEl.rotation || 0} onChange={e => upd('rotation', parseFloat(e.target.value))}
                    style={{ flex: 1, height: 26, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46, userSelect: 'none' }}>투명도</span>
                  <input type="range" min={0} max={100} step={1}
                    value={Math.round((selectedEl.opacity || 1) * 100)}
                    onChange={e => upd('opacity', parseFloat(e.target.value) / 100)}
                    style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--text1)', width: 28, textAlign: 'right', userSelect: 'none' }}>{Math.round((selectedEl.opacity || 1) * 100)}%</span>
                </div>
              </Section>
            )}

            <Section title="정렬">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 3 }}>
                <AlignBtn dir="left"   Icon={AlignStartVertical}      label="왼쪽" />
                <AlignBtn dir="center" Icon={AlignCenterVertical}     label="가운데" />
                <AlignBtn dir="right"  Icon={AlignEndVertical}        label="오른쪽" />
                <AlignBtn dir="top"    Icon={AlignStartHorizontal}    label="위" />
                <AlignBtn dir="middle" Icon={AlignCenterHorizontal}   label="중간" />
                <AlignBtn dir="bottom" Icon={AlignEndHorizontal}      label="아래" />
              </div>
            </Section>

            <Section title="레이어 순서">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[['맨 앞', layerToFront],['앞으로', layerUp],['뒤로', layerDown],['맨 뒤', layerToBack]].map(([label, onClick]) => (
                  <button key={label as string} onClick={onClick as any}
                    style={{ height: 26, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}>
                    {label as string}
                  </button>
                ))}
              </div>
            </Section>
          </> : (
            <>
              <Section title="캔버스">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46 }}>너비</span>
                  <input type="number" value={canvasWidth} onChange={e => setCanvasSize(Math.max(100, parseFloat(e.target.value)), canvasHeight)}
                    style={{ flex: 1, height: 26, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46 }}>높이</span>
                  <input type="number" value={canvasHeight} onChange={e => setCanvasSize(canvasWidth, Math.max(100, parseFloat(e.target.value)))}
                    style={{ flex: 1, height: 26, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12 }} />
                </div>
                {/* 배경 색상 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46 }}>배경색</span>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: pageBackground, cursor: 'pointer' }}
                      onClick={() => document.getElementById('bg-color-pick')?.click()} />
                    <input type="color" id="bg-color-pick" value={pageBackground}
                      onChange={e => { setPageBackground(e.target.value); addFavoriteColor(e.target.value) }}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
                  </div>
                  <button onClick={() => setPageBackground('#ffffff')}
                    style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>흰색</button>
                  <button onClick={() => setPageBackground('transparent')}
                    style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>투명</button>
                </div>
              </Section>

              {/* 즐겨찾기 색상 */}
              {favoriteColors.length > 0 && (
                <Section title="즐겨찾기 색상">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {favoriteColors.map((color, i) => (
                      <div key={i} title={color}
                        style={{ width: 22, height: 22, borderRadius: 4, background: color, border: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => {
                          if (selectedEl) updateElement(selectedEl.id, selectedEl.type === 'shape' ? { fill: color } : { color })
                          else setPageBackground(color)
                        }} />
                    ))}
                  </div>
                </Section>
              )}

              {/* 워터마크 */}
              <Section title="워터마크">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1 }}>사용</span>
                  <div onClick={toggleWatermark}
                    style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: watermarkEnabled ? 'var(--accent)' : 'var(--bg3)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: '#fff', position: 'absolute', top: 3, left: watermarkEnabled ? 19 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
                <input value={watermark || ''} onChange={e => setWatermark(e.target.value)} placeholder="워터마크 텍스트"
                  style={{ width: '100%', height: 26, padding: '0 6px', border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)', marginBottom: 6 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46 }}>기울기</span>
                  <input type="range" min={-90} max={90} step={1}
                    value={watermarkRotation ?? -30}
                    onChange={e => setWatermarkRotation(Number(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--text1)', width: 30, textAlign: 'right' }}>{watermarkRotation ?? -30}°</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46 }}>투명도</span>
                  <input type="range" min={1} max={30} step={1}
                    value={watermarkOpacity ?? 8}
                    onChange={e => setWatermarkOpacity(Number(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--text1)', width: 30, textAlign: 'right' }}>{watermarkOpacity ?? 8}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)', width: 46 }}>크기</span>
                  <input type="range" min={1} max={20} step={0.5}
                    value={watermarkSize ?? 5}
                    onChange={e => setWatermarkSize(Number(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--text1)', width: 30, textAlign: 'right' }}>{watermarkSize ?? 5}%</span>
                </div>
              </Section>
            </>
          )}

          {/* 폰트 업로드 */}
          <Section title="폰트 업로드">
            <button onClick={() => document.getElementById('font-upload')?.click()}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px dashed var(--border2)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}>
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
                  const selects = document.querySelectorAll<HTMLSelectElement>('select[data-font-select]')
                  selects.forEach(sel => {
                    const opt = document.createElement('option')
                    opt.value = name; opt.textContent = `${name} (사용자)`
                    sel.appendChild(opt)
                  })
                  alert(`"${name}" 폰트 추가됨`)
                }
                reader.readAsDataURL(file)
                e.target.value = ''
              }} />
          </Section>
        </>}

        {/* ── 레이어 탭 ── */}
        {tab === 'layers' && (
          <div style={{ padding: 6 }}>
            {[...elements].reverse().map(el => {
              const icons: Record<string, string> = { image: '🖼', text: 'T', shape: '□', line: '—' }
              const isSelected = selectedIds.includes(el.id)
              return (
                <div key={el.id} onClick={e => selectElement(el.id, e.shiftKey)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 5, cursor: 'pointer', fontSize: 12, marginBottom: 1, background: isSelected ? 'var(--accent-dim)' : 'transparent', color: isSelected ? 'var(--accent)' : 'var(--text1)', border: isSelected ? '1px solid var(--accent)' : '1px solid transparent' }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <span style={{ fontSize: 11, width: 14, textAlign: 'center', userSelect: 'none' }}>{icons[el.type] || '?'}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {el.type === 'text' ? (el.text || '텍스트').slice(0, 16) : `${el.type} ${el.id.slice(0, 4)}`}
                  </span>
                  <button onClick={ev => { ev.stopPropagation(); updateElement(el.id, { visible: !el.visible }) }}
                    style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: el.visible ? 'var(--text1)' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
                    {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  </button>
                  <button onClick={ev => { ev.stopPropagation(); updateElement(el.id, { locked: !el.locked }) }}
                    style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', color: el.locked ? 'var(--accent)' : 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
                    {el.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                </div>
              )
            })}
            {elements.length === 0 && <div style={{ fontSize: 11, color: 'var(--text2)', padding: 12, textAlign: 'center' }}>레이어가 없습니다</div>}
          </div>
        )}

        {/* ── 환경 탭 ── */}
        {tab === 'env' && <>
          <Section title="자동 저장">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', width: 60 }}>간격 (초)</span>
              <input type="range" min={5} max={300} step={5} value={autoSaveInterval}
                onChange={e => setAutoSaveInterval(Number(e.target.value))}
                style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--text1)', width: 30, textAlign: 'right' }}>{autoSaveInterval}s</span>
            </div>
          </Section>

          <Section title="단축키">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SHORTCUTS.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--text1)', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.key}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </>}
      </div>
    </div>
  )
}
