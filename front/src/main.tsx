import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Navigate,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom"
import Root from './routes/Root'
import Openings from './routes/Openings'
import Companies from './routes/Companies'
import './base.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/openings" />
  },
  {
    element: <Root />,
    children: [
      { path: 'openings', element: <Openings /> },
      { path: 'companies', element: <Companies /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
