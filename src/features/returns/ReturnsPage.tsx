// src/features/returns/ReturnsPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import {
  RotateCcw,
  FileCheck,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Building2,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  useGetAllReturnsQuery,
  useGetCreditNotesByChemistQuery,
  useGetCreditNotesByStockistQuery,
  useCreateReturnMutation,
} from './returnsApi'
import type { ReturnDto } from '@/types/returns'
import { useGetAllChemistsQuery } from '@/features/chemists/chemistsApi'
import { useGetAllStockistsQuery } from '@/features/stockists/stockistsApi'
import { useGetAllProductsQuery } from '@/features/products/productsApi'
import { useGetBatchesByProductQuery } from '@/features/inventory/inventoryApi'

// ── Tab type ───────────────────────────────────────────────────────────────────
type Tab = 'returns' | 'credit-notes'

// ── Status configs ─────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING: { label: 'Pending', color: 'var(--vp-amber)', bg: 'var(--vp-amber-light)', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  PROCESSED: { label: 'Processed', color: 'var(--vp-teal)', bg: 'var(--vp-teal-light)', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: 'Rejected', color: 'var(--vp-rose)', bg: 'var(--vp-rose-light)', icon: <XCircle className="w-3.5 h-3.5" /> },
}

const creditStatusConfig = {
  OPEN: { label: 'Open', color: 'var(--vp-teal)', bg: 'var(--vp-teal-light)' },
  APPLIED: { label: 'Applied', color: 'var(--vp-purple)', bg: 'var(--vp-purple-light)' },
  VOID: { label: 'Void', color: 'var(--vp-text-muted)', bg: 'var(--vp-bg-surface-alt)' },
}

// ── Create Return schema ───────────────────────────────────────────────────────
const returnItemSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  batchId: z.string().min(1, 'Select a batch'),
  quantity: z.number({ error: 'Required' }).min(1, 'Min 1'),
  condition: z.enum(['SALEABLE', 'DAMAGED', 'EXPIRED']),
})

const createReturnSchema = z
  .object({
    buyerType: z.enum(['CHEMIST', 'STOCKIST']),
    chemistId: z.string().optional(),
    stockistId: z.string().optional(),
    returnDate: z.string().min(1, 'Return date is required'),
    reason: z.string().min(1, 'Reason is required'),
    returnItems: z.array(returnItemSchema).min(1, 'Add at least one item'),
  })
  .refine(
    (data) => {
      if (data.buyerType === 'CHEMIST') return !!data.chemistId
      return !!data.stockistId
    },
    { message: 'Please select a buyer', path: ['chemistId'] }
  )

type CreateReturnForm = z.infer<typeof createReturnSchema>

