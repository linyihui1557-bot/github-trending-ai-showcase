import type { Repository } from '../types/repo'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface ApiResponse<T> {
  data: T
  meta?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface RepoListParams {
  language?: string
  sort?: 'stars' | 'trending' | 'updated'
  order?: 'desc' | 'asc'
  page?: number
  per_page?: number
}

export interface SearchParams extends RepoListParams {
  q?: string
}

export async function getFeaturedRepos(): Promise<Repository[] | null> {
  if (!API_BASE) return null
  const res = await fetch(`${API_BASE}/api/repos/featured`)
  if (!res.ok) throw new Error('Failed to fetch featured repos')
  const data: ApiResponse<Repository[]> = await res.json()
  return data.data
}

export async function getTrendingRepos(): Promise<Repository[] | null> {
  if (!API_BASE) return null
  const res = await fetch(`${API_BASE}/api/repos/trending`)
  if (!res.ok) throw new Error('Failed to fetch trending repos')
  const data: ApiResponse<Repository[]> = await res.json()
  return data.data
}

export async function getRepos(params: RepoListParams): Promise<{ data: Repository[]; total: number } | null> {
  if (!API_BASE) return null
  const query = new URLSearchParams()
  if (params.language) query.set('language', params.language)
  if (params.sort) query.set('sort', params.sort)
  if (params.order) query.set('order', params.order)
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))

  const res = await fetch(`${API_BASE}/api/repos?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch repos')
  const data: ApiResponse<Repository[]> = await res.json()
  return { data: data.data, total: data.meta?.total || 0 }
}

export async function searchReposApi(params: SearchParams): Promise<{ data: Repository[]; total: number } | null> {
  if (!API_BASE) return null
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.language) query.set('language', params.language)
  if (params.sort) query.set('sort', params.sort)
  if (params.order) query.set('order', params.order)
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))

  const res = await fetch(`${API_BASE}/api/search?${query.toString()}`)
  if (!res.ok) throw new Error('Failed to search repos')
  const data: ApiResponse<Repository[]> = await res.json()
  return { data: data.data, total: data.meta?.total || 0 }
}

export async function getRepoDetail(owner: string, name: string): Promise<Repository | null> {
  if (!API_BASE) return null
  const res = await fetch(`${API_BASE}/api/repos/${owner}/${name}`)
  if (!res.ok) throw new Error('Failed to fetch repo detail')
  const data: ApiResponse<Repository> = await res.json()
  return data.data
}
