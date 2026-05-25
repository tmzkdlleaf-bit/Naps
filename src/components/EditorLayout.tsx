import React from 'react'
import { Topbar } from '@/components/toolbar/Topbar'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { Canvas } from '@/components/canvas/Canvas'
import { RightPanel } from '@/components/panels/RightPanel'
import { PageStrip } from '@/components/canvas/PageStrip'
import { CanvasSizeButton } from '@/components/ui/CanvasSizeButton'

export const EditorLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar />

      {/* Secondary toolbar row - canvas size */}
      <div style={{
        height: 36, background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>캔버스</span>
        <CanvasSizeButton />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
          Ctrl+Z 실행취소 · T 텍스트 · V 선택 · Delete 삭제
        </span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Canvas />
          <PageStrip />
        </div>

        <RightPanel />
      </div>
    </div>
  )
}
