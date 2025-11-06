import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { SystemProvider } from './contexts/SystemContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SystemProvider>
        <App />
      </SystemProvider>
    </AuthProvider>
  </React.StrictMode>,
)
