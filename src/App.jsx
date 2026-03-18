import { Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WorldPage from './pages/WorldPage'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40, color: '#ff4444', background: '#1a1a1a',
          fontFamily: 'monospace', fontSize: 14, minHeight: '100vh',
        }}>
          <h2>💥 Erreur capturée</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ffaa00' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: 11 }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
            style={{ marginTop: 20, padding: '8px 20px', cursor: 'pointer' }}
          >
            Retour à l'accueil
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/world" element={<WorldPage />} />
          <Route path="/world/:theoryId" element={<WorldPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
