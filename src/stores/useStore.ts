import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  CanvasElement, CanvasPage, PortfolioFile, Project,
  Asset, Template, Theme, ToolType, HistoryEntry, AlignDirection
} from '@/types'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const MAX_HISTORY = 50

function makeDefaultPage(): CanvasPage {
  return { id: uuidv4(), name: '페이지 1', elements: [], background: '#ffffff' }
}

function makeDefaultFile(projectId: string): PortfolioFile {
  return {
    id: uuidv4(), projectId, name: '새 포트폴리오',
    pages: [makeDefaultPage()], canvasWidth: 595, canvasHeight: 842,
    watermark: '© My Portfolio', watermarkEnabled: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
}

interface State {
  userId: string | null
  setUserId: (id: string | null) => void
  theme: Theme
  setTheme: (t: Theme) => void
  projects: Project[]
  activeProjectId: string | null
  loadProjects: () => Promise<void>
  createProject: (name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string) => void
  files: PortfolioFile[]
  activeFile: PortfolioFile | null
  loadFiles: (projectId: string) => Promise<void>
  createFile: (projectId: string, name: string) => Promise<void>
  saveFile: () => Promise<void>
  setActiveFile: (file: PortfolioFile) => void
  canvasWidth: number
  canvasHeight: number
  setCanvasSize: (w: number, h: number) => void
  zoom: number
  setZoom: (z: number) => void
  showGrid: boolean
  toggleGrid: () => void
  showRulers: boolean
  toggleRulers: () => void
  snapEnabled: boolean
  toggleSnap: () => void
  pages: CanvasPage[]
  currentPageIndex: number
  addPage: () => void
  deletePage: (idx: number) => void
  renamePage: (idx: number, name: string) => void
  goToPage: (idx: number) => void
  duplicatePage: (idx: number) => void
  elements: CanvasElement[]
  selectedIds: string[]
  selectElement: (id: string | null, multi?: boolean) => void
  addElement: (el: CanvasElement) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  updateElements: (ids: string[], updates: Partial<CanvasElement>) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  alignSelected: (dir: AlignDirection) => void
  layerUp: () => void
  layerDown: () => void
  layerToFront: () => void
  layerToBack: () => void
  flipH: () => void
  flipV: () => void
  groupSelected: () => void
  ungroupSelected: () => void
  lockSelected: () => void
  activeTool: ToolType
  setTool: (t: ToolType) => void
  activeShapeType: string
  setActiveShapeType: (s: string) => void
  watermark: string
  watermarkEnabled: boolean
  setWatermark: (text: string) => void
  toggleWatermark: () => void
  assets: Asset[]
  loadAssets: () => Promise<void>
  uploadAsset: (file: File, projectId?: string) => Promise<Asset | null>
  deleteAsset: (id: string) => Promise<void>
  assetFilter: string
  assetTag: string
  setAssetFilter: (q: string) => void
  setAssetTag: (tag: string) => void
  templates: Template[]
  loadTemplates: () => Promise<void>
  applyTemplate: (t: Template) => void
  saveAsTemplate: (name: string) => Promise<void>
  history: HistoryEntry[]
  historyIndex: number
  undo: () => void
  redo: () => void
  pushHistory: () => void
  // 자동 저장
  autoSaveInterval: number
  setAutoSaveInterval: (sec: number) => void
}

export const useStore = create<State>((set, get) => ({
  userId: null,
  setUserId: (userId) => set({ userId }),

  theme: 'dark',
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('naps-theme', theme)
  },

  projects: [],
  activeProjectId: null,
  loadProjects: async () => {
    const { userId } = get()
    if (!userId) return
    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false })
    if (!error && data) {
      set({ projects: data.map(p => ({ id: p.id, name: p.name, thumbnail: p.thumbnail, createdAt: p.created_at, updatedAt: p.updated_at })) })
    }
  },
  createProject: async (name) => {
    const { userId } = get()
    if (!userId) {
      const p: Project = { id: uuidv4(), name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      set(s => ({ projects: [p, ...s.projects] })); return
    }
    const { data, error } = await supabase.from('projects').insert({ name, user_id: userId }).select().single()
    if (!error && data) {
      set(s => ({ projects: [{ id: data.id, name: data.name, createdAt: data.created_at, updatedAt: data.updated_at }, ...s.projects] }))
    }
  },
  deleteProject: async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
  },
  setActiveProject: (id) => set({ activeProjectId: id }),

  files: [],
  activeFile: null,
  loadFiles: async (projectId) => {
    const { data, error } = await supabase.from('portfolio_files').select('*').eq('project_id', projectId).order('updated_at', { ascending: false })
    if (!error && data) {
      set({ files: data.map(f => ({ id: f.id, projectId: f.project_id, name: f.name, pages: f.pages || [makeDefaultPage()], canvasWidth: f.canvas_width, canvasHeight: f.canvas_height, watermark: f.watermark || '', watermarkEnabled: f.watermark_enabled, createdAt: f.created_at, updatedAt: f.updated_at })) })
    }
  },
  createFile: async (projectId, name) => {
    const file = makeDefaultFile(projectId)
    file.name = name
    const { userId } = get()
    if (userId) {
      const { data } = await supabase.from('portfolio_files').insert({ id: file.id, project_id: projectId, user_id: userId, name, pages: file.pages, canvas_width: 595, canvas_height: 842, watermark: '', watermark_enabled: false }).select().single()
      if (data) file.id = data.id
    }
    set(s => ({ files: [file, ...s.files], activeFile: file, pages: file.pages, elements: file.pages[0]?.elements || [], currentPageIndex: 0, canvasWidth: file.canvasWidth, canvasHeight: file.canvasHeight, watermark: file.watermark, watermarkEnabled: file.watermarkEnabled, selectedIds: [] }))
    get().pushHistory()
  },
  saveFile: async () => {
    const { activeFile, pages, currentPageIndex, elements, canvasWidth, canvasHeight, watermark, watermarkEnabled, userId } = get()
    if (!activeFile) return
    const updatedPages = pages.map((p, i) => i === currentPageIndex ? { ...p, elements } : p)
    const updated: PortfolioFile = { ...activeFile, pages: updatedPages, canvasWidth, canvasHeight, watermark, watermarkEnabled, updatedAt: new Date().toISOString() }
    set({ activeFile: updated, files: get().files.map(f => f.id === updated.id ? updated : f) })
    if (userId) {
      await supabase.from('portfolio_files').update({ pages: updatedPages, canvas_width: canvasWidth, canvas_height: canvasHeight, watermark, watermark_enabled: watermarkEnabled, updated_at: updated.updatedAt }).eq('id', updated.id)
    }
    toast.success('저장되었습니다')
  },
  setActiveFile: (file) => {
    set({ activeFile: file, pages: file.pages, elements: file.pages[0]?.elements || [], currentPageIndex: 0, canvasWidth: file.canvasWidth, canvasHeight: file.canvasHeight, watermark: file.watermark, watermarkEnabled: file.watermarkEnabled, selectedIds: [] })
    get().pushHistory()
  },

  canvasWidth: 595, canvasHeight: 842,
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
  zoom: 1, setZoom: (zoom) => set({ zoom }),
  showGrid: false, toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  showRulers: true, toggleRulers: () => set(s => ({ showRulers: !s.showRulers })),
  snapEnabled: true, toggleSnap: () => set(s => ({ snapEnabled: !s.snapEnabled })),

  pages: [makeDefaultPage()],
  currentPageIndex: 0,
  addPage: () => {
    const { pages, currentPageIndex, elements } = get()
    const updated = pages.map((p, i) => i === currentPageIndex ? { ...p, elements } : p)
    const newPage = { ...makeDefaultPage(), name: `페이지 ${updated.length + 1}` }
    set({ pages: [...updated, newPage], currentPageIndex: updated.length, elements: [], selectedIds: [] })
    get().pushHistory()
  },
  deletePage: (idx) => {
    const { pages } = get()
    if (pages.length <= 1) { toast.error('마지막 페이지는 삭제할 수 없습니다'); return }
    const newPages = pages.filter((_, i) => i !== idx)
    const newIdx = Math.min(idx, newPages.length - 1)
    set({ pages: newPages, currentPageIndex: newIdx, elements: newPages[newIdx].elements, selectedIds: [] })
    get().pushHistory()
  },
  renamePage: (idx, name) => set(s => ({ pages: s.pages.map((p, i) => i === idx ? { ...p, name } : p) })),
  goToPage: (idx) => {
    const { pages, currentPageIndex, elements } = get()
    const updated = pages.map((p, i) => i === currentPageIndex ? { ...p, elements } : p)
    set({ pages: updated, currentPageIndex: idx, elements: updated[idx]?.elements || [], selectedIds: [] })
  },
  duplicatePage: (idx) => {
    const { pages } = get()
    const copy = { ...pages[idx], id: uuidv4(), name: pages[idx].name + ' 복사', elements: pages[idx].elements.map(e => ({ ...e, id: uuidv4() })) }
    const newPages = [...pages.slice(0, idx + 1), copy, ...pages.slice(idx + 1)]
    set({ pages: newPages, currentPageIndex: idx + 1, elements: copy.elements, selectedIds: [] })
    get().pushHistory()
  },

  elements: [],
  selectedIds: [],
  selectElement: (id, multi = false) => {
    if (!id) { set({ selectedIds: [] }); return }
    set(s => ({ selectedIds: multi ? (s.selectedIds.includes(id) ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id]) : [id] }))
  },
  addElement: (el) => { set(s => ({ elements: [...s.elements, el], selectedIds: [el.id] })); get().pushHistory() },
  updateElement: (id, updates) => set(s => ({ elements: s.elements.map(e => e.id === id ? { ...e, ...updates } : e) })),
  updateElements: (ids, updates) => set(s => ({ elements: s.elements.map(e => ids.includes(e.id) ? { ...e, ...updates } : e) })),
  deleteSelected: () => {
    const { selectedIds, elements } = get()
    if (!selectedIds.length) return
    set({ elements: elements.filter(e => !selectedIds.includes(e.id) || e.locked), selectedIds: [] })
    get().pushHistory()
  },
  duplicateSelected: () => {
    const { selectedIds, elements } = get()
    const copies = elements.filter(e => selectedIds.includes(e.id)).map(e => ({ ...e, id: uuidv4(), x: e.x + 12, y: e.y + 12, zIndex: elements.length + 1 }))
    set(s => ({ elements: [...s.elements, ...copies], selectedIds: copies.map(c => c.id) }))
    get().pushHistory()
  },
  alignSelected: (dir) => {
    const { selectedIds, elements, canvasWidth, canvasHeight } = get()
    if (!selectedIds.length) return
    const updated = elements.map(e => {
      if (!selectedIds.includes(e.id)) return e
      switch (dir) {
        case 'left': return { ...e, x: 0 }
        case 'right': return { ...e, x: canvasWidth - e.width }
        case 'center': return { ...e, x: (canvasWidth - e.width) / 2 }
        case 'top': return { ...e, y: 0 }
        case 'bottom': return { ...e, y: canvasHeight - e.height }
        case 'middle': return { ...e, y: (canvasHeight - e.height) / 2 }
        default: return e
      }
    })
    set({ elements: updated }); get().pushHistory()
  },
  layerUp: () => { const { selectedIds, elements } = get(); const maxZ = Math.max(...elements.map(e => e.zIndex)); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, zIndex: Math.min(e.zIndex + 1, maxZ + 1) } : e) })) },
  layerDown: () => { const { selectedIds } = get(); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, zIndex: Math.max(e.zIndex - 1, 0) } : e) })) },
  layerToFront: () => { const { selectedIds, elements } = get(); const maxZ = Math.max(...elements.map(e => e.zIndex)); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, zIndex: maxZ + 1 } : e) })) },
  layerToBack: () => { const { selectedIds } = get(); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, zIndex: 0 } : e) })) },
  flipH: () => { const { selectedIds } = get(); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, flipH: !e.flipH } : e) })) },
  flipV: () => { const { selectedIds } = get(); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, flipV: !e.flipV } : e) })) },

  // 그룹화
  groupSelected: () => {
    const { selectedIds, elements } = get()
    if (selectedIds.length < 2) { toast('2개 이상 선택 후 그룹화하세요'); return }
    const toGroup = elements.filter(e => selectedIds.includes(e.id))
    const minX = Math.min(...toGroup.map(e => e.x)), minY = Math.min(...toGroup.map(e => e.y))
    const maxX = Math.max(...toGroup.map(e => e.x + e.width)), maxY = Math.max(...toGroup.map(e => e.y + e.height))
    const groupEl: CanvasElement = {
      id: uuidv4(), type: 'shape', shapeType: 'rect',
      x: minX, y: minY, width: maxX - minX, height: maxY - minY,
      rotation: 0, opacity: 1, flipH: false, flipV: false,
      zIndex: Math.max(...toGroup.map(e => e.zIndex)),
      visible: true, locked: false,
      fill: 'transparent', stroke: '#4ade80', strokeWidth: 1,
      groupId: uuidv4(),
    }
    // 자식에 groupId 부여
    const childIds = toGroup.map(e => e.id)
    set(s => ({
      elements: s.elements.map(e => childIds.includes(e.id) ? { ...e, groupId: groupEl.groupId } : e).concat([groupEl]),
      selectedIds: [groupEl.id],
    }))
    get().pushHistory()
    toast.success('그룹화되었습니다')
  },

  // 그룹 해제
  ungroupSelected: () => {
    const { selectedIds, elements } = get()
    const groupEl = elements.find(e => selectedIds.includes(e.id) && e.groupId && e.type === 'shape' && e.fill === 'transparent' && e.stroke === '#4ade80')
    if (!groupEl) { toast.error('그룹 요소를 선택하세요'); return }
    const children = elements.filter(e => e.groupId === groupEl.groupId && e.id !== groupEl.id)
    const ungrouped = children.map(e => ({ ...e, groupId: undefined }))
    set(s => ({
      elements: s.elements.filter(e => e.id !== groupEl.id && e.groupId !== groupEl.groupId).concat(ungrouped),
      selectedIds: ungrouped.map(e => e.id),
    }))
    get().pushHistory()
    toast.success('그룹 해제되었습니다')
  },

  lockSelected: () => { const { selectedIds } = get(); set(s => ({ elements: s.elements.map(e => selectedIds.includes(e.id) ? { ...e, locked: !e.locked } : e) })) },

  activeTool: 'select',
  setTool: (activeTool) => set({ activeTool }),
  activeShapeType: 'rect',
  setActiveShapeType: (activeShapeType) => set({ activeShapeType }),

  watermark: '© My Portfolio',
  watermarkEnabled: false,
  setWatermark: (watermark) => set({ watermark }),
  toggleWatermark: () => set(s => ({ watermarkEnabled: !s.watermarkEnabled })),

  assets: [],
  assetFilter: '', assetTag: 'all',
  setAssetFilter: (assetFilter) => set({ assetFilter }),
  setAssetTag: (assetTag) => set({ assetTag }),
  loadAssets: async () => {
    const { userId } = get()
    if (!userId) {
      // 로그인 없이도 localStorage에서 에셋 복원
      const saved = localStorage.getItem('naps-assets-local')
      if (saved) set({ assets: JSON.parse(saved) })
      return
    }
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false })
    if (data) set({ assets: data.map(a => ({ id: a.id, name: a.name, src: a.src, thumbnail: a.thumbnail, tags: a.tags || [], createdAt: a.created_at, size: a.size || 0, projectId: a.project_id })) })
  },
  uploadAsset: async (file, projectId) => {
    const { userId } = get()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const src = e.target?.result as string
        const asset: Asset = { id: uuidv4(), name: file.name, src, tags: ['이미지'], createdAt: new Date().toISOString(), size: file.size, projectId }
        if (userId) {
          const path = `${userId}/${asset.id}-${file.name}`
          const { data: storageData } = await supabase.storage.from('assets').upload(path, file)
          if (storageData) {
            const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path)
            asset.src = urlData.publicUrl
          }
          await supabase.from('assets').insert({ id: asset.id, user_id: userId, project_id: projectId, name: asset.name, src: asset.src, tags: asset.tags, size: asset.size })
        } else {
          // 비로그인: localStorage에 저장
          const current = JSON.parse(localStorage.getItem('naps-assets-local') || '[]')
          localStorage.setItem('naps-assets-local', JSON.stringify([asset, ...current]))
        }
        set(s => ({ assets: [asset, ...s.assets] }))
        resolve(asset)
      }
      reader.readAsDataURL(file)
    })
  },
  deleteAsset: async (id) => {
    await supabase.from('assets').delete().eq('id', id)
    set(s => ({ assets: s.assets.filter(a => a.id !== id) }))
    // localStorage도 삭제
    const current = JSON.parse(localStorage.getItem('naps-assets-local') || '[]')
    localStorage.setItem('naps-assets-local', JSON.stringify(current.filter((a: Asset) => a.id !== id)))
  },

  templates: [],
  loadTemplates: async () => {
    const { userId } = get()
    // localStorage에서 사용자 템플릿 복원
    const localTpl = JSON.parse(localStorage.getItem('naps-templates-local') || '[]')
    if (userId) {
      const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false })
      if (data) {
        set({ templates: [...data.map(t => ({ id: t.id, name: t.name, thumbnail: t.thumbnail, pages: t.pages, canvasWidth: t.canvas_width, canvasHeight: t.canvas_height, isCustom: t.is_custom, createdAt: t.created_at })), ...localTpl] })
        return
      }
    }
    set({ templates: localTpl })
  },
  applyTemplate: (t) => {
    set({ pages: t.pages.map(p => ({ ...p, id: uuidv4(), elements: p.elements.map(e => ({ ...e, id: uuidv4() })) })), currentPageIndex: 0, canvasWidth: t.canvasWidth, canvasHeight: t.canvasHeight, elements: t.pages[0]?.elements.map(e => ({ ...e, id: uuidv4() })) || [], selectedIds: [] })
    get().pushHistory()
  },
  saveAsTemplate: async (name) => {
    const { pages, currentPageIndex, elements, canvasWidth, canvasHeight, userId } = get()
    const allPages = pages.map((p, i) => i === currentPageIndex ? { ...p, elements } : p)
    const template: Template = { id: uuidv4(), name, pages: allPages, canvasWidth, canvasHeight, isCustom: true, createdAt: new Date().toISOString() }
    // localStorage에도 저장 (비로그인 포함)
    const current = JSON.parse(localStorage.getItem('naps-templates-local') || '[]')
    localStorage.setItem('naps-templates-local', JSON.stringify([template, ...current]))
    if (userId) {
      await supabase.from('templates').insert({ id: template.id, user_id: userId, name, pages: allPages, canvas_width: canvasWidth, canvas_height: canvasHeight, is_custom: true })
    }
    set(s => ({ templates: [template, ...s.templates] }))
    toast.success(`템플릿 "${name}" 저장 완료`)
  },

  history: [{ pages: [makeDefaultPage()], currentPageIndex: 0 }],
  historyIndex: 0,
  pushHistory: () => {
    const { pages, currentPageIndex, elements, history, historyIndex } = get()
    const entry: HistoryEntry = { pages: pages.map((p, i) => i === currentPageIndex ? { ...p, elements } : p), currentPageIndex }
    const newHistory = [...history.slice(0, historyIndex + 1), entry].slice(-MAX_HISTORY)
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const entry = history[historyIndex - 1]
    set({ historyIndex: historyIndex - 1, pages: entry.pages, currentPageIndex: entry.currentPageIndex, elements: entry.pages[entry.currentPageIndex]?.elements || [], selectedIds: [] })
  },
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const entry = history[historyIndex + 1]
    set({ historyIndex: historyIndex + 1, pages: entry.pages, currentPageIndex: entry.currentPageIndex, elements: entry.pages[entry.currentPageIndex]?.elements || [], selectedIds: [] })
  },

  autoSaveInterval: 30,
  setAutoSaveInterval: (sec) => set({ autoSaveInterval: sec }),
}))
