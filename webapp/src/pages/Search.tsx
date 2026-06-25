import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  Filter,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  RefreshCw,
} from 'lucide-react'
import SearchBar from '../components/SearchBar'
import LanguageFilterBar from '../components/LanguageFilterBar'
import RepoCard from '../components/RepoCard'
import TrendingListItem from '../components/TrendingListItem'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import { searchReposApi } from '../lib/api'
import { searchRepos, LANGUAGES, SORT_OPTIONS, SORT_LABELS } from '../lib/mockData'
import type { Repository } from '../types/repo'
import { cn } from '../lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') || ''
  const language = searchParams.get('language') || 'All'
  const sort = searchParams.get('sort') || 'stars'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [results, setResults] = useState<Repository[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiResult = await searchReposApi({
        q: query,
        language: language === 'All' ? undefined : language,
        sort: sort as 'stars' | 'trending' | 'updated',
        page,
        per_page: 12,
      })
      if (apiResult) {
        setResults(apiResult.data)
        setTotal(apiResult.total)
      } else {
        const { results: data, total: t } = searchRepos(
          query,
          language === 'All' ? null : language,
          sort,
          page,
          12
        )
        setResults(data)
        setTotal(t)
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load results. Using cached data.')
      const { results: data, total: t } = searchRepos(
        query,
        language === 'All' ? null : language,
        sort,
        page,
        12
      )
      setResults(data)
      setTotal(t)
    } finally {
      setLoading(false)
    }
  }, [query, language, sort, page])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === null || value === 'All') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleSearch = (newQuery: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (newQuery) {
      newParams.set('q', newQuery)
    } else {
      newParams.delete('q')
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const activeFilters = []
  if (language && language !== 'All') {
    activeFilters.push({ key: 'language', label: language, value: language })
  }
  if (sort && sort !== 'stars') {
    activeFilters.push({ key: 'sort', label: SORT_LABELS[sort] || sort, value: sort })
  }

  const hasMore = results.length < total

  const handleLoadMore = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', String(page + 1))
    setSearchParams(newParams)
  }

  return (
    <div className="min-h-[100dvh]">
      {/* Search Header */}
      <section className="border-b border-border-default bg-bg-base">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-8">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <h1 className="text-3xl font-bold text-text-primary mt-2">
            {query ? `Results for "${query}"` : 'Search Projects'}
          </h1>

          <div className="mt-6">
            <SearchBar
              defaultValue={query}
              onSearch={handleSearch}
              placeholder="Search projects, topics, or languages..."
              autoFocus={!query}
            />
          </div>

          <AnimatePresence>
            {activeFilters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2 mt-4"
              >
                {activeFilters.map((filter) => (
                  <span
                    key={filter.key}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary text-sm font-medium"
                  >
                    {filter.label}
                    <button
                      onClick={() => updateParam(filter.key, null)}
                      className="hover:text-text-primary transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Filter & Sort Bar */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
        <div className="bg-bg-surface rounded-xl border border-border-default p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 overflow-x-auto">
              <LanguageFilterBar
                selected={language}
                onChange={(lang) => updateParam('language', lang === 'All' ? null : lang)}
                languages={LANGUAGES}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="sm:hidden inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {/* Sort dropdown */}
              <div className="relative group">
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised transition-colors">
                  Sort: {SORT_LABELS[sort] || 'Most stars'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-surface border border-border-default rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => updateParam('sort', option === 'stars' ? null : option)}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg',
                        sort === option
                          ? 'text-accent-primary bg-accent-primary/10'
                          : 'text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary'
                      )}
                    >
                      {SORT_LABELS[option]}
                    </button>
                  ))}
                </div>
              </div>

              {/* View toggle (desktop only) */}
              <div className="hidden sm:flex items-center gap-1 border border-border-default rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-raised'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'list'
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-raised'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sm:hidden overflow-hidden mt-4 pt-4 border-t border-border-default"
              >
                <p className="text-sm font-medium text-text-primary mb-2">Sort by</p>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        updateParam('sort', option === 'stars' ? null : option)
                        setShowMobileFilters(false)
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        sort === option
                          ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary'
                          : 'bg-bg-surface border border-border-default text-text-secondary'
                      )}
                    >
                      {SORT_LABELS[option]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results Area */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchResults}
              className="inline-flex items-center gap-1 text-sm font-medium hover:text-red-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        <div className="mb-4 text-sm text-text-muted">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading projects...
            </span>
          ) : (
            `Showing ${results.length} of ${total} projects`
          )}
        </div>

        {loading ? (
          viewMode === 'grid' ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : (
            <LoadingSkeleton variant="list" count={5} />
          )
        ) : results.length === 0 ? (
          <EmptyState
            variant="search"
            title="No projects found"
            description="Try a different search term, language, or clear your filters."
            actionLabel="Clear all filters"
            onAction={clearFilters}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + query + language + sort + page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'grid' ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {results.map((repo) => (
                    <motion.div key={repo.id} variants={itemVariants}>
                      <RepoCard repo={repo} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  variants={listContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  {results.map((repo) => (
                    <motion.div key={repo.id} variants={itemVariants}>
                      <TrendingListItem repo={repo} showRank={false} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {hasMore && !loading && results.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full mt-8 h-12 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary transition-colors flex items-center justify-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Load more projects
          </button>
        )}
      </section>
    </div>
  )
}
