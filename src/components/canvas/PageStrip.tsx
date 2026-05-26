import React, { useState } from 'react'
import { Plus, Copy, ClipboardPaste } from 'lucide-react'
import { useStore } from '@/stores/useStore'

export const PageStrip: React.FC = () => {
  const { pages, currentPageIndex, goToPage, addPage, deletePage, duplicatePage, renamePage, copyPage, pastePage } = useStore()
  const [renaming, setRenaming] = useState<number | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const startRename = (idx: number, name: string) => {
    setRenaming(idx)
    setRenameVal(name)
  }

  const commitRename = () => {
    if (renaming !== null && renameVal.trim()) renamePage(renaming, renameVal.trim())
    setRenaming(null)
  }

  return (
    <div style={{
      height: 88, background: 'var(--bg1)', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
      overflowX: 'auto', overflowY: 'hidden', flexShrink: 0,
    }}>
      {pages.map((page, idx) => (
        <div
          key={page.id}
          style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <div
            onClick={() => goToPage(idx)}
            tabIndex={0}
            data-page-idx={idx}
            onKeyDown={e => {
              if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                if (pages.length > 1) deletePage(idx)
              }
            }}
            onContextMenu={e => e.preventDefault()}
            style={{
              width: 54, height: 62, borderRadius: 5,
              border: `2px solid ${currentPageIndex === idx ? 'var(--accent)' : 'var(--border)'}`,
              background: 'white', cursor: 'pointer', overflow: 'hidden',
              position: 'relative', flexShrink: 0,
              transition: 'border-color 0.15s',
              boxShadow: currentPageIndex === idx ? '0 0 0 1px var(--accent)' : 'none',
              outline: 'none',
            }}
            onMouseEnter={e => { if (currentPageIndex !== idx) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)' }}
            onMouseLeave={e => { if (currentPageIndex !== idx) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            {/* Mini preview */}
            <div style={{ width: '100%', height: '100%', background: page.background || 'white', position: 'relative', overflow: 'hidden' }}>
              {page.elements.slice(0, 8).map(el => (
                <div key={el.id} style={{
                  position: 'absolute',
                  left: `${(el.x / 595) * 100}%`,
                  top: `${(el.y / 842) * 100}%`,
                  width: `${(el.width / 595) * 100}%`,
                  height: `${(el.height / 842) * 100}%`,
                  background: el.type === 'image' ? '#dde1e7' : el.type === 'shape' ? (el.fill || '#e2e8f0') : 'transparent',
                  borderRadius: 1,
                  opacity: 0.8,
                }} />
              ))}
            </div>
            <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 7, color: 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-mono)' }}>
              {idx + 1}
            </span>

            {/* Hover actions - 복사/복제만, 삭제는 키보드(Delete)로만 */}
            <div
              style={{ position: 'absolute', top: 2, right: 2, display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s' }}
              className="page-actions"
            >
              <button onClick={e => { e.stopPropagation(); copyPage(idx) }} title="페이지 복사" style={{ width: 16, height: 16, borderRadius: 3, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Copy size={8} />
              </button>
              <button onClick={e => { e.stopPropagation(); duplicatePage(idx) }} title="페이지 복제" style={{ width: 16, height: 16, borderRadius: 3, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardPaste size={8} />
              </button>
            </div>
          </div>

          {/* Page name */}
          {renaming === idx ? (
            <input
              autoFocus
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
              style={{ width: 54, fontSize: 9, textAlign: 'center', border: '1px solid var(--accent)', borderRadius: 3, background: 'var(--bg2)', color: 'var(--text0)', padding: '1px 2px' }}
            />
          ) : (
            <span
              onDoubleClick={() => startRename(idx, page.name)}
              style={{ fontSize: 9, color: currentPageIndex === idx ? 'var(--accent)' : 'var(--text2)', maxWidth: 54, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default', userSelect: 'none' }}
            >
              {page.name}
            </span>
          )}
        </div>
      ))}

      {/* Add page */}
      <button
        onClick={addPage}
        style={{
          width: 54, height: 62, borderRadius: 5, flexShrink: 0,
          border: '1.5px dashed var(--border2)', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text2)', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
      >
        <Plus size={18} />
      </button>

      {/* Paste page */}
      {localStorage.getItem('naps-page-clipboard') && (
        <button
          onClick={pastePage}
          title="페이지 붙여넣기"
          style={{
            width: 54, height: 62, borderRadius: 5, flexShrink: 0,
            border: '1.5px dashed var(--accent)', background: 'var(--accent-dim)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', transition: 'all 0.15s',
          }}
        >
          <ClipboardPaste size={16} />
        </button>
      )}

      <style>{`
        .page-thumb-wrap:hover .page-actions { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
