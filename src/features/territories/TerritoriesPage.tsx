// src/features/territories/TerritoriesPage.tsx
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  UserX,
  UserCheck,
  Loader2,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/shared/hooks/useAuth'
import {
  useGetAllTerritoriesQuery,
  useCreateTerritoryMutation,
  useUpdateTerritoryMutation,
  useDeactivateTerritoryMutation,
} from './territoriesApi'
import type { TerritoryDto } from '@/types/territory'

// ── Create schema ──────────────────────────────────────────────────────────────
const createTerritorySchema = z.object({
  name: z.string().min(1, 'Territory name is required'),
  state: z.string().min(1, 'State is required'),
  zone: z.string().optional(),
})

type CreateTerritoryForm = z.infer<typeof createTerritorySchema>

// ── Edit schema — same fields ──────────────────────────────────────────────────
const editTerritorySchema = z.object({
  name: z.string().min(1, 'Territory name is required'),
  state: z.string().min(1, 'State is required'),
  zone: z.string().optional(),
})

type EditTerritoryForm = z.infer<typeof editTerritorySchema>

export default function TerritoriesPage() {
  const { isOwner } = useAuth()

  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Edit, deactivate, reactivate target — holds the territory being acted on
  const [editTarget, setEditTarget] = useState<TerritoryDto | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<TerritoryDto | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<TerritoryDto | null>(null)

  // ── Data ───────────────────────────────────────────────────────────────────
  // getAllTerritories returns ALL including inactive — no dual query needed
  const { data, isLoading } = useGetAllTerritoriesQuery()
  const territories = useMemo(() => data?.data ?? [], [data])

  // ── Derived counts ─────────────────────────────────────────────────────────
  const active = territories.filter((t) => t.isActive).length
  const inactive = territories.filter((t) => !t.isActive).length

  // ── Filtered list — search + inactive toggle applied on frontend ───────────
  const filtered = useMemo(() => {
    return territories
      .filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.state.toLowerCase().includes(search.toLowerCase()) ||
          (t.zone?.toLowerCase().includes(search.toLowerCase()) ?? false)
        const matchesActive = showInactive ? true : t.isActive
        return matchesSearch && matchesActive
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [territories, search, showInactive])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [createTerritory, { isLoading: creating }] = useCreateTerritoryMutation()
  const [updateTerritory, { isLoading: updating }] = useUpdateTerritoryMutation()
  const [deactivateTerritory, { isLoading: deactivating }] = useDeactivateTerritoryMutation()

  // ── Create form ────────────────────────────────────────────────────────────
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateTerritoryForm>({
    resolver: zodResolver(createTerritorySchema),
  })

  const onCreateSubmit = async (formData: CreateTerritoryForm) => {
    try {
      await createTerritory({
        name: formData.name,
        state: formData.state,
        zone: formData.zone || undefined,
      }).unwrap()
      toast.success('Territory created successfully')
      resetCreate()
      setShowCreate(false)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to create territory')
    }
  }

  // ── Edit form ──────────────────────────────────────────────────────────────
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditTerritoryForm>({
    resolver: zodResolver(editTerritorySchema),
  })

  // Pre-populate edit form when a territory is selected
  const openEdit = (territory: TerritoryDto) => {
    setEditTarget(territory)
    resetEdit({
      name: territory.name,
      state: territory.state,
      zone: territory.zone ?? '',
    })
  }

  const onEditSubmit = async (formData: EditTerritoryForm) => {
    if (!editTarget) return
    try {
      await updateTerritory({
        id: editTarget.id,
        body: {
          name: formData.name,
          state: formData.state,
          zone: formData.zone || undefined,
          // isActive not passed — we're just editing, not changing status
        },
      }).unwrap()
      toast.success('Territory updated successfully')
      setEditTarget(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to update territory')
    }
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────
  const onDeactivate = async () => {
    if (!deactivateTarget) return
    try {
      await deactivateTerritory(deactivateTarget.id).unwrap()
      toast.success('Territory deactivated')
      setDeactivateTarget(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to deactivate territory')
    }
  }

  // ── Reactivate — uses updateTerritory with isActive: true ─────────────────
  // Backend requires all fields + isActive: true to reactivate
  const onReactivate = async () => {
    if (!reactivateTarget) return
    try {
      await updateTerritory({
        id: reactivateTarget.id,
        body: {
          name: reactivateTarget.name,
          state: reactivateTarget.state,
          zone: reactivateTarget.zone ?? undefined,
          isActive: true,
        },
      }).unwrap()
      toast.success('Territory reactivated')
      setReactivateTarget(null)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to reactivate territory')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--vp-text-primary)' }}
          >
            Territories
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
            {active} active{inactive > 0 ? `, ${inactive} inactive` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Show inactive toggle — OWNER only since only owner manages territories */}
          {isOwner && (
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
          {isOwner && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Territory
            </button>
          )}
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--vp-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search by name, state or zone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-dark w-full"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* ── Territory List ───────────────────────────────────────────────────── */}
      <div className="vp-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 skeleton-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--vp-teal-light)' }}
            >
              <MapPin className="w-8 h-8" style={{ color: 'var(--vp-teal)' }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--vp-text-primary)' }}>
              {search ? 'No territories match your search' : 'No territories yet'}
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--vp-text-muted)' }}>
              {search ? 'Try adjusting your search' : 'Add your first territory to get started'}
            </p>
            {!search && isOwner && (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                Add Territory
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--vp-border)' }}>
            {filtered.map((territory) => (
              <div
                key={territory.id}
                className="flex items-center gap-4 p-4"
                style={{ background: 'transparent' }}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    background: territory.isActive
                      ? 'var(--vp-teal-light)'
                      : 'var(--vp-bg-surface-alt)',
                    color: territory.isActive ? 'var(--vp-teal)' : 'var(--vp-text-muted)',
                  }}
                >
                  {territory.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--vp-text-primary)' }}
                    >
                      {territory.name}
                    </p>
                    {!territory.isActive && <span className="badge-crimson text-xs">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--vp-text-muted)' }}
                    >
                      <MapPin className="w-3 h-3" />
                      {territory.state}
                    </span>
                    {territory.zone && (
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: 'var(--vp-text-muted)' }}
                      >
                        <Globe className="w-3 h-3" />
                        {territory.zone}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                      Added {format(parseISO(territory.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {/* OWNER-only action buttons — inline on each row */}
                {isOwner && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit button — only for active territories */}
                    {territory.isActive && (
                      <button
                        onClick={() => openEdit(territory)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--vp-text-muted)' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--vp-bg-hover)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        title="Edit territory"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Deactivate or Reactivate */}
                    {territory.isActive ? (
                      <button
                        onClick={() => setDeactivateTarget(territory)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--vp-rose)' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--vp-rose-light)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        title="Deactivate territory"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setReactivateTarget(territory)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--vp-teal)' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--vp-teal-light)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        title="Reactivate territory"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Territory Modal ───────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Add Territory</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4 mt-2">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                Territory Name *
              </label>
              <input
                {...registerCreate('name')}
                type="text"
                placeholder="e.g. Pune West"
                className="input-dark w-full"
              />
              {createErrors.name && (
                <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>
                  {createErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                State *
              </label>
              <input
                {...registerCreate('state')}
                type="text"
                placeholder="e.g. Maharashtra"
                className="input-dark w-full"
              />
              {createErrors.state && (
                <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>
                  {createErrors.state.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                Zone <span style={{ color: 'var(--vp-text-muted)' }}>(optional)</span>
              </label>
              <input
                {...registerCreate('zone')}
                type="text"
                placeholder="e.g. North Zone"
                className="input-dark w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetCreate()
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
                {creating ? 'Creating...' : 'Create Territory'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Territory Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Edit Territory</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 mt-2">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                Territory Name *
              </label>
              <input {...registerEdit('name')} type="text" className="input-dark w-full" />
              {editErrors.name && (
                <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>
                  {editErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                State *
              </label>
              <input {...registerEdit('state')} type="text" className="input-dark w-full" />
              {editErrors.state && (
                <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>
                  {editErrors.state.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                Zone <span style={{ color: 'var(--vp-text-muted)' }}>(optional)</span>
              </label>
              <input {...registerEdit('zone')} type="text" className="input-dark w-full" />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Confirmation ──────────────────────────────────────────── */}
      <Dialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>
              Deactivate Territory
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--vp-text-secondary)' }}>
            Are you sure you want to deactivate{' '}
            <span className="font-semibold">{deactivateTarget?.name}</span>? Doctors assigned to
            this territory will retain their assignment but the territory will no longer appear in
            active lists.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setDeactivateTarget(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={onDeactivate}
              disabled={deactivating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--vp-rose)', color: '#FFFFFF' }}
            >
              {deactivating && <Loader2 className="w-4 h-4 animate-spin" />}
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reactivate Confirmation ──────────────────────────────────────────── */}
      <Dialog open={!!reactivateTarget} onOpenChange={() => setReactivateTarget(null)}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>
              Reactivate Territory
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--vp-text-secondary)' }}>
            Reactivate <span className="font-semibold">{reactivateTarget?.name}</span>? It will
            appear in active territory lists and be assignable to doctors again.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setReactivateTarget(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={onReactivate}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--vp-teal)', color: '#FFFFFF' }}
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              {updating ? 'Reactivating...' : 'Reactivate'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
