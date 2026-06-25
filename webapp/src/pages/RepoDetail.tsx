import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Star,
  GitFork,
  CircleDot,
  Eye,
  Calendar,
  Sparkles,
  TrendingUp,
  Layers,
  ArrowRight,
  Inbox,
  SearchX,
} from 'lucide-react'
import { getRepoDetail } from '../lib/api'
import { getRepoByOwnerName, generateHistoryData, getRelatedRepos } from '../lib/mockData'
import type { Repository } from '../types/repo'
import { cn, formatNumber, getLanguageColor } from '../lib/utils'
import RepoCard from '../components/RepoCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import SectionHeader from '../components/SectionHeader'

interface HistoryPoint {
  date: string
  stars: number
  forks: number
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)
  const targetRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    targetRef.current = target
    startRef.current = null

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * targetRef.current))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

function SimpleAreaChart({ data, height }: { data: HistoryPoint[]; height: number }) {
  if (data.length === 0) return null

  const padding = { top: 10, right: 10, bottom: 30, left: 50 }
  const chartWidth = 800
  const chartHeight = height

  const allStars = data.map((d) => d.stars)
  const minStars = Math.min(...allStars)
  const maxStars = Math.max(...allStars)
  const starRange = maxStars - minStars || 1

  const allForks = data.map((d) => d.forks)
  const minForks = Math.min(...allForks)
  const maxForks = Math.max(...allForks)
  const forkRange = maxForks - minForks || 1

  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right)
  const yScaleStars = (v: number) => padding.top + (1 - (v - minStars) / starRange) * (chartHeight - padding.top - padding.bottom)
  const yScaleForks = (v: number) => padding.top + (1 - (v - minForks) / forkRange) * (chartHeight - padding.top - padding.bottom)

  const starPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleStars(d.stars)}`)
    .join(' ')

  const starAreaPath = `${starPath} L ${xScale(data.length - 1)} ${chartHeight - padding.bottom} L ${xScale(0)} ${chartHeight - padding.bottom} Z`

  const forkPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleForks(d.forks)}`)
    .join(' ')

  const yAxisTicks = 5
  const starTicks = Array.from({ length: yAxisTicks }, (_, i) => {
    const val = minStars + (starRange * i) / (yAxisTicks - 1)
    return { y: yScaleStars(val), label: formatNumber(Math.floor(val)) }
  })

  const xAxisTicks = [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
      {/* Grid lines */}
      {starTicks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={t.y}
          x2={chartWidth - padding.right}
          y2={t.y}
          stroke="#334155"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
      ))}

      {/* Star area */}
      <path d={starAreaPath} fill="rgba(59, 130, 246, 0.1)" />

      {/* Star line */}
      <path d={starPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

      {/* Fork line */}
      <path d={forkPath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5 5" />

      {/* Y-axis labels */}
      {starTicks.map((t, i) => (
        <text key={i} x={padding.left - 8} y={t.y + 4} textAnchor="end" fill="#64748b" fontSize="10">
          {t.label}
        </text>
      ))}

      {/* X-axis labels */}
      {xAxisTicks.map((i) => {
        const d = new Date(data[i].date)
        return (
          <text key={i} x={xScale(i)} y={chartHeight - 8} textAnchor="middle" fill="#64748b" fontSize="10">
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        )
      })}
    </svg>
  )
}

