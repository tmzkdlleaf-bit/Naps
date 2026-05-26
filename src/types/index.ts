export type Theme = 'dark' | 'light' | 'green'
export type ToolType = 'select' | 'text' | 'shape' | 'line' | 'image' | 'hand'
export type ElementType = 'image' | 'text' | 'shape' | 'line'
export type ShapeType = 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'star' | 'arrow' | 'speech' | 'cylinder' | 'cross' | 'line_straight' | 'line_dashed' | 'line_dotted'

export interface CanvasElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  flipH: boolean
  flipV: boolean
  zIndex: number
  visible: boolean
  locked: boolean

  // Image
  src?: string
  assetId?: string

  // Text
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  lineHeight?: number
  letterSpacing?: number

  // Shape
  shapeType?: ShapeType
  fill?: string
  stroke?: string
  strokeWidth?: number
  borderRadius?: number
  imageFill?: string // 도형 내부 이미지 URL

  // Shape inner text
  innerText?: string
  innerTextSize?: number
  innerTextColor?: string
  innerTextWeight?: 'normal' | 'bold'
  innerTextAlign?: 'left' | 'center' | 'right'

  // Line
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  arrowStart?: boolean
  arrowEnd?: boolean

  // Group
  groupId?: string
}

export interface CanvasPage {
  id: string
  elements: CanvasElement[]
  background: string
  name: string
}

export type CanvasSize = {
  name: string
  width: number
  height: number
  unit: 'px' | 'mm'
}

export const CANVAS_SIZES: CanvasSize[] = [
  { name: 'A4 세로', width: 595, height: 842, unit: 'px' },
  { name: 'A4 가로', width: 842, height: 595, unit: 'px' },
  { name: 'A3', width: 842, height: 1191, unit: 'px' },
  { name: 'B4', width: 709, height: 1004, unit: 'px' },
  { name: 'Letter', width: 612, height: 792, unit: 'px' },
  { name: 'HD 16:9', width: 1280, height: 720, unit: 'px' },
  { name: '정사각형', width: 800, height: 800, unit: 'px' },
  { name: 'Instagram', width: 1080, height: 1080, unit: 'px' },
  { name: '사용자 지정', width: 595, height: 842, unit: 'px' },
]

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  userId?: string
}

export interface PortfolioFile {
  id: string
  projectId: string
  name: string
  pages: CanvasPage[]
  canvasWidth: number
  canvasHeight: number
  watermark: string
  watermarkEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  name: string
  src: string
  thumbnail?: string
  tags: string[]
  createdAt: string
  size: number
  projectId?: string
}

export interface Template {
  id: string
  name: string
  thumbnail?: string
  pages: CanvasPage[]
  canvasWidth: number
  canvasHeight: number
  isCustom?: boolean
  createdAt: string
}

export type AlignDirection = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

export interface HistoryEntry {
  pages: CanvasPage[]
  currentPageIndex: number
}
