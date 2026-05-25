import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { HomeScreen } from '@/components/HomeScreen'
import { EditorLayout } from '@/components/EditorLayout'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'

type View = 'home' | 'editor'

function App() {
  const [view, setView] = useState<View>('home')
  const { setTheme, setUserId, loadAssets, loadProjects } = useStore()

  useEffect(() => {
    // Restore theme
    const saved = localStorage.getItem('naps-theme') as any
    if (saved) setTheme(saved)
    else document.documentElement.setAttribute('data-theme', 'dark')

    // Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
      if (session?.user) {
        loadProjects()
        loadAssets()
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Keyboard shortcut: Cmd+S save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (view === 'editor') useStore.getState().saveFile()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Global nav */}
        <div style={{
          height: 44, background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 4, flexShrink: 0, zIndex: 100,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)', letterSpacing: -0.5, marginRight: 12 }}>Naps</span>

          {(['home', 'editor'] as View[]).map((v, i) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                height: 28, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === v ? 'var(--accent-dim)' : 'transparent',
                color: view === v ? 'var(--accent)' : 'var(--text1)',
                fontSize: 13, fontFamily: 'var(--font-sans)',
              }}
            >
              {['홈', '편집기'][i]}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Auth placeholder */}
          <button
            onClick={async () => {
              const { data } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
            }}
            style={{
              height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text1)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-sans)',
            }}
          >
            로그인
          </button>
        </div>

        {view === 'home' && <HomeScreen onOpenEditor={() => setView('editor')} />}
        {view === 'editor' && <EditorLayout />}
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg2)',
            color: 'var(--text0)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#000' } },
        }}
      />
    </>
  )
}

export default App
