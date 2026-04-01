import { GET, POST, DELETE } from './index.route'

export const metadata = {
  GET: { requireAuth: true },
  POST: { requireAuth: true },
  DELETE: { requireAuth: true },
}

export { GET, POST, DELETE }