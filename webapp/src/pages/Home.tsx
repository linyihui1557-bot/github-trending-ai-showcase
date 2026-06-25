import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Star, Clock, ChevronDown } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import SectionHeader from '../components/SectionHeader'
import FeaturedCard from '../components/FeaturedCard'
import TrendingListItem from '../components/TrendingListItem'
import LanguageFilterBar from '../components/LanguageFilterBar'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import { getFeaturedRepos, getTrendingRepos } from '../lib/api'
import { featuredRepos, trendingRepos, dailyStats, languageStats, LANGUAGES } from '../lib/mockData'
import type { Repository } from '../types/repo'
import { cn, getLanguageColor } from '../lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const listItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

export default function Home() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState<Repository[]>([])
  const [trending, setTrending] = useState<Repository[]>([])
  const [stats, setStats] = useState<typeof dailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendingFilter, setTrendingFilter] = useState('All')
  const [trendingPage, setTrendingPage] = useState(1)
  const [trendingLoading, setTrendingLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const [featuredData, trendingData] = await Promise.all([
          getFeaturedRepos(),
          getTrendingRepos()
        ])
        setFeatured(featuredData || featuredRepos)
        setTrending(trendingData || trendingRepos)
        setStats(dailyStats)
      } catch (e) {
        console.error('API error:', e)
        setFeatured(featuredRepos)
        setTrending(trendingRepos)
        setStats(dailyStats)
      } finally {
        setLoading(false)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredTrending =
    trendingFilter === 'All' ? trending : trending.filter((r) => r.language === trendingFilter)

  const visibleTrending = filteredTrending.slice(0, trendingPage * 10)
  const hasMoreTrending = visibleTrending.length < filteredTrending.length

  const handleLoadMore = () => {
    setTrendingLoading(true)
    setTimeout(() => {
      setTrendingPage((p) => p + 1)
      setTrendingLoading(false)
    }, 500)
  }

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleLanguageClick = (lang: string) => {
    navigate(`/search?language=${encodeURIComponent(lang)}`)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center bg-bg-base overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 md:px-8 text-center py-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="text-xs font-medium uppercase tracking-wider text-accent-featured mb-4"
          >
            AI-Curated for Beginners
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.08 }}
            className="text-4xl md:text-5xl font-bold text-text-primary max-w-[700px] mx-auto leading-tight"
          >
            Discover the Best AI Open Source Projects
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.16 }}
            className="text-lg text-text-secondary max-w-[600px] mx-auto mt-4"
          >
            We track GitHub trending repositories and hand-pick the ones most valuable for beginners — with clear explanations and context.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.24 }}
            className="mt-8 flex justify-center"
          >
            <SearchBar onSearch={handleSearch} placeholder="Search projects, topics, or languages..." />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.32 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6"
          >
            <span className="inline-flex items-center gap-2 bg-bg-surface rounded-full px-4 py-2 border border-border-default text-sm text-text-muted">
              <TrendingUp className="w-3.5 h-3.5" />
              {stats?.total_repos.toLocaleString() ?? '1,247'} projects tracked
            </span>
            <span className="inline-flex items-center gap-2 bg-bg-surface rounded-full px-4 py-2 border border-border-default text-sm text-text-muted">
              <Star className="w-3.5 h-3.5" />
              AI-curated daily
            </span>
            <span className="inline-flex items-center gap-2 bg-bg-surface rounded-full px-4 py-2 border border-border-default text-sm text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              Updated today
            </span>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
          <ChevronDown className="w-6 h-6 text-text-muted animate-bounce" />
        </div>
      </section>

      {/* Featured Projects */}
      <section id="featured-section" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : featured.length === 0 ? (
            <EmptyState
              variant="list"
              title="No featured projects yet"
              description="Check back soon!"
            />
          ) : (
            <>
              <SectionHeader
                title="AI Picked for Beginners"
                subtitle="These projects are selected based on star growth, documentation quality, and beginner-friendliness."
                actionLabel="See all featured"
                actionHref="/search?featured=true"
                accentColor="featured"
              />
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {featured.map((repo) => (
                  <motion.div key={repo.id} variants={itemVariants}>
                    <FeaturedCard repo={repo} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Trending Rankings */}
      <section id="trending-section" className="py-20 px-4 md:px-8 bg-bg-base">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <LoadingSkeleton variant="list" count={5} />
          ) : (
            <>
              <SectionHeader
                title="Today's Trending"
                subtitle="Ranked by star velocity and community activity in the last 24 hours."
                actionLabel="View all"
                actionHref="/search?trending=true"
              />

              <div className="mb-6">
                <LanguageFilterBar
                  selected={trendingFilter}
                  onChange={setTrendingFilter}
                  languages={LANGUAGES}
                />
              </div>

              {filteredTrending.length === 0 ? (
                <EmptyState
                  variant="list"
                  title="No trending projects today"
                  description="Try a different language filter or check back later!"
                  actionLabel="Clear filters"
                  onAction={() => setTrendingFilter('All')}
                />
              ) : (
                <>
                  <motion.div
                    variants={listContainerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    className="flex flex-col gap-3"
                  >
                    {visibleTrending.map((repo) => (
                      <motion.div key={repo.id} variants={listItemVariants}>
                        <TrendingListItem repo={repo} />
                      </motion.div>
                    ))}
                  </motion.div>

                  {hasMoreTrending && (
                    <button
                      onClick={handleLoadMore}
                      disabled={trendingLoading}
                      className={cn(
                        'w-full mt-6 h-12 rounded-lg border border-border-default text-sm font-medium text-text-secondary',
                        'hover:bg-bg-surface-raised hover:text-text-primary transition-colors',
                        'flex items-center justify-center gap-2',
                        trendingLoading && 'opacity-70 cursor-not-allowed'
                      )}
                    >
                      {trendingLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Load more projects
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Browse by Language */}
      <section className="py-16 px-4 md:px-8 bg-bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="Browse by Language"
            subtitle="Find projects in the technology you want to explore."
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {languageStats.map((lang) => {
              const colors = getLanguageColor(lang.language)
              return (
                <motion.button
                  key={lang.language}
                  variants={itemVariants}
                  onClick={() => handleLanguageClick(lang.language)}
                  className={cn(
                    'inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-default bg-bg-surface',
                    'text-sm font-medium text-text-secondary hover:scale-105 hover:border-accent-primary/50 transition-all duration-200'
                  )}
                >
                  <span className={cn('w-2.5 h-2.5 rounded-full', colors.bg.replace('/15', ''))} />
                  <span className={colors.text}>{lang.language}</span>
                  <span className="text-text-muted text-xs">({lang.count})</span>
                </motion.button>
              )
            })}
          </motion.div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/search')}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary transition-colors"
            >
              Explore all languages
              <span className="w-4 h-4">&rarr;</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
