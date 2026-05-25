import { useEffect, useRef } from 'react'
import { useStore } from '@/stores/useStore'

export function useAutosave() {
  const { saveFile, activeFile, autoSaveInterval } = useStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!activeFile) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      useStore.getState().saveFile()
    }, autoSaveInterval * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [activeFile?.id, autoSaveInterval])
}
