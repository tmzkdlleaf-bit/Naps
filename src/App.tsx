import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { HomeScreen } from '@/components/HomeScreen'
import { EditorLayout } from '@/components/EditorLayout'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type View = 'home' | 'editor'

function App() {
  const [view, setView] = useState<View>('home')
  const [user, setUser] = useState<any>(null)
  const { setTheme, setUserId, loadAssets, loadProjects } = useStore()

  useEffect(() => {
    // 테마 복원
    const saved = localStorage.getItem('naps-theme') as any
    if (saved) setTheme(saved)
    else document.documentElement.setAttribute('data-theme', 'dark')

    // URL 해시에서 OAuth 콜백 처리
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user)
          setUserId(session.user.id)
          loadProjects()
          loadAssets()
          toast.success(`${session.user.email}로 로그인되었습니다`)
          // 해시 제거
          window.history.replaceState(null, '', window.location.pathname)
        }
      })
      return
    }

    // 기존 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setUserId(session.user.id)
        loadProjects()
        loadAssets()
      }
    })

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        setUserId(session.user.id)
        loadProjects()
        loadAssets()
        toast.success(`${session.user.email}로 로그인되었습니다`)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserId(null)
        toast('로그아웃되었습니다')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Ctrl+S 저장
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

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) toast.error('로그인 실패: ' + error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* 상단 네비게이션 */}
        <div style={{
          height: 44, background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 4, flexShrink: 0, zIndex: 100,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: -0.5, marginRight: 12, userSelect: 'none' }}>
            Naps
          </span>

          {(['home', 'editor'] as View[]).map((v, i) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                height: 28, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === v ? 'var(--accent-dim)' : 'transparent',
                color: view === v ? 'var(--accent)' : 'var(--text1)',
                fontSize: 13, fontFamily: 'var(--font-sans)',
              }}>
              {['홈', '편집기'][i]}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {user.email}
              </span>
              <button onClick={handleLogout}
                style={{
                  height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text1)', cursor: 'pointer',
                  fontSize: 12, fontFamily: 'var(--font-sans)',
                }}>
                로그아웃
              </button>
            </div>
          ) : (
            <button onClick={handleLogin}
              style={{
                height: 28, padding: '0 12px', borderRadius: 6, border: '1px solid var(--accent)',
                background: 'var(--accent-dim)', color: 'var(--accent)', cursor: 'pointer',
                fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </button>
          )}
        </div>

        {view === 'home' && <HomeScreen onOpenEditor={() => setView('editor')} />}
        {view === 'editor' && <EditorLayout />}
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg2)', color: 'var(--text0)',
            border: '1px solid var(--border)', borderRadius: 8,
            fontSize: 13, fontFamily: 'var(--font-sans)',
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#000' } },
        }}
      />
    </>
  )
}

export default App
