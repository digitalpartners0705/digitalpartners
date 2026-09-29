import { useEffect } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

function AuthModal({ isOpen, mode, onModeChange, onClose, onSuccess }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-[#020617]/75"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[#f3e2b3] bg-[#fffdf8] p-6 text-slate-900 antialiased shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-8 ${
          mode === 'signup' ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#f6edd6] hover:text-slate-900"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {mode === 'signup' ? (
          <SignupForm onSwitchToLogin={() => onModeChange('login')} onSuccess={onSuccess} />
        ) : (
          <LoginForm onSwitchToSignup={() => onModeChange('signup')} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  )
}

export default AuthModal
