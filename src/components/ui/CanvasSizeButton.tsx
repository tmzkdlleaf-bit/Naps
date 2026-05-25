import React, { useState } from 'react'
import { Crop } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { CanvasSizeModal } from '@/components/modals/CanvasSizeModal'

export const CanvasSizeButton: React.FC = () => {
  const { canvasWidth, canvasHeight } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="캔버스 크기 변경"
        style={{
          height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)',
          background: 'var(--bg2)', color: 'var(--text1)', cursor: 'pointer',
          fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5,
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
      >
        <Crop size={12} />
        {canvasWidth} × {canvasHeight}
      </button>
      {open && <CanvasSizeModal onClose={() => setOpen(false)} />}
    </>
  )
}
