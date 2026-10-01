import '../styles/navbar.css'
import logoIcon from '../assets/icons/logo.svg'

interface NavbarProps {
  email: string
  onHome: () => void
  onSignOut: () => void
}

export default function Navbar({ email, onHome, onSignOut }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="brand">
          <div className="brand-logo">
            <img src={logoIcon} alt="" width={20} height={20} />
          </div>
          <span>FlowBoard</span>
        </div>
        <button className="nav-link" type="button" onClick={onHome}>
          Boards
        </button>
      </div>
      <div className="navbar-right">
        <span className="avatar" title={email} aria-label={email}>{email.charAt(0).toUpperCase()}</span>
        <button type="button" className="sign-out" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}
