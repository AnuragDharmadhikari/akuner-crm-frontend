import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Loader2,
  Stethoscope,
  Calendar,
  User,
  Pill,
  Package,
  MessageSquare,
  Brain,
  ChevronRight,
  Globe,
  Languages,
  Plus,
  Trash2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGetVisitByIdQuery, useUpdateVisitMutation } from './visitApi'
import type { VisitProductDto } from '@/types/visit'
import {
  useGetAllProductsQuery,
} from '@/features/products/productsApi'
import { useGetBatchesByProductQuery } from '@/features/inventory/inventoryApi'
import { useGetVisitBriefingQuery } from '@/features/ai/aiApi'

// ── Status config ─────────────────────────────────────────────
const statusConfig = {
  COMPLETED: {
    label: 'Completed',
    color: 'var(--vp-teal)',
    bg: 'var(--vp-teal-light)',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  PLANNED: {
    label: 'Planned',
    color: 'var(--vp-amber)',
    bg: 'var(--vp-amber-light)',
    icon: <Clock className="w-4 h-4" />,
  },
  MISSED: {
    label: 'Missed',
    color: 'var(--vp-rose)',
    bg: 'var(--vp-rose-light)',
    icon: <XCircle className="w-4 h-4" />,
  },
}

// ── VisitStatusBadge ──────────────────────────────────────────
function VisitStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig]
  if (!config) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

// ── Zod schema — now includes products ───────────────────────
const editVisitSchema = z.object({
  status: z.enum(['PLANNED', 'COMPLETED', 'MISSED']),
  notes: z.string().optional(),
  products: z.array(
    z.object({
      productId: z.string().min(1, 'Select a product'),
      batchId: z.string().optional(),
      samplesGiven: z.number().min(0).optional(),
      feedback: z.string().optional(),
    })
  ),
})

type EditVisitForm = z.infer<typeof editVisitSchema>

// ── EditVisitModal ────────────────────────────────────────────
interface EditVisitModalProps {
  open: boolean
  onClose: () => void
  visitId: string
  defaultValues: EditVisitForm
}

// ── ProductSelector inside modal ──────────────────────────────
interface ModalProductSelectorProps {
  index: number
  register: ReturnType<typeof useForm<EditVisitForm>>['register']
  setValue: ReturnType<typeof useForm<EditVisitForm>>['setValue']
}

function ModalProductSelector({ index, register, setValue }: ModalProductSelectorProps) {
  const { data: productsData, isLoading } = useGetAllProductsQuery()
  const products = productsData?.data ?? []

  return (
    <select
      {...register(`products.${index}.productId`)}
      className="input-dark text-sm"
      style={{ background: 'var(--vp-bg-surface)' }}
      disabled={isLoading}
      onChange={(e) => {
        setValue(`products.${index}.productId`, e.target.value)
        setValue(`products.${index}.batchId`, '')
      }}
    >
      <option value="">{isLoading ? 'Loading...' : 'Select a product'}</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} — {p.molecule}
        </option>
      ))}
    </select>
  )
}

// ── ModalProductRow ───────────────────────────────────────────
interface ModalProductRowProps {
  index: number
  onRemove: () => void
  register: ReturnType<typeof useForm<EditVisitForm>>['register']
  setValue: ReturnType<typeof useForm<EditVisitForm>>['setValue']
  watchProductId: string
}

