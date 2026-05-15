import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Stethoscope,
  Calendar,
  ClipboardList,
  Pill,
  Package,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCreateVisitMutation } from './visitApi'
import { useGetAllDoctorsQuery } from '@/features/doctors/doctorsApi'
import {
  useGetAllProductsQuery,
} from '@/features/products/productsApi'
import { useGetBatchesByProductQuery } from '@/features/inventory/inventoryApi'

// ── Zod schema ────────────────────────────────────────────────
const visitProductSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  batchId: z.string().optional(),
  // z.coerce.number() causes the resolver type mismatch — use plain number
  samplesGiven: z.number().min(0).optional(),
  feedback: z.string().optional(),
})

const visitNewSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  visitDate: z.string().min(1, 'Visit date is required'),
  status: z.enum(['PLANNED', 'COMPLETED', 'MISSED']),
  notes: z.string().optional(),
  products: z.array(visitProductSchema),
})

// Derive the type from the schema — single source of truth
type VisitNewForm = z.infer<typeof visitNewSchema>

// ── ProductSelector ───────────────────────────────────────────
interface ProductSelectorProps {
  index: number
  register: ReturnType<typeof useForm<VisitNewForm>>['register']
  setValue: ReturnType<typeof useForm<VisitNewForm>>['setValue']
}

function ProductSelector({ index, register, setValue }: ProductSelectorProps) {
  const { data: productsData, isLoading } = useGetAllProductsQuery()
  const products = productsData?.data ?? []

  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1"
        style={{ color: 'var(--vp-text-secondary)' }}
      >
        Product *
      </label>
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
        <option value="">{isLoading ? 'Loading products...' : 'Select a product'}</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {p.molecule}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── ProductRow ────────────────────────────────────────────────
interface ProductRowProps {
  index: number
  onRemove: () => void
  register: ReturnType<typeof useForm<VisitNewForm>>['register']
  setValue: ReturnType<typeof useForm<VisitNewForm>>['setValue']
  watchProductId: string
}

function ProductRow({ index, onRemove, register, setValue, watchProductId }: ProductRowProps) {
  const { data: batchesData, isLoading: batchesLoading } = useGetBatchesByProductQuery(
    watchProductId,
    { skip: !watchProductId }
  )
  const batches = batchesData?.data ?? []

  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{ background: 'var(--vp-bg-surface-alt)', border: '1px solid var(--vp-border)' }}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--vp-purple-light)', color: 'var(--vp-purple)' }}
          >
            <Pill className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
            Product {index + 1}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--vp-rose)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vp-rose-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <ProductSelector index={index} register={register} setValue={setValue} />

      {/* Batch selector */}
      {watchProductId && (
        <div>
          <label
            className="block text-xs font-semibold mb-1"
            style={{ color: 'var(--vp-text-secondary)' }}
          >
            Batch
          </label>
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
        </div>
      )}

      {/* Samples + Feedback */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-semibold mb-1"
            style={{ color: 'var(--vp-text-secondary)' }}
          >
            Samples Given
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
            className="block text-xs font-semibold mb-1"
            style={{ color: 'var(--vp-text-secondary)' }}
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

// ── Main Page ─────────────────────────────────────────────────
export default function VisitNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [createVisit, { isLoading }] = useCreateVisitMutation()

  const { data: doctorsData, isLoading: doctorsLoading } = useGetAllDoctorsQuery()
  const doctors = doctorsData?.data ?? []

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitNewForm>({
    resolver: zodResolver(visitNewSchema),
    defaultValues: {
      status: 'PLANNED',
      visitDate: format(new Date(), 'yyyy-MM-dd'),
      products: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
  })

  // watch() here is fine — React Compiler warning is informational only,
  // not a real error. It does not break functionality.
  const watchedProducts = watch('products')

  const onSubmit = async (data: VisitNewForm) => {
    try {
      await createVisit({
        repId: user?.id ?? '',
        doctorId: data.doctorId,
        visitDate: data.visitDate,
        status: data.status,
        notes: data.notes || undefined,
        products: data.products
          .filter((p) => p.productId)
          .map((p) => ({
            productId: p.productId,
            batchId: p.batchId || undefined,
            samplesGiven: p.samplesGiven,
            feedback: p.feedback || undefined,
          })),
      }).unwrap()
      toast.success('Visit logged successfully')
      navigate('/visits')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to log visit')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/visits')}
          type="button"
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
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--vp-text-primary)' }}
          >
            Log a Visit
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
            Record a doctor detailing visit with products and samples
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Visit Info Card ── */}
        <div className="vp-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--vp-teal-light)' }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: 'var(--vp-teal)' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
              Visit Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Doctor */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--vp-text-secondary)' }}
              >
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor *
                </span>
              </label>
              <select
                {...register('doctorId')}
                className="input-dark"
                style={{ background: 'var(--vp-bg-surface)' }}
                disabled={doctorsLoading}
              >
                <option value="">
                  {doctorsLoading ? 'Loading doctors...' : 'Select a doctor'}
                </option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.fullName} — {doc.specialty} ({doc.city})
                  </option>
                ))}
              </select>
              {errors.doctorId && (
                <p className="text-xs mt-1 text-rose-500">{errors.doctorId.message}</p>
              )}
            </div>

            {/* Date + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Visit Date *
                  </span>
                </label>
                <input {...register('visitDate')} type="date" className="input-dark" />
                {errors.visitDate && (
                  <p className="text-xs mt-1 text-rose-500">{errors.visitDate.message}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--vp-text-secondary)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronDown className="w-3.5 h-3.5" /> Status *
                  </span>
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
              </div>
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
                placeholder="Key discussion points, doctor's response, follow-up actions..."
              />
            </div>
          </div>
        </div>

        {/* ── Products Detailing Card ── */}
        <div className="vp-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--vp-purple-light)' }}
              >
                <Package className="w-5 h-5" style={{ color: 'var(--vp-purple)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  Products Detailed
                </h2>
                <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                  Optional — add products discussed during this visit
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => append({ productId: '', batchId: '', samplesGiven: 0, feedback: '' })}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {fields.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-center rounded-xl border-2 border-dashed"
              style={{ borderColor: 'var(--vp-border)' }}
            >
              <Pill className="w-8 h-8 mb-2" style={{ color: 'var(--vp-text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--vp-text-secondary)' }}>
                No products added yet
              </p>
              <button
                type="button"
                onClick={() =>
                  append({ productId: '', batchId: '', samplesGiven: 0, feedback: '' })
                }
                className="mt-2 text-xs font-semibold"
                style={{ color: 'var(--vp-teal)' }}
              >
                + Add first product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <ProductRow
                  key={field.id}
                  index={index}
                  onRemove={() => remove(index)}
                  register={register}
                  setValue={setValue}
                  watchProductId={watchedProducts[index]?.productId ?? ''}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/visits')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Logging visit...' : 'Log Visit'}
          </button>
        </div>
      </form>
    </div>
  )
}
