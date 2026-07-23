import { createBrowserRouter } from 'react-router'

import { GALLERY_BASE_PATH, routerBasePath } from '../base-path'
import App from './App'
import { ErrorElement } from './components/common/ErrorElement'
import { NotFound } from './components/common/NotFound'
import { AppSkeleton } from './components/ui/app-skeleton'
import { routes } from './generated-routes'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: routes,
      errorElement: <ErrorElement />,
      hydrateFallbackElement: <AppSkeleton />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
  { basename: routerBasePath(GALLERY_BASE_PATH) },
)
