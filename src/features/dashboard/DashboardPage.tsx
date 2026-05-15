import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
// ADD these two imports instead:
import {
  useGetAllVisitsQuery,
  useGetVisitsByRepQuery,
} from '@/features/visits/visitApi'

import {
  useGetRevenueSummaryQuery,
  useGetOutstandingInvoicesQuery,
  useGetRepPerformanceQuery,
  useGetTargetAchievementQuery,
} from '@/features/analytics/analyticsApi'
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ClipboardList,
  ShoppingCart,
  Users,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO } from 'date-fns'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-IN').format(n)
}

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  accentColor?: string
  gradientClass?: string
  loading?: boolean
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'var(--vp-teal)',
  loading,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="kpi-card">
        <Skeleton className="h-4 w-24 mb-4 skeleton-shimmer" />
        <Skeleton className="h-8 w-32 mb-2 skeleton-shimmer" />
        <Skeleton className="h-3 w-20 skeleton-shimmer" />
      </div>
    )
  }

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--vp-text-muted)' }}
        >
          {title}
        </p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-2xl font-bold mb-1 tracking-tight"
        style={{ color: 'var(--vp-text-primary)' }}
      >
        {value}
      </p>
      {subtitle && (
        <div className="flex items-center gap-1.5">
          {trend === 'up' && <TrendingUp className="w-3 h-3" style={{ color: 'var(--vp-teal)' }} />}
          {trend === 'down' && (
            <TrendingDown className="w-3 h-3" style={{ color: 'var(--vp-rose)' }} />
          )}
          <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
            {subtitle}
          </p>
        </div>
      )}
    </div>
  )
}

function VisitStatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED')
    return (
      <span className="badge-teal flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </span>
    )
  if (status === 'PLANNED')
    return (
      <span className="badge-amber flex items-center gap-1">
        <Clock className="w-3 h-3" /> Planned
      </span>
    )
  return (
    <span className="badge-crimson flex items-center gap-1">
      <XCircle className="w-3 h-3" /> Missed
    </span>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isOwnerOrManager, isRep } = useAuth()

  const { data: allVisitsData, isLoading: visitsLoading } = useGetAllVisitsQuery(undefined, {
    skip: !isOwnerOrManager,
  })
  const { data: repVisitsData, isLoading: repVisitsLoading } = useGetVisitsByRepQuery(
    user?.id ?? '',
    { skip: !isRep || !user?.id }
  )
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueSummaryQuery(undefined, {
    skip: !isOwnerOrManager,
  })
  const { data: outstandingData, isLoading: outstandingLoading } = useGetOutstandingInvoicesQuery(
    undefined,
    { skip: !isOwnerOrManager }
  )
  const { data: repPerfData, isLoading: repPerfLoading } = useGetRepPerformanceQuery(undefined, {
    skip: !isOwnerOrManager,
  })
  useGetTargetAchievementQuery({}, { skip: !isOwnerOrManager })

  const visits = useMemo(() => {
    const list = isOwnerOrManager ? (allVisitsData?.data ?? []) : (repVisitsData?.data ?? [])
    return [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [allVisitsData, repVisitsData, isOwnerOrManager])

  const totalVisits = isOwnerOrManager
    ? (allVisitsData?.data?.length ?? 0)
    : (repVisitsData?.data?.length ?? 0)
  const completedVisits =
    (isOwnerOrManager ? allVisitsData?.data : repVisitsData?.data)?.filter(
      (v) => v.status === 'COMPLETED'
    ).length ?? 0
  const latestRevenue = revenueData?.data?.at(-1)
  const totalOutstanding =
    outstandingData?.data?.reduce((sum, inv) => sum + inv.outstandingAmount, 0) ?? 0
  const visitsLoaderActive = isOwnerOrManager ? visitsLoading : repVisitsLoading

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--vp-text-primary)' }}
          >
            Good {getGreeting()},{' '}
            <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--vp-text-muted)' }}>
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/visits/new')}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Visit
          </button>
          <button
            onClick={() => navigate('/orders/new')}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Visits"
          value={formatNumber(totalVisits)}
          subtitle={`${completedVisits} completed`}
          icon={<ClipboardList className="w-5 h-5" />}
          trend="up"
          loading={visitsLoaderActive}
        />
        <KpiCard
          title="Completed Visits"
          value={formatNumber(completedVisits)}
          subtitle={`${totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0}% rate`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="var(--vp-teal)"
          loading={visitsLoaderActive}
        />
        {isOwnerOrManager && (
          <>
            <KpiCard
              title="Monthly Revenue"
              value={latestRevenue ? formatCurrency(latestRevenue.totalRevenue) : '₹0'}
              subtitle={latestRevenue ? `${latestRevenue.invoiceCount} invoices` : 'No data'}
              icon={<TrendingUp className="w-5 h-5" />}
              trend="up"
              accentColor="var(--vp-purple)"
              loading={revenueLoading}
            />
            <KpiCard
              title="Outstanding"
              value={formatCurrency(totalOutstanding)}
              subtitle={`${outstandingData?.data?.length ?? 0} unpaid invoices`}
              icon={<AlertCircle className="w-5 h-5" />}
              trend="down"
              accentColor="var(--vp-amber)"
              loading={outstandingLoading}
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Visits */}
        <div className="lg:col-span-2 vp-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
              Recent Visits
            </h2>
            <button
              onClick={() => navigate('/visits')}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: 'var(--vp-teal)' }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {visitsLoaderActive ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--vp-teal-light)' }}
              >
                <ClipboardList className="w-6 h-6" style={{ color: 'var(--vp-teal)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--vp-text-secondary)' }}>
                No visits recorded yet
              </p>
              <button
                onClick={() => navigate('/visits/new')}
                className="mt-3 text-xs font-semibold"
                style={{ color: 'var(--vp-teal)' }}
              >
                Log your first visit →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => navigate(`/visits/${visit.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 group"
                  style={{
                    background: 'var(--vp-bg-surface-alt)',
                    border: '1px solid var(--vp-border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--vp-teal-light)'
                    e.currentTarget.style.borderColor = 'var(--vp-teal)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--vp-bg-surface-alt)'
                    e.currentTarget.style.borderColor = 'var(--vp-border)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--vp-teal-light)' }}
                    >
                      <Activity className="w-4 h-4" style={{ color: 'var(--vp-teal)' }} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--vp-text-primary)' }}
                      >
                        {visit.doctorName}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--vp-text-muted)' }}>
                        {visit.doctorSpecialty} • {format(parseISO(visit.visitDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <VisitStatusBadge status={visit.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="vp-card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--vp-text-primary)' }}>
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  label: 'View Doctors',
                  icon: <Users className="w-4 h-4" />,
                  path: '/doctors',
                  color: 'var(--vp-purple)',
                },
                {
                  label: 'Log a Visit',
                  icon: <ClipboardList className="w-4 h-4" />,
                  path: '/visits/new',
                  color: 'var(--vp-teal)',
                },
                {
                  label: 'Place Order',
                  icon: <ShoppingCart className="w-4 h-4" />,
                  path: '/orders/new',
                  color: 'var(--vp-blue)',
                },
              ].map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: 'var(--vp-bg-surface-alt)',
                    color: 'var(--vp-text-secondary)',
                    border: '1px solid var(--vp-border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--vp-bg-hover)'
                    e.currentTarget.style.borderColor = action.color
                    e.currentTarget.style.color = 'var(--vp-text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--vp-bg-surface-alt)'
                    e.currentTarget.style.borderColor = 'var(--vp-border)'
                    e.currentTarget.style.color = 'var(--vp-text-secondary)'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${action.color}15`, color: action.color }}
                  >
                    {action.icon}
                  </div>
                  {action.label}
                  <ArrowRight
                    className="w-3 h-3 ml-auto"
                    style={{ color: 'var(--vp-text-muted)' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Rep Performance */}
          {isOwnerOrManager && (
            <div className="vp-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  Rep Performance
                </h2>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-xs font-semibold"
                  style={{ color: 'var(--vp-teal)' }}
                >
                  Full report →
                </button>
              </div>

              {repPerfLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 skeleton-shimmer" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(repPerfData?.data ?? []).slice(0, 4).map((rep) => {
                    const pct = Number(rep.achievementPct ?? 0)
                    const barColor =
                      pct >= 100
                        ? 'var(--vp-teal)'
                        : pct >= 70
                          ? 'var(--vp-amber)'
                          : 'var(--vp-rose)'
                    return (
                      <div key={rep.repId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: 'var(--vp-text-secondary)' }}
                          >
                            {rep.repName}
                          </p>
                          <p
                            className="text-xs shrink-0 ml-2 font-medium"
                            style={{ color: barColor }}
                          >
                            {rep.completedVisits}/{rep.targetVisits ?? '—'}
                          </p>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'var(--vp-bg-hover)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: barColor,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