function ModalProductRow({
  index,
  onRemove,
  register,
  setValue,
  watchProductId,
}: ModalProductRowProps) {
  const { data: batchesData, isLoading: batchesLoading } = useGetBatchesByProductQuery(
    watchProductId,
    { skip: !watchProductId }
  )
  const batches = batchesData?.data ?? []

  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ background: 'var(--vp-bg-surface-alt)', border: '1px solid var(--vp-border)' }}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--vp-text-secondary)' }}>
          Product {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-lg"
          style={{ color: 'var(--vp-rose)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vp-rose-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product dropdown */}
      <ModalProductSelector index={index} register={register} setValue={setValue} />

      {/* Batch dropdown — only when product selected */}
      {watchProductId && (
        <select
          {...register(`products.${index}.batchId`)}
          className="input-dark text-sm"
          style={{ background: 'var(--vp-bg-surface)' }}
          disabled={batchesLoading}
        >
          <option value="">
            {batchesLoading
              ? 'Loading batches...'
              : batches.length === 0
                ? 'No batches available'
                : 'Select batch (optional)'}
          </option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batchNumber} — Exp: {batch.expiryDate} ({batch.currentQuantity} units)
            </option>
          ))}
        </select>
      )}

      {/* Samples + Feedback */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--vp-text-muted)' }}
          >
            Samples
          </label>
          <input
            {...register(`products.${index}.samplesGiven`, { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="0"
            className="input-dark text-sm"
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--vp-text-muted)' }}
          >
            Feedback
          </label>
          <input
            {...register(`products.${index}.feedback`)}
            type="text"
            placeholder="Doctor's response..."
            className="input-dark text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// ── EditVisitModal ────────────────────────────────────────────
interface EditVisitModalProps {
  open: boolean
  onClose: () => void
  visitId: string
  defaultValues: EditVisitForm
}

function EditVisitModal({ open, onClose, visitId, defaultValues }: EditVisitModalProps) {
  const [updateVisit, { isLoading }] = useUpdateVisitMutation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditVisitForm>({
    resolver: zodResolver(editVisitSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
  })

  const watchedProducts = watch('products')

  const onSubmit = async (data: EditVisitForm) => {
    try {
      await updateVisit({
        id: visitId,
        body: {
          status: data.status,
          notes: data.notes || undefined,
          // Map form rows to VisitProductRequest[]
          // Filter rows where no product was selected
          products: data.products
            .filter((p) => p.productId)
            .map((p) => ({
              productId: p.productId,
              batchId: p.batchId || undefined,
              samplesGiven: p.samplesGiven,
              feedback: p.feedback || undefined,
            })),
        },
      }).unwrap()
      toast.success('Visit updated successfully')
      onClose()
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to update visit')
    }
  }

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Edit Visit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Status */}
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: 'var(--vp-text-secondary)' }}
            >
              Status *
            </label>
            <select
              {...register('status')}
              className="input-dark"
              style={{ background: 'var(--vp-bg-surface)' }}
            >
              <option value="PLANNED">Planned</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
            </select>
            {errors.status && <p className="text-xs mt-1 text-rose-500">{errors.status.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: 'var(--vp-text-secondary)' }}
            >
              Notes
            </label>
            <textarea
              {...register('notes')}
              className="input-dark resize-none"
              rows={3}
              placeholder="Add visit notes..."
            />
          </div>

          {/* Products section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-sm font-semibold"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                Products Detailed
              </label>
              <button
                type="button"
                onClick={() =>
                  append({ productId: '', batchId: '', samplesGiven: 0, feedback: '' })
                }
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--vp-teal-light)', color: 'var(--vp-teal)' }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            {fields.length === 0 ? (
              <div
                className="flex items-center justify-center py-6 rounded-xl border-2 border-dashed text-center"
                style={{ borderColor: 'var(--vp-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                  No products added — click Add Product to record detailing
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <ModalProductRow
                    key={field.id}
                    index={index}
                    onRemove={() => remove(index)}
                    register={register}
                    setValue={setValue}
                    watchProductId={watchedProducts?.[index]?.productId ?? ''}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [showEdit, setShowEdit] = useState(false)

  // Controls EN/MR language toggle for the AI briefing panel
  const [aiLang, setAiLang] = useState<'en' | 'mr'>('en')

  const { data: briefingData, isLoading: briefingLoading } = useGetVisitBriefingQuery(id ?? '', {
    skip: !id,
  })

  const briefing = briefingData?.data

  const { data: visitData, isLoading, isError } = useGetVisitByIdQuery(id ?? '', { skip: !id })

  const visit = visitData?.data

  // ── Loading state ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full skeleton-shimmer" />
            <Skeleton className="h-48 w-full skeleton-shimmer" />
          </div>
          <Skeleton className="h-64 w-full skeleton-shimmer" />
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────
  if (isError || !visit) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--vp-rose-light)' }}
        >
          <ClipboardList className="w-8 h-8" style={{ color: 'var(--vp-rose)' }} />
        </div>
        <p className="text-lg font-semibold mb-1" style={{ color: 'var(--vp-text-primary)' }}>
          Visit not found
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--vp-text-muted)' }}>
          This visit may have been removed or the link is invalid.
        </p>
        <button onClick={() => navigate('/visits')} className="btn-primary">
          Back to Visits
        </button>
      </div>
    )
  }

  const editDefaultValues: EditVisitForm = {
    status: visit.status,
    notes: visit.notes ?? '',
    // Pre-populate existing products so the rep sees what was already recorded
    // and can add/remove/edit them
    products: visit.visitProducts.map((p) => ({
      productId: p.productId,
      batchId: p.batchId ?? '',
      samplesGiven: p.samplesGiven ?? 0,
      feedback: p.feedback ?? '',
    })),
  }

  const statusCfg = statusConfig[visit.status as keyof typeof statusConfig]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate('/visits')}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: 'var(--vp-bg-surface)',
              border: '1px solid var(--vp-border)',
              color: 'var(--vp-text-muted)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--vp-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--vp-text-muted)')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--vp-text-primary)' }}
              >
                {visit.doctorName}
              </h1>
              <VisitStatusBadge status={visit.status} />
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
              {visit.doctorSpecialty} • {format(parseISO(visit.visitDate), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => setShowEdit(true)}
          className="btn-secondary flex items-center gap-2 text-sm self-start sm:self-auto"
        >
          <Edit2 className="w-4 h-4" /> Edit Visit
        </button>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Info Card */}
          <div className="vp-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: statusCfg?.bg ?? 'var(--vp-bg-hover)' }}
              >
                <ClipboardList
                  className="w-5 h-5"
                  style={{ color: statusCfg?.color ?? 'var(--vp-text-muted)' }}
                />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                Visit Details
              </h2>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Stethoscope className="w-4 h-4" />,
                  label: 'Doctor',
                  value: visit.doctorName,
                },
                {
                  icon: <Stethoscope className="w-4 h-4" />,
                  label: 'Specialty',
                  value: visit.doctorSpecialty,
                },
                { icon: <User className="w-4 h-4" />, label: 'Sales Rep', value: visit.repName },
                {
                  icon: <Calendar className="w-4 h-4" />,
                  label: 'Visit Date',
                  value: format(parseISO(visit.visitDate), 'MMMM d, yyyy'),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: 'var(--vp-bg-surface-alt)',
                    border: '1px solid var(--vp-border)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--vp-teal-dim)', color: 'var(--vp-teal)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--vp-text-muted)' }}>
                      {item.label}
                    </p>
                    <p
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: 'var(--vp-text-primary)' }}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {visit.notes && (
              <div
                className="mt-4 p-4 rounded-xl"
                style={{
                  background: 'var(--vp-bg-surface-alt)',
                  border: '1px solid var(--vp-border)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" style={{ color: 'var(--vp-text-muted)' }} />
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--vp-text-muted)' }}
                  >
                    Notes
                  </p>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  {visit.notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div
              className="flex items-center gap-4 mt-4 pt-4 text-xs"
              style={{ borderTop: '1px solid var(--vp-border)', color: 'var(--vp-text-muted)' }}
            >
              <span>Created: {format(parseISO(visit.createdAt), 'MMM d, yyyy')}</span>
              <span>•</span>
              <span>Updated: {format(parseISO(visit.updatedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* ── Products Detailing Table ── */}
          <div className="vp-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--vp-purple-light)' }}
              >
                <Pill className="w-5 h-5" style={{ color: 'var(--vp-purple)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  Products Detailed
                </h2>
                <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                  {visit.visitProducts.length} product(s) discussed
                </p>
              </div>
            </div>

            {visit.visitProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--vp-purple-light)' }}
                >
                  <Package className="w-5 h-5" style={{ color: 'var(--vp-purple)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--vp-text-secondary)' }}>
                  No products recorded for this visit
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visit.visitProducts.map((product: VisitProductDto) => (
                  <div
                    key={product.id}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'var(--vp-bg-surface-alt)',
                      border: '1px solid var(--vp-border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'var(--vp-purple-dim)', color: 'var(--vp-purple)' }}
                        >
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: 'var(--vp-text-primary)' }}
                          >
                            {product.productName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
                            HSN: {product.hsnCode}
                            {product.batchNumber && ` • Batch: ${product.batchNumber}`}
                          </p>
                        </div>
                      </div>
                      {/* Samples given badge */}
                      {product.samplesGiven != null && product.samplesGiven > 0 && (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                          style={{ background: 'var(--vp-teal-light)', color: 'var(--vp-teal)' }}
                        >
                          {product.samplesGiven} sample{product.samplesGiven > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Feedback */}
                    {product.feedback && (
                      <div
                        className="mt-3 pt-3 flex items-start gap-2"
                        style={{ borderTop: '1px solid var(--vp-border)' }}
                      >
                        <MessageSquare
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: 'var(--vp-text-muted)' }}
                        />
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: 'var(--vp-text-secondary)' }}
                        >
                          {product.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column — AI Summary ── */}
        {/* ── Right column — AI Visit Briefing ── */}
        <div>
          <div className="vp-card p-6">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--vp-purple-dim)' }}
                >
                  <Brain className="w-5 h-5" style={{ color: 'var(--vp-purple)' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                    Visit Preparation
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                    AI-powered coaching
                  </p>
                </div>
              </div>

              {/* EN / MR toggle */}
              <div
                className="flex rounded-lg overflow-hidden text-xs font-semibold"
                style={{ border: '1px solid var(--vp-border)' }}
              >
                <button
                  onClick={() => setAiLang('en')}
                  className="px-3 py-1.5 flex items-center gap-1 transition-colors"
                  style={{
                    background: aiLang === 'en' ? 'var(--vp-teal)' : 'transparent',
                    color: aiLang === 'en' ? '#FFFFFF' : 'var(--vp-text-muted)',
                  }}
                >
                  <Globe className="w-3 h-3" /> EN
                </button>
                <button
                  onClick={() => setAiLang('mr')}
                  className="px-3 py-1.5 flex items-center gap-1 transition-colors"
                  style={{
                    background: aiLang === 'mr' ? 'var(--vp-purple)' : 'transparent',
                    color: aiLang === 'mr' ? '#FFFFFF' : 'var(--vp-text-muted)',
                  }}
                >
                  <Languages className="w-3 h-3" /> MR
                </button>
              </div>
            </div>

            {briefingLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 skeleton-shimmer" />
                ))}
              </div>
            ) : briefing ? (
              <div className="space-y-3">
                {/* Each section shows EN or MR text based on toggle */}
                {[
                  {
                    label: 'Last Visit Summary',
                    en: briefing.lastVisitSummary,
                    mr: briefing.lastVisitSummaryMr,
                  },
                  {
                    label: 'Product Focus',
                    en: briefing.productFocus,
                    mr: briefing.productFocusMr,
                  },
                  {
                    label: 'Talking Points',
                    en: briefing.talkingPoints,
                    mr: briefing.talkingPointsMr,
                  },
                  {
                    label: 'Active Schemes',
                    en: briefing.activeSchemes,
                    mr: briefing.activeSchemesMr,
                  },
                  {
                    label: 'Visit Strategy',
                    en: briefing.visitStrategy,
                    mr: briefing.visitStrategyMr,
                  },
                ].map((section) => (
                  <div
                    key={section.label}
                    className="p-3 rounded-xl"
                    style={{
                      background: 'var(--vp-bg-surface-alt)',
                      border: '1px solid var(--vp-border)',
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: 'var(--vp-text-muted)' }}
                    >
                      {section.label}
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--vp-text-secondary)' }}
                    >
                      {aiLang === 'en' ? section.en : section.mr}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Brain className="w-8 h-8 mb-2" style={{ color: 'var(--vp-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--vp-text-secondary)' }}>
                  Preparation unavailable
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--vp-text-muted)' }}>
                  AI coaching requires visit and doctor data
                </p>
              </div>
            )}

            {/* Quick nav to doctor detail */}
            <button
              onClick={() => navigate(`/doctors/${visit.doctorId}`)}
              className="w-full mt-4 flex items-center justify-between p-3 rounded-xl transition-colors"
              style={{
                background: 'var(--vp-bg-surface-alt)',
                border: '1px solid var(--vp-border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vp-teal-dim)'
                e.currentTarget.style.borderColor = 'var(--vp-teal)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--vp-bg-surface-alt)'
                e.currentTarget.style.borderColor = 'var(--vp-border)'
              }}
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" style={{ color: 'var(--vp-teal)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  View Doctor Profile
                </span>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--vp-text-muted)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {visit && (
        <EditVisitModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          visitId={id!}
          defaultValues={editDefaultValues}
        />
      )}
    </div>
  )
}
