import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'


import Routess from './Routess.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Routess/>
  </StrictMode>,
)