export default function RepoDetail() {
  const { owner, name } = useParams<{ owner: string; name: string }>()
  const navigate = useNavigate()

  const [repo, setRepo] = useState<Repository | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [related, setRelated] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  const displayStars = useCountUp(repo?.stars ?? 0)
  const displayForks = useCountUp(repo?.forks ?? 0)
  const displayIssues = useCountUp(repo?.open_issues ?? 0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setNotFound(false)

    try {
      const apiRepo = await getRepoDetail(owner || '', name || '')
      if (apiRepo) {
        setRepo(apiRepo)
        setHistory(generateHistoryData(apiRepo.stars, apiRepo.forks))
        setRelated(getRelatedRepos(apiRepo, 6))
      } else {
        const found = getRepoByOwnerName(owner || '', name || '')
        if (!found) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setRepo(found)
        setHistory(generateHistoryData(found.stars, found.forks))
        setRelated(getRelatedRepos(found, 6))
      }
    } catch (e) {
      console.error('API error:', e)
      const found = getRepoByOwnerName(owner || '', name || '')
      if (!found) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setRepo(found)
      setHistory(generateHistoryData(found.stars, found.forks))
      setRelated(getRelatedRepos(found, 6))
    } finally {
      setLoading(false)
    }
  }, [owner, name])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopyClone = () => {
    if (!repo) return
    const cloneUrl = `https://github.com/${repo.owner}/${repo.name}.git`
    navigator.clipboard.writeText(cloneUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <LoadingSkeleton variant="detail" />
      </div>
    )
  }

  if (notFound || !repo) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchX className="w-12 h-12 text-text-muted mb-4" />
          <h3 className="text-2xl font-semibold text-text-secondary mb-2">Project not found</h3>
          <p className="text-sm text-text-muted mb-6">
            We couldn't find this repository. It may have been deleted or renamed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const langColors = getLanguageColor(repo.language)
  const growthPercent = history.length > 1
    ? (((history[history.length - 1].stars - history[0].stars) / history[0].stars) * 100).toFixed(1)
    : '0'

  const containerVariants = {
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

  const tagVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  }

  const tagItemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  }

  return (
    <div className="min-h-[100dvh]">
      {/* Breadcrumb + Back */}
      <section className="border-b border-border-default bg-bg-base">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="sm:hidden inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-surface-raised transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-sm text-text-muted">
            <Link to="/" className="flex items-center gap-1 hover:text-accent-primary transition-colors">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/search" className="hover:text-accent-primary transition-colors">Projects</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary">{repo.owner}/{repo.name}</span>
          </nav>
        </div>
      </section>

      {/* Project Hero */}
      <section className="bg-bg-base bg-gradient-to-b from-accent-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Top meta row */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 mb-4">
              {repo.language && (
                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', langColors.bg, langColors.text)}>
                  {repo.language}
                </span>
              )}
              {repo.is_featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-featured/15 text-accent-featured text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Pick
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-success/15 text-accent-success text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                Trending
              </span>
              <span className="text-sm text-text-muted">
                Updated {new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </motion.div>

            {/* Title block */}
            <motion.div variants={itemVariants} className="mb-4">
              <p className="text-sm font-mono text-text-muted mb-1">{repo.owner} /</p>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary truncate">{repo.name}</h1>
            </motion.div>

            {/* Description */}
            <motion.p variants={itemVariants} className="text-lg text-text-secondary max-w-[700px] mb-6">
              {repo.description || 'No description available'}
            </motion.p>

            {/* Stats row */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-6"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-text-muted" />
                <div>
                  <div className="text-xl font-semibold text-text-primary">{displayStars.toLocaleString()}</div>
                  <div className="text-xs text-text-muted">stars</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-text-muted" />
                <div>
                  <div className="text-xl font-semibold text-text-primary">{displayForks.toLocaleString()}</div>
                  <div className="text-xs text-text-muted">forks</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-text-muted" />
                <div>
                  <div className="text-xl font-semibold text-text-primary">{displayIssues.toLocaleString()}</div>
                  <div className="text-xs text-text-muted">issues</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-text-muted" />
                <div>
                  <div className="text-xl font-semibold text-text-primary">{(repo.stars / 40).toFixed(0)}</div>
                  <div className="text-xs text-text-muted">watchers</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <div>
                  <div className="text-xl font-semibold text-text-primary">{new Date(repo.created_at).getFullYear()}</div>
                  <div className="text-xs text-text-muted">created</div>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary-hover transition-colors"
              >
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleCopyClone}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-accent-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy clone URL
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI Beginner Context */}
      {repo.is_featured && repo.feature_reason && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="max-w-6xl mx-auto px-4 md:px-8 mt-8"
        >
          <div className="p-4 md:p-6 rounded-xl bg-accent-featured/5 border border-accent-featured/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-accent-featured" />
              <p className="text-xs font-medium uppercase tracking-wider text-accent-featured">
                Why This Project for Beginners
              </p>
            </div>
            <p className="text-base text-text-primary leading-relaxed">{repo.feature_reason}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['No-code UI', 'Active community', 'Good documentation', 'Beginner-friendly'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-accent-featured/10 text-accent-featured border border-accent-featured/30 text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Star/Fork Trend Chart */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-8">
        <div className="bg-bg-surface rounded-xl border border-border-default p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Growth Trend</h2>
              <p className="text-sm text-text-muted mt-1">Star and fork activity over the last 30 days</p>
            </div>
            <span className="flex items-center gap-1 text-sm text-accent-success">
              <TrendingUp className="w-4 h-4" />
              +{growthPercent}% this month
            </span>
          </div>

          <div className="h-[200px] md:h-[300px]">
            {history.length > 0 ? (
              <SimpleAreaChart data={history} height={300} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Inbox className="w-10 h-10 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">No historical data available yet.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4">
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-3 h-3 rounded-full bg-accent-primary" />
              Stars
            </span>
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <span className="w-6 h-0 border-b-2 border-dashed border-accent-featured" />
              Forks
            </span>
          </div>
        </div>
      </section>

      {/* Topics & Tags */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-8">
        <h2 className="text-xl font-semibold text-text-primary mb-3">Topics</h2>
        {repo.topics.length > 0 ? (
          <motion.div
            variants={tagVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2"
          >
            {repo.topics.map((topic) => (
              <motion.div key={topic} variants={tagItemVariants}>
                <Link
                  to={`/search?q=${encodeURIComponent(topic)}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-bg-surface border border-border-default text-sm text-text-secondary hover:bg-bg-surface-raised hover:border-focus hover:text-text-primary transition-all duration-200 hover:scale-105"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  {topic}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-sm text-text-muted">No topics available.</p>
        )}
      </section>

      {/* Related Projects */}
      <section className="py-16 px-4 md:px-8 bg-bg-surface/30 mt-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            title="You Might Also Like"
            subtitle="Similar projects based on language and topics."
          />

          {related.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {related.map((r) => (
                <motion.div key={r.id} variants={itemVariants}>
                  <RepoCard repo={r} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="w-10 h-10 text-text-muted mb-2" />
              <p className="text-sm text-text-muted mb-4">No related projects found.</p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised transition-colors"
              >
                Explore all projects
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary transition-colors"
            >
              Explore more projects
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Copied toast */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent-success text-white rounded-lg px-4 py-2 shadow-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Copied!
        </motion.div>
      )}
    </div>
  )
}
