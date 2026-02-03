import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppDofus from './AppDofus'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppDofus />
  </StrictMode>
)
