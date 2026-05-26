import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { CanvasPage } from '@/types'
import toast from 'react-hot-toast'

// html2canvas 공통 옵션 — 깨짐 방지
const H2C_OPTS = {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  logging: false,
  imageTimeout: 15000,
  backgroundColor: '#ffffff',
}

async function captureEl(el: HTMLElement, w: number, h: number) {
  return html2canvas(el, { ...H2C_OPTS, width: w, height: h })
}

// 현재 페이지 PDF
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
    const canvas = await captureEl(canvasEl, canvasWidth, canvasHeight)
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvasWidth, canvasHeight)
    pdf.save(`${fileName}.pdf`)
    toast.success('PDF 저장 완료', { id: toastId })
  } catch (err) {
    console.error(err)
    toast.error('PDF 생성 실패', { id: toastId })
  }
}

// 모든 페이지 PDF
export async function exportAllPagesToPDF(
  canvasEl: HTMLElement,
  pages: CanvasPage[],
  currentPageIndex: number,
  canvasWidth: number,
  canvasHeight: number,
  fileName = 'portfolio',
  onPageChange: (idx: number) => void
): Promise<void> {
  const toastId = toast.loading(`전체 PDF 생성 중... (0/${pages.length})`)
  try {
    const orientation = canvasWidth > canvasHeight ? 'landscape' : 'portrait'
    const pdf = new jsPDF({ orientation, unit: 'pt', format: [canvasWidth, canvasHeight] })

    for (let i = 0; i < pages.length; i++) {
      toast.loading(`PDF 생성 중... (${i + 1}/${pages.length})`, { id: toastId })
      onPageChange(i)
      await new Promise(r => setTimeout(r, 300)) // 페이지 렌더 대기
      const canvas = await captureEl(canvasEl, canvasWidth, canvasHeight)
      if (i > 0) pdf.addPage([canvasWidth, canvasHeight], orientation)
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvasWidth, canvasHeight)
    }

    // 원래 페이지로 복귀
    onPageChange(currentPageIndex)
    pdf.save(`${fileName}_전체.pdf`)
    toast.success(`${pages.length}페이지 PDF 저장 완료`, { id: toastId })
  } catch (err) {
    console.error(err)
    toast.error('PDF 생성 실패', { id: toastId })
    onPageChange(currentPageIndex)
  }
}

// PNG 내보내기
export async function exportToPNG(
  canvasEl: HTMLElement,
  canvasWidth: number,
  canvasHeight: number,
  fileName = 'portfolio'
): Promise<void> {
  const toastId = toast.loading('PNG 생성 중...')
  try {
    const canvas = await captureEl(canvasEl, canvasWidth, canvasHeight)
    const link = document.createElement('a')
    link.download = `${fileName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('PNG 저장 완료', { id: toastId })
  } catch (err) {
    toast.error('PNG 생성 실패', { id: toastId })
  }
}

// JPG 내보내기
export async function exportToJPG(
  canvasEl: HTMLElement,
  canvasWidth: number,
  canvasHeight: number,
  fileName = 'portfolio'
): Promise<void> {
  const toastId = toast.loading('JPG 생성 중...')
  try {
    const canvas = await captureEl(canvasEl, canvasWidth, canvasHeight)
    const link = document.createElement('a')
    link.download = `${fileName}.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.click()
    toast.success('JPG 저장 완료', { id: toastId })
  } catch (err) {
    toast.error('JPG 생성 실패', { id: toastId })
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
