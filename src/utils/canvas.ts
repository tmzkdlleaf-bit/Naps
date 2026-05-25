import { CanvasElement } from '@/types'

export const MM_TO_PX = 3.7795275591

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX)
}

export function pxToMm(px: number): number {
  return Math.round((px / MM_TO_PX) * 10) / 10
}

const SNAP_THRESHOLD = 6

export interface SnapResult {
  x: number
  y: number
  guides: Array<{ type: 'h' | 'v'; pos: number }>
}

export function snapElement(
  nx: number, ny: number,
  w: number, h: number,
  canvasW: number, canvasH: number,
  others: CanvasElement[],
  enabled: boolean
): SnapResult {
  if (!enabled) return { x: nx, y: ny, guides: [] }

  let sx = nx, sy = ny
  const guides: Array<{ type: 'h' | 'v'; pos: number }> = []
  const SNAP = SNAP_THRESHOLD

  const vGuides = [0, canvasW / 2, canvasW]
  const hGuides = [0, canvasH / 2, canvasH]

  others.forEach(o => {
    vGuides.push(o.x, o.x + o.width / 2, o.x + o.width)
    hGuides.push(o.y, o.y + o.height / 2, o.y + o.height)
  })

  const cx = nx + w / 2, rx = nx + w
  for (const g of vGuides) {
    if (Math.abs(nx - g) < SNAP) { sx = g; guides.push({ type: 'v', pos: g }); break }
    if (Math.abs(cx - g) < SNAP) { sx = g - w / 2; guides.push({ type: 'v', pos: g }); break }
    if (Math.abs(rx - g) < SNAP) { sx = g - w; guides.push({ type: 'v', pos: g }); break }
  }

  const cy = ny + h / 2, by = ny + h
  for (const g of hGuides) {
    if (Math.abs(ny - g) < SNAP) { sy = g; guides.push({ type: 'h', pos: g }); break }
    if (Math.abs(cy - g) < SNAP) { sy = g - h / 2; guides.push({ type: 'h', pos: g }); break }
    if (Math.abs(by - g) < SNAP) { sy = g - h; guides.push({ type: 'h', pos: g }); break }
  }

  return { x: Math.round(sx), y: Math.round(sy), guides }
}

export function getCanvasPos(clientX: number, clientY: number, canvasEl: HTMLElement, zoom: number): { x: number; y: number } {
  const rect = canvasEl.getBoundingClientRect()
  return {
    x: Math.round((clientX - rect.left) / zoom),
    y: Math.round((clientY - rect.top) / zoom),
  }
}

export function fitZoom(canvasW: number, canvasH: number, containerW: number, containerH: number, padding = 48): number {
  const w = containerW - padding * 2
  const h = containerH - padding * 2
  return Math.min(w / canvasW, h / canvasH, 1.5)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

export function makeTextElement(x: number, y: number, zIndex: number): CanvasElement {
  return {
    id: generateId(), type: 'text', x, y, width: 200, height: 60,
    rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex, visible: true, locked: false,
    text: '텍스트를 입력하세요', fontSize: 16, fontFamily: 'Noto Sans KR',
    fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none',
    textAlign: 'left', color: '#111111', lineHeight: 1.4,
    fill: 'transparent',
  }
}

export function makeShapeElement(x: number, y: number, w: number, h: number, zIndex: number, shapeType = 'rect'): CanvasElement {
  return {
    id: generateId(), type: 'shape', x, y, width: w, height: h,
    rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex, visible: true, locked: false,
    shapeType: shapeType as any, fill: '#e2e8f0', stroke: 'transparent', strokeWidth: 0, borderRadius: 0,
    innerText: '', innerTextSize: 14, innerTextColor: '#111111', innerTextWeight: 'normal', innerTextAlign: 'center',
  }
}

export function makeLineElement(x: number, y: number, zIndex: number): CanvasElement {
  return {
    id: generateId(), type: 'line', x, y, width: 200, height: 2,
    rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex, visible: true, locked: false,
    shapeType: 'line_straight', stroke: '#475569', strokeWidth: 2, fill: 'transparent',
    lineStyle: 'solid', arrowStart: false, arrowEnd: false,
  }
}

export function makeImageElement(src: string, x: number, y: number, w: number, h: number, zIndex: number, assetId?: string): CanvasElement {
  return {
    id: generateId(), type: 'image', src, assetId, x, y, width: w, height: h,
    rotation: 0, opacity: 1, flipH: false, flipV: false, zIndex, visible: true, locked: false,
  }
}

export async function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 200, height: 200 })
    img.src = src
  })
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}

// SVG path helpers for complex shapes
export function getShapePath(shapeType: string, w: number, h: number): string {
  switch (shapeType) {
    case 'triangle':
      return `M${w/2},0 L${w},${h} L0,${h} Z`
    case 'diamond':
      return `M${w/2},0 L${w},${h/2} L${w/2},${h} L0,${h/2} Z`
    case 'pentagon': {
      const pts = Array.from({length:5},(_,i)=>{
        const a=(i*72-90)*Math.PI/180
        return `${w/2+w/2*Math.cos(a)},${h/2+h/2*Math.sin(a)}`
      })
      return `M${pts.join(' L')} Z`
    }
    case 'hexagon': {
      const pts = Array.from({length:6},(_,i)=>{
        const a=(i*60-30)*Math.PI/180
        return `${w/2+w/2*Math.cos(a)},${h/2+h/2*Math.sin(a)}`
      })
      return `M${pts.join(' L')} Z`
    }
    case 'star': {
      const oR=Math.min(w,h)/2, iR=oR*0.4, cx=w/2, cy=h/2
      const pts = Array.from({length:10},(_,i)=>{
        const a=(i*36-90)*Math.PI/180, r=i%2===0?oR:iR
        return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`
      })
      return `M${pts.join(' L')} Z`
    }
    case 'arrow': {
      const sh=h*0.35, mid=h/2, aw=w*0.35
      return `M0,${mid-sh/2} L${w-aw},${mid-sh/2} L${w-aw},0 L${w},${mid} L${w-aw},${h} L${w-aw},${mid+sh/2} L0,${mid+sh/2} Z`
    }
    case 'cross': {
      const t=Math.min(w,h)*0.3, cx=w/2, cy=h/2
      return `M${cx-t/2},0 L${cx+t/2},0 L${cx+t/2},${cy-t/2} L${w},${cy-t/2} L${w},${cy+t/2} L${cx+t/2},${cy+t/2} L${cx+t/2},${h} L${cx-t/2},${h} L${cx-t/2},${cy+t/2} L0,${cy+t/2} L0,${cy-t/2} L${cx-t/2},${cy-t/2} Z`
    }
    case 'speech': {
      const bH=h*0.8
      return `M10,0 Q0,0 0,10 L0,${bH-10} Q0,${bH} 10,${bH} L${w*0.15},${bH} L${w*0.1},${h} L${w*0.35},${bH} L${w-10},${bH} Q${w},${bH} ${w},${bH-10} L${w},10 Q${w},0 ${w-10},0 Z`
    }
    default:
      return ''
  }
}
