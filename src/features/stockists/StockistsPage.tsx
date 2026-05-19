import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  X,
  Loader2,
  Building2,
  MapPin,
  Phone,
  ChevronRight,
  Eye,
  EyeOff,
  Hash,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/shared/hooks/useAuth'
import { useGetAllStockistsQuery, useCreateStockistMutation } from './stockistsApi'
import { useGetUsersByRoleQuery } from '@/features/users/usersApi'

// ── Zod schema ────────────────────────────────────────────────
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

const createStockistSchema = z.object({
  assignedRepId: z.string().min(1, 'Please assign a sales rep'),
  firmName: z.string().min(1, 'Firm name is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  gstin: z.string().regex(GSTIN_REGEX, 'Invalid GSTIN format').optional().or(z.literal('')),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
})

type CreateStockistForm = z.infer<typeof createStockistSchema>

export default function StockistsPage() {
  const navigate = useNavigate()
  const { isOwnerOrManager } = useAuth()

  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const { data, isLoading } = useGetAllStockistsQuery()
  const { data: repsData } = useGetUsersByRoleQuery('REP')
  const [createStockist, { isLoading: creating }] = useCreateStockistMutation()

  const reps = repsData?.data ?? []

  const stockists = useMemo(() => data?.data ?? [], [data])

  const filtered = useMemo(() => {
    return stockists
      .filter((s) => {
        const matchesSearch =
          s.firmName.toLowerCase().includes(search.toLowerCase()) ||
          s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
          s.city.toLowerCase().includes(search.toLowerCase()) ||
          s.state.toLowerCase().includes(search.toLowerCase()) ||
          (s.gstin?.toLowerCase().includes(search.toLowerCase()) ?? false)
        const matchesActive = showInactive ? true : s.isActive
        return matchesSearch && matchesActive
      })
      .sort((a, b) => a.firmName.localeCompare(b.firmName))
  }, [stockists, search, showInactive])

  const total = stockists.length
  const active = stockists.filter((s) => s.isActive).length
  const inactive = stockists.filter((s) => !s.isActive).length

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStockistForm>({
    resolver: zodResolver(createStockistSchema),
  })

  const onSubmit = async (data: CreateStockistForm) => {
    try {
      await createStockist({
        assignedRepId: data.assignedRepId,
        firmName: data.firmName,
        ownerName: data.ownerName,
        gstin: data.gstin || undefined,
        state: data.state,
        city: data.city,
        address: data.address || undefined,
        phone: data.phone,
      }).unwrap()
      toast.success('Stockist created successfully')
      reset()
      setShowCreate(false)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to create stockist')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--vp-text-primary)' }}
          >
            Stockists
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
            {active} active distributors
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwnerOrManager && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="btn-secondary flex items-center gap-2 text-sm"
              style={{
                background: showInactive ? 'var(--vp-amber-light)' : undefined,
                color: showInactive ? 'var(--vp-amber)' : undefined,
                border: showInactive ? '1px solid rgba(245,158,11,0.3)' : undefined,
              }}
            >
              {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Stockist
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total',
            value: total,
            color: 'var(--vp-teal)',
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            label: 'Active',
            value: active,
            color: 'var(--vp-teal)',
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            label: 'Inactive',
            value: inactive,
            color: 'var(--vp-rose)',
            icon: <Building2 className="w-5 h-5" />,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="vp-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--vp-text-muted)' }}
              >
                {kpi.label}
              </p>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${kpi.color}15`, color: kpi.color }}
              >
                {kpi.icon}
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16 skeleton-shimmer" />
            ) : (
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--vp-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {kpi.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--vp-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search by firm name, owner, city, state, or GSTIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-dark"
          style={{ paddingLeft: '2.5rem' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--vp-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm" style={{ color: 'var(--vp-text-muted)' }}>
          Showing <strong style={{ color: 'var(--vp-text-primary)' }}>{filtered.length}</strong>{' '}
          result{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Stockists List ── */}
      <div className="vp-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 skeleton-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--vp-teal-light)' }}
            >
              <Building2 className="w-8 h-8" style={{ color: 'var(--vp-teal)' }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--vp-text-primary)' }}>
              {search ? 'No stockists match your search' : 'No stockists yet'}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--vp-text-muted)' }}>
              {search ? 'Try adjusting your search' : 'Add your first stockist to get started'}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                Add Stockist
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--vp-border)' }}>
            {filtered.map((stockist) => (
              <div
                key={stockist.id}
                onClick={() => navigate(`/stockists/${stockist.id}`)}
                className="flex items-center gap-4 p-4 cursor-pointer transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vp-bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'var(--vp-teal-light)', color: 'var(--vp-teal)' }}
                >
                  {stockist.firmName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--vp-text-primary)' }}
                    >
                      {stockist.firmName}
                    </p>
                    {!stockist.isActive && <span className="badge-crimson text-xs">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--vp-text-muted)' }}
                    >
                      <MapPin className="w-3 h-3" />
                      {stockist.city}, {stockist.state}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--vp-text-muted)' }}
                    >
                      <Phone className="w-3 h-3" />
                      {stockist.phone}
                    </span>
                    {stockist.gstin && (
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: 'var(--vp-text-muted)' }}
                      >
                        <Hash className="w-3 h-3" />
                        {stockist.gstin}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                      Rep: {stockist.assignedRepName}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--vp-text-muted)' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      <Dialog
        open={showCreate}
        onOpenChange={() => {
          reset()
          setShowCreate(false)
        }}
      >
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Add New Stockist</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Assigned Rep */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                Assigned Sales Rep *
              </label>
              <select
                {...register('assignedRepId')}
                className="input-dark"
                style={{ background: 'var(--vp-bg-surface)' }}
              >
                <option value="">Select a sales rep</option>
                {reps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.fullName}
                  </option>
                ))}
              </select>
              {errors.assignedRepId && (
                <p className="text-xs mt-1 text-rose-500">{errors.assignedRepId.message}</p>
              )}
            </div>

            {/* Firm Name + Owner */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  Firm Name *
                </label>
                <input
                  {...register('firmName')}
                  className="input-dark"
                  placeholder="ABC Distributors"
                />
                {errors.firmName && (
                  <p className="text-xs mt-1 text-rose-500">{errors.firmName.message}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  Owner Name *
                </label>
                <input
                  {...register('ownerName')}
                  className="input-dark"
                  placeholder="Ramesh Patel"
                />
                {errors.ownerName && (
                  <p className="text-xs mt-1 text-rose-500">{errors.ownerName.message}</p>
                )}
              </div>
            </div>

            {/* GSTIN */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                GSTIN
              </label>
              <input {...register('gstin')} className="input-dark" placeholder="27AABCS1429B1ZB" />
              {errors.gstin && <p className="text-xs mt-1 text-rose-500">{errors.gstin.message}</p>}
            </div>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  City *
                </label>
                <input {...register('city')} className="input-dark" placeholder="Mumbai" />
                {errors.city && <p className="text-xs mt-1 text-rose-500">{errors.city.message}</p>}
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  State *
                </label>
                <input {...register('state')} className="input-dark" placeholder="Maharashtra" />
                {errors.state && (
                  <p className="text-xs mt-1 text-rose-500">{errors.state.message}</p>
                )}
              </div>
            </div>

            {/* Phone + Address */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  Phone *
                </label>
                <input {...register('phone')} className="input-dark" placeholder="9876543210" />
                {errors.phone && (
                  <p className="text-xs mt-1 text-rose-500">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  Address
                </label>
                <input
                  {...register('address')}
                  className="input-dark"
                  placeholder="123 Market St"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  reset()
                  setShowCreate(false)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? 'Creating...' : 'Create Stockist'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
