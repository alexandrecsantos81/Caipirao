import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// O <StrictMode> foi removido daqui para evitar o conflito com a biblioteca react-input-mask.
createRoot(document.getElementById('root')!).render(
  <App />
)
