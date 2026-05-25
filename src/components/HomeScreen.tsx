import React, { useEffect, useState } from 'react'
import { FolderPlus, Plus, Trash2, FileText, ChevronRight } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { format } from 'date-fns'

interface Props {
  onOpenEditor: () => void
}

export const HomeScreen: React.FC<Props> = ({ onOpenEditor }) => {
  const {
    projects, loadProjects, createProject, deleteProject,
    files, loadFiles, createFile, setActiveFile, activeProjectId, setActiveProject,
  } = useStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    loadProjects().finally(() => setLoading(false))
  }, [])

  const handleProjectClick = async (id: string) => {
    setActiveProject(id)
    await loadFiles(id)
  }

  const handleNewProject = async () => {
    const name = prompt('프로젝트 이름:')
    if (!name) return
    await createProject(name)
  }

  const handleNewFile = async (projectId: string) => {
    const name = prompt('파일 이름:', '새 포트폴리오')
    if (!name) return
    await createFile(projectId, name)
    onOpenEditor()
  }

  const handleOpenFile = (file: any) => {
    setActiveFile(file)
    onOpenEditor()
  }

  const activeProject = projects.find(p => p.id === activeProjectId)

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', background: 'var(--bg0)' }}>
      {/* Project sidebar */}
      <div style={{ width: 240, background: 'var(--bg1)', borderRight: '1px solid var(--border)', padding: 16, flexShrink: 0, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>프로젝트</span>
          <button onClick={handleNewProject} style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text2)'}
          >
            <Plus size={14} />
          </button>
        </div>

        {projects.map(p => (
          <div
            key={p.id}
            onClick={() => handleProjectClick(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
              borderRadius: 7, cursor: 'pointer', marginBottom: 2,
              background: activeProjectId === p.id ? 'var(--accent-dim)' : 'transparent',
              color: activeProjectId === p.id ? 'var(--accent)' : 'var(--text1)', fontSize: 13,
            }}
            onMouseEnter={e => { if (activeProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
            onMouseLeave={e => { if (activeProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <span style={{ fontSize: 14 }}>📁</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <ChevronRight size={12} style={{ opacity: 0.5 }} />
          </div>
        ))}

        {projects.length === 0 && !loading && (
          <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', padding: 16 }}>
            <div style={{ marginBottom: 8 }}>프로젝트가 없습니다</div>
            <button onClick={handleNewProject} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>+ 새 프로젝트</button>
          </div>
        )}
      </div>

      {/* Files grid */}
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 2 }}>
                {activeProject ? activeProject.name : '포트폴리오'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                {activeProject ? `${files.length}개의 파일` : '프로젝트를 선택하세요'}
              </p>
            </div>
            {activeProjectId && (
              <button
                onClick={() => handleNewFile(activeProjectId)}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 7, border: 'none',
                  background: 'var(--accent)', color: '#000', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={15} /> 새 파일
              </button>
            )}
          </div>

          {activeProjectId ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {files.map(f => (
                <div
                  key={f.id}
                  onClick={() => handleOpenFile(f)}
                  style={{
                    borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden',
                    cursor: 'pointer', background: 'var(--bg1)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
                >
                  {/* Thumbnail */}
                  <div style={{ height: 130, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
                    <FileText size={32} style={{ color: '#94a3b8' }} />
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {format(new Date(f.updatedAt), 'M월 d일 HH:mm')} · {f.pages.length}p
                    </div>
                  </div>
                </div>
              ))}

              {/* New file card */}
              <div
                onClick={() => handleNewFile(activeProjectId)}
                style={{
                  borderRadius: 10, border: '1.5px dashed var(--border2)', overflow: 'hidden',
                  cursor: 'pointer', background: 'transparent', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, minHeight: 185, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Plus size={24} style={{ color: 'var(--text2)' }} />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>새 포트폴리오</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📂</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>왼쪽에서 프로젝트를 선택하거나 새로 만드세요</div>
              <button onClick={handleNewProject} style={{ height: 34, padding: '0 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text1)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                + 새 프로젝트 만들기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