export default function ReturnsPage() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('returns')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [showCreate, setShowCreate] = useState(false)

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: returnsData, isLoading: returnsLoading } = useGetAllReturnsQuery()
  const returns = useMemo(() => returnsData?.data ?? [], [returnsData])

  const pending = returns.filter((r) => r.status === 'PENDING').length
  const processed = returns.filter((r) => r.status === 'PROCESSED').length
  const rejected = returns.filter((r) => r.status === 'REJECTED').length

  const filtered = useMemo(() => {
    return returns
      .filter((r) => {
        const buyerName = r.chemistFirmName ?? r.stockistFirmName ?? ''
        const matchesSearch =
          r.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
          buyerName.toLowerCase().includes(search.toLowerCase()) ||
          r.reason.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => b.returnDate.localeCompare(a.returnDate))
  }, [returns, search, statusFilter])

  // ── Create Return form ─────────────────────────────────────────────────────
  const [createReturn, { isLoading: creating }] = useCreateReturnMutation()
  const { data: chemistsData } = useGetAllChemistsQuery()
  const { data: stockistsData } = useGetAllStockistsQuery()
  const { data: productsData } = useGetAllProductsQuery()
  const chemists = useMemo(() => chemistsData?.data ?? [], [chemistsData])
  const stockists = useMemo(() => stockistsData?.data ?? [], [stockistsData])
  const products = useMemo(() => productsData?.data ?? [], [productsData])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateReturnForm>({
    resolver: zodResolver(createReturnSchema),
    defaultValues: {
      buyerType: 'CHEMIST',
      returnDate: new Date().toISOString().split('T')[0],
      returnItems: [{ productId: '', batchId: '', quantity: 1, condition: 'SALEABLE' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'returnItems' })
  const watchBuyerType = watch('buyerType')

  const onSubmit = async (formData: CreateReturnForm) => {
    try {
      await createReturn({
        chemistId: formData.buyerType === 'CHEMIST' ? formData.chemistId : undefined,
        stockistId: formData.buyerType === 'STOCKIST' ? formData.stockistId : undefined,
        returnDate: formData.returnDate,
        reason: formData.reason,
        returnItems: formData.returnItems.map((item) => ({
          batchId: item.batchId,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }).unwrap()
      toast.success('Return logged successfully')
      reset()
      setShowCreate(false)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to create return')
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
            Returns & Credit Notes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
            Manage sales returns and apply credit notes to invoices
          </p>
        </div>
        {/* ALL roles can log a return per backend @PreAuthorize */}
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Log Return
        </button>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: pending, color: 'var(--vp-amber)', bg: 'var(--vp-amber-light)', icon: <AlertCircle className="w-5 h-5" /> },
          { label: 'Processed', count: processed, color: 'var(--vp-teal)', bg: 'var(--vp-teal-light)', icon: <CheckCircle2 className="w-5 h-5" /> },
          { label: 'Rejected', count: rejected, color: 'var(--vp-rose)', bg: 'var(--vp-rose-light)', icon: <XCircle className="w-5 h-5" /> },
        ].map((kpi) => (
          <div key={kpi.label} className="vp-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: kpi.bg }}>
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--vp-text-muted)' }}>{kpi.label}</p>
                {returnsLoading ? (
                  <Skeleton className="h-6 w-8 skeleton-shimmer mt-1" />
                ) : (
                  <p className="text-xl font-bold" style={{ color: kpi.color, fontFamily: 'var(--font-display)' }}>{kpi.count}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────────── */}
      <div className="vp-card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'var(--vp-border)' }}>
          {[
            { key: 'returns' as Tab, label: 'Returns', icon: <RotateCcw className="w-4 h-4" /> },
            { key: 'credit-notes' as Tab, label: 'Credit Notes', icon: <FileCheck className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all"
              style={{
                color: activeTab === tab.key ? 'var(--vp-teal)' : 'var(--vp-text-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--vp-teal)' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Returns Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'returns' && (
          <div>
            <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ borderBottom: '1px solid var(--vp-border)' }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--vp-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by return number, buyer, or reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-dark w-full"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <div className="flex gap-2">
                {['ALL', 'PENDING', 'PROCESSED', 'REJECTED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: statusFilter === s ? 'var(--vp-teal-light)' : 'transparent',
                      color: statusFilter === s ? 'var(--vp-teal)' : 'var(--vp-text-muted)',
                      border: statusFilter === s ? '1px solid rgba(0,196,154,0.3)' : '1px solid var(--vp-border)',
                    }}
                  >
                    {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {returnsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 skeleton-shimmer" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <RotateCcw className="w-10 h-10 mb-3" style={{ color: 'var(--vp-text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  {search || statusFilter !== 'ALL' ? 'No returns match your filters' : 'No returns yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--vp-border)' }}>
                {filtered.map((ret) => <ReturnRow key={ret.id} ret={ret} navigate={navigate} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Credit Notes Tab ─────────────────────────────────────────────── */}
        {activeTab === 'credit-notes' && <CreditNotesTab />}
      </div>

      {/* ── Create Return Modal ──────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { reset(); setShowCreate(false) } }}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Log Return</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

            {/* Buyer Type + Buyer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--vp-text-secondary)' }}>
                  Buyer Type *
                </label>
                <select {...register('buyerType')} className="input-dark w-full">
                  <option value="CHEMIST">Chemist</option>
                  <option value="STOCKIST">Stockist</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--vp-text-secondary)' }}>
                  {watchBuyerType === 'CHEMIST' ? 'Chemist' : 'Stockist'} *
                </label>
                {watchBuyerType === 'CHEMIST' ? (
                  <select {...register('chemistId')} className="input-dark w-full">
                    <option value="">Select chemist</option>
                    {chemists.filter((c) => c.isActive).map((c) => (
                      <option key={c.id} value={c.id}>{c.firmName}</option>
                    ))}
                  </select>
                ) : (
                  <select {...register('stockistId')} className="input-dark w-full">
                    <option value="">Select stockist</option>
                    {stockists.filter((s) => s.isActive).map((s) => (
                      <option key={s.id} value={s.id}>{s.firmName}</option>
                    ))}
                  </select>
                )}
                {errors.chemistId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>{errors.chemistId.message}</p>
                )}
              </div>
            </div>

            {/* Return Date + Reason */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--vp-text-secondary)' }}>
                  Return Date *
                </label>
                <input {...register('returnDate')} type="date" className="input-dark w-full" />
                {errors.returnDate && (
                  <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>{errors.returnDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--vp-text-secondary)' }}>
                  Reason *
                </label>
                <input {...register('reason')} type="text" placeholder="e.g. Damaged in transit" className="input-dark w-full" />
                {errors.reason && (
                  <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>{errors.reason.message}</p>
                )}
              </div>
            </div>

            {/* Return Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--vp-text-secondary)' }}>
                  Return Items *
                </label>
                <button
                  type="button"
                  onClick={() => append({ productId: '', batchId: '', quantity: 1, condition: 'SALEABLE' })}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'var(--vp-teal-light)', color: 'var(--vp-teal)' }}
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <ReturnItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    products={products}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </div>
              {errors.returnItems && (
                <p className="text-xs mt-1" style={{ color: 'var(--vp-rose)' }}>
                  {errors.returnItems.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { reset(); setShowCreate(false) }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? 'Logging...' : 'Log Return'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

// ── ReturnItemRow ──────────────────────────────────────────────────────────────
interface ReturnItemRowProps {
  index: number
  control: ReturnType<typeof useForm<CreateReturnForm>>['control']
  register: ReturnType<typeof useForm<CreateReturnForm>>['register']
  products: { id: string; name: string; molecule: string; isActive: boolean }[]
  onRemove: () => void
  canRemove: boolean
}

function ReturnItemRow({ index, control, register, products, onRemove, canRemove }: ReturnItemRowProps) {
  const watchProductId = useWatch({ control, name: `returnItems.${index}.productId` })

  const { data: batchesData, isLoading: batchesLoading } = useGetBatchesByProductQuery(
    watchProductId,
    { skip: !watchProductId }
  )
  const batches = useMemo(() => batchesData?.data ?? [], [batchesData])

  return (
    <div
      className="p-3 rounded-xl space-y-2"
      style={{ background: 'var(--vp-bg-surface-alt)', border: '1px solid var(--vp-border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--vp-text-secondary)' }}>
          Item {index + 1}
        </p>
        {canRemove && (
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
        )}
      </div>

      {/* Product */}
      <select {...register(`returnItems.${index}.productId`)} className="input-dark text-sm w-full">
        <option value="">Select product</option>
        {products.filter((p) => p.isActive).map((p) => (
          <option key={p.id} value={p.id}>{p.name} — {p.molecule}</option>
        ))}
      </select>

      {/* Batch */}
      {watchProductId && (
        <select {...register(`returnItems.${index}.batchId`)} className="input-dark text-sm w-full" disabled={batchesLoading}>
          <option value="">{batchesLoading ? 'Loading batches...' : 'Select batch'}</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.batchNumber} — {b.currentQuantity} units (exp: {b.expiryDate})
            </option>
          ))}
        </select>
      )}

      {/* Quantity + Condition */}
      <div className="grid grid-cols-2 gap-2">
        <input
          {...register(`returnItems.${index}.quantity`, { valueAsNumber: true })}
          type="number"
          min={1}
          placeholder="Qty"
          className="input-dark text-sm w-full"
        />
        <select {...register(`returnItems.${index}.condition`)} className="input-dark text-sm w-full">
          <option value="SALEABLE">Saleable</option>
          <option value="DAMAGED">Damaged</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>
    </div>
  )
}

// ── ReturnRow ──────────────────────────────────────────────────────────────────
function ReturnRow({ ret, navigate }: { ret: ReturnDto; navigate: ReturnType<typeof useNavigate> }) {
  const status = statusConfig[ret.status]
  const buyerName = ret.chemistFirmName ?? ret.stockistFirmName ?? '—'
  const totalValue = ret.returnItems.reduce((sum, item) => sum + item.lineTotal, 0)

  return (
    <div
      onClick={() => navigate(`/returns/${ret.id}`)}
      className="flex items-center gap-4 p-4 cursor-pointer transition-colors"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vp-bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: status.bg }}>
        <span style={{ color: status.color }}>{status.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>{ret.returnNumber}</p>
          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
            {status.icon}{status.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--vp-text-muted)' }}>
            <Building2 className="w-3 h-3" /> {buyerName}
          </span>
          <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
            {format(parseISO(ret.returnDate), 'MMM d, yyyy')}
          </span>
          <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
            {ret.returnItems.length} item{ret.returnItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <IndianRupee className="w-3.5 h-3.5" style={{ color: 'var(--vp-text-primary)' }} />
        <p className="text-sm font-bold" style={{ color: 'var(--vp-text-primary)' }}>{totalValue.toFixed(2)}</p>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--vp-text-muted)' }} />
    </div>
  )
}

// ── CreditNotesTab ─────────────────────────────────────────────────────────────
function CreditNotesTab() {
  const [buyerType, setBuyerType] = useState<'CHEMIST' | 'STOCKIST'>('CHEMIST')
  const [selectedBuyerId, setSelectedBuyerId] = useState('')

  const { data: chemistsData } = useGetAllChemistsQuery()
  const { data: stockistsData } = useGetAllStockistsQuery()
  const chemists = useMemo(() => chemistsData?.data ?? [], [chemistsData])
  const stockists = useMemo(() => stockistsData?.data ?? [], [stockistsData])

  const { data: chemistCNData, isLoading: chemistCNLoading } = useGetCreditNotesByChemistQuery(
    selectedBuyerId, { skip: !selectedBuyerId || buyerType !== 'CHEMIST' }
  )
  const { data: stockistCNData, isLoading: stockistCNLoading } = useGetCreditNotesByStockistQuery(
    selectedBuyerId, { skip: !selectedBuyerId || buyerType !== 'STOCKIST' }
  )

  const creditNotes = useMemo(() => {
    if (!selectedBuyerId) return []
    if (buyerType === 'CHEMIST') return chemistCNData?.data ?? []
    return stockistCNData?.data ?? []
  }, [buyerType, selectedBuyerId, chemistCNData, stockistCNData])

  const isLoading = buyerType === 'CHEMIST' ? chemistCNLoading : stockistCNLoading

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        {(['CHEMIST', 'STOCKIST'] as const).map((type) => (
          <button
            key={type}
            onClick={() => { setBuyerType(type); setSelectedBuyerId('') }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: buyerType === type ? 'var(--vp-teal-light)' : 'transparent',
              color: buyerType === type ? 'var(--vp-teal)' : 'var(--vp-text-muted)',
              border: buyerType === type ? '1px solid rgba(0,196,154,0.3)' : '1px solid var(--vp-border)',
            }}
          >
            {type === 'CHEMIST' ? 'Chemist' : 'Stockist'}
          </button>
        ))}
      </div>

      <select value={selectedBuyerId} onChange={(e) => setSelectedBuyerId(e.target.value)} className="input-dark w-full">
        <option value="">Select a {buyerType === 'CHEMIST' ? 'chemist' : 'stockist'}...</option>
        {buyerType === 'CHEMIST'
          ? chemists.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.firmName} — {c.city}</option>)
          : stockists.filter((s) => s.isActive).map((s) => <option key={s.id} value={s.id}>{s.firmName} — {s.city}</option>)}
      </select>

      {!selectedBuyerId ? (
        <div className="flex flex-col items-center py-10 text-center">
          <FileCheck className="w-8 h-8 mb-2" style={{ color: 'var(--vp-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--vp-text-muted)' }}>Select a buyer to view their credit notes</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 skeleton-shimmer" />)}</div>
      ) : creditNotes.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <FileCheck className="w-8 h-8 mb-2" style={{ color: 'var(--vp-text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>No credit notes for this buyer</p>
        </div>
      ) : (
        <div className="space-y-2">
          {creditNotes.map((cn) => {
            const s = creditStatusConfig[cn.status]
            return (
              <div key={cn.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--vp-bg-surface-alt)', border: '1px solid var(--vp-border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>{cn.creditNoteNumber}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
                    {cn.appliedToInvoiceNumber ? `Applied to: ${cn.appliedToInvoiceNumber}` : `Return: ${cn.returnNumber}`}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <IndianRupee className="w-3.5 h-3.5" style={{ color: 'var(--vp-text-primary)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--vp-text-primary)' }}>{Number(cn.amount).toFixed(2)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}