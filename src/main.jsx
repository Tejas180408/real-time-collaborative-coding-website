import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Routes } from 'react-router-dom'
import UserProfile from './Components/UserProfile.jsx'
import Home from './Components/Home.jsx'
import { UserProvider } from './Components/UserContext.jsx'
import Editor from './Components/Editor.jsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App/>}>
      <Route path='/Home' element={<Home/>}/>
      <Route path='/UserProfile' element={<UserProfile/>}/>
      <Route path='/Editor/:roomId' element={<Editor/>}/>
    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <UserProvider>
    <StrictMode>
      <RouterProvider router={router}/>
    </StrictMode>
  </UserProvider>
)
