import { useState } from 'react'
import type { FormEvent } from 'react'
import '../styles/login.css'
import logoLg from '../assets/icons/logo-lg.svg'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setMessage(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ text: error.message, error: true })
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage({ text: error.message, error: true })
      else if (!data.session) setMessage({ text: 'Check your email to confirm your account, then sign in.', error: false })
    }
    setBusy(false)
  }

  return (
    <div className="login">
      <div className="login-brand">
        <div className="login-logo">
          <img src={logoLg} alt="" width={24} height={24} />
        </div>
        <h1 className="login-title">FlowBoard</h1>
        <p className="login-sub">
          {mode === 'signin' ? 'Sign in to manage your boards' : 'Create an account to get started'}
        </p>
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="tabs">
          <button
            type="button"
            aria-pressed={mode === 'signin'}
            className={`tab${mode === 'signin' ? ' active' : ''}`}
            onClick={() => switchMode('signin')}
          >
            Password
          </button>
          <button
            type="button"
            aria-pressed={mode === 'signup'}
            className={`tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>
        <div className="form">
          <label className="field">
            <span className="field-label">Email Address</span>
            <input className="input" type="email" required autoComplete="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input className="input" type="password" required minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="At least 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {message && <p className={`login-msg${message.error ? ' error' : ''}`}>{message.text}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  )
}
