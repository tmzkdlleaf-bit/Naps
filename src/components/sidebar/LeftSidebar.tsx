import React, { useRef, useState, useCallback } from 'react'
import { FolderOpen, FolderPlus, Plus, Upload, Search, Tag, Image, Calendar, Trash2, LayoutTemplate } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { makeImageElement, loadImageDimensions } from '@/utils/canvas'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { TemplatesModal } from '@/components/modals/TemplatesModal'

export const LeftSidebar: React.FC = () => {
  const {
    projects, activeProjectId, setActiveProject, createProject, deleteProject,
    files, loadFiles, createFile, setActiveFile, activeFile,
    assets, uploadAsset, deleteAsset, loadAssets,
    assetFilter, assetTag, setAssetFilter, setAssetTag,
    addElement, elements,
  } = useStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [activeTab, setActiveTab] = useState<'projects' | 'assets'>('projects')

  const handleProjectClick = async (id: string) => {
    setActiveProject(id)
    await loadFiles(id)
  }

  const handleNewProject = async () => {
    const name = prompt('프로젝트 이름:')
    if (!name) return
    await createProject(name)
  }

  const handleNewFile = async () => {
    if (!activeProjectId) { toast.error('프로젝트를 먼저 선택하세요'); return }
    const name = prompt('파일 이름:', '새 포트폴리오')
    if (!name) return
    await createFile(activeProjectId, name)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const tid = toast.loading(`업로드 중: ${file.name}`)
      const asset = await uploadAsset(file, activeProjectId || undefined)
      toast.success('업로드 완료', { id: tid })
    }
    e.target.value = ''
  }

  const addAssetToCanvas = async (src: string) => {
    const dims = await loadImageDimensions(src)
    const ratio = dims.width / dims.height
    const w = Math.min(280, 595 / 2)
    const h = w / ratio
    const x = Math.round((595 - w) / 2)
    const y = Math.round((842 - h) / 2)
    addElement(makeImageElement(src, x, y, w, h, elements.length))
  }

  const filteredAssets = assets
    .filter(a => {
      const q = assetFilter.toLowerCase()
      const matchQ = !q || a.name.toLowerCase().includes(q)
      const matchTag = assetTag === 'all' || a.tags.includes(assetTag)
      return matchQ && matchTag
    })
    .sort((a, b) => sortBy === 'date'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : a.name.localeCompare(b.name)
    )

  const Tab = ({ id, label }: { id: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, height: 32, border: 'none', cursor: 'pointer',
        background: activeTab === id ? 'var(--bg2)' : 'transparent',
        color: activeTab === id ? 'var(--text0)' : 'var(--text2)',
        fontSize: 12, fontFamily: 'var(--font-sans)',
        borderRadius: 6, fontWeight: activeTab === id ? 500 : 400,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      width: 220, background: 'var(--bg1)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 2, padding: 6, borderBottom: '1px solid var(--border)' }}>
        <Tab id="projects" label="프로젝트" />
        <Tab id="assets" label="에셋" />
      </div>

      {activeTab === 'projects' && (
        <>
          {/* Projects */}
          <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, padding: '0 4px' }}>
              폴더
            </div>
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => handleProjectClick(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px',
                  borderRadius: 6, cursor: 'pointer',
                  background: activeProjectId === p.id ? 'var(--accent-dim)' : 'transparent',
                  color: activeProjectId === p.id ? 'var(--accent)' : 'var(--text1)',
                  fontSize: 13,
                }}
                onMouseEnter={e => { if (activeProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (activeProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <FolderOpen size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
            ))}
            <button
              onClick={handleNewProject}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 6,
                border: '1px dashed var(--border2)', background: 'transparent',
                color: 'var(--text2)', cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
            >
              <FolderPlus size={12} /> 폴더 추가
            </button>
          </div>

          {/* Files in project */}
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>파일</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => setShowTemplates(true)} title="템플릿" style={{ padding: '2px 4px', border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', borderRadius: 4, fontSize: 10 }}><LayoutTemplate size={12} /></button>
                <button onClick={handleNewFile} title="새 파일" style={{ padding: '2px 4px', border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', borderRadius: 4 }}><Plus size={12} /></button>
              </div>
            </div>
            {files.map(f => (
              <div
                key={f.id}
                onClick={() => setActiveFile(f)}
                style={{
                  padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                  background: activeFile?.id === f.id ? 'var(--accent-dim)' : 'transparent',
                  color: activeFile?.id === f.id ? 'var(--accent)' : 'var(--text1)',
                  marginBottom: 2,
                }}
                onMouseEnter={e => { if (activeFile?.id !== f.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                onMouseLeave={e => { if (activeFile?.id !== f.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>
                  {format(new Date(f.updatedAt), 'M월 d일')} · {f.pages.length}페이지
                </div>
              </div>
            ))}
            {files.length === 0 && activeProjectId && (
              <div style={{ fontSize: 11, color: 'var(--text2)', padding: '8px 4px', textAlign: 'center' }}>
                파일이 없습니다.<br />
                <button onClick={handleNewFile} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, marginTop: 4 }}>+ 새 파일 만들기</button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'assets' && (
        <>
          {/* Upload + search */}
          <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6,
                border: '1px dashed var(--border2)', background: 'transparent',
                color: 'var(--text2)', cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', marginBottom: 6,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
            >
              <Upload size={12} /> 이미지 업로드
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUpload} />

            <div style={{ position: 'relative', marginBottom: 6 }}>
              <Search size={12} style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', pointerEvents: 'none' }} />
              <input
                value={assetFilter}
                onChange={e => setAssetFilter(e.target.value)}
                placeholder="에셋 검색..."
                style={{ width: '100%', height: 28, paddingLeft: 24, paddingRight: 8, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg2)', color: 'var(--text0)', fontSize: 12, fontFamily: 'var(--font-sans)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {['all', '이미지', '배경'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setAssetTag(tag)}
                  style={{
                    padding: '2px 7px', borderRadius: 4, border: '1px solid transparent',
                    background: assetTag === tag ? 'var(--accent-dim)' : 'var(--bg3)',
                    color: assetTag === tag ? 'var(--accent)' : 'var(--text2)',
                    borderColor: assetTag === tag ? 'var(--accent)' : 'transparent',
                    fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  }}
                >
                  {tag === 'all' ? '전체' : tag}
                </button>
              ))}
              <button
                onClick={() => setSortBy(s => s === 'date' ? 'name' : 'date')}
                title="정렬"
                style={{ marginLeft: 'auto', padding: '2px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', color: 'var(--text2)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <Calendar size={10} /> {sortBy === 'date' ? '날짜' : '이름'}
              </button>
            </div>
          </div>

          {/* Asset grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {filteredAssets.map(a => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('asset-src', a.src)}
                  onClick={() => addAssetToCanvas(a.src)}
                  style={{
                    aspectRatio: '4/3', borderRadius: 5, overflow: 'hidden',
                    border: '1px solid var(--border)', cursor: 'pointer',
                    position: 'relative', background: 'var(--bg3)',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  <img src={a.src} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 4px', background: 'rgba(0,0,0,0.5)', fontSize: 9, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.name}
                  </div>
                  <button
                    onClick={ev => { ev.stopPropagation(); deleteAsset(a.id) }}
                    style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 4, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.display = 'flex'}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
            {filteredAssets.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text2)', padding: 16, textAlign: 'center' }}>
                이미지를 업로드하거나<br />파일을 드래그하세요
              </div>
            )}
          </div>
        </>
      )}

      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} />}
    </div>
  )
}
