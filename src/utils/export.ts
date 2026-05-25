import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { CanvasPage } from '@/types'
import toast from 'react-hot-toast'

export async function exportToPDF(
  canvasEl: HTMLElement,
  pages: CanvasPage[],
  currentPageIndex: number,
  canvasWidth: number,
  canvasHeight: number,
  fileName = 'portfolio'
): Promise<void> {
  const toastId = toast.loading('PDF 생성 중...')
  try {
    const orientation = canvasWidth > canvasHeight ? 'landscape' : 'portrait'
    const pdf = new jsPDF({ orientation, unit: 'pt', format: [canvasWidth, canvasHeight] })
    const canvas = await html2canvas(canvasEl, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', width: canvasWidth, height: canvasHeight,
    })
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvasWidth, canvasHeight)
    pdf.save(`${fileName}.pdf`)
    toast.success('PDF 다운로드 완료', { id: toastId })
  } catch (err) {
    console.error(err)
    toast.error('PDF 생성 실패', { id: toastId })
  }
}

export async function capturePageThumbnail(canvasEl: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(canvasEl, { scale: 0.25, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' })
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch { return '' }
}

export function generateShareLink(fileId: string): string {
  const token = btoa(`naps:${fileId}:${Date.now()}`)
  return `${window.location.origin}/view/${token}`
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('링크가 복사되었습니다')
  } catch { toast.error('클립보드 복사 실패') }
}
