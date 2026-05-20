// src/features/returns/ReturnDetailPage.tsx
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  RotateCcw,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  Package,
  Loader2,
  FileCheck,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/shared/hooks/useAuth'
import {
  useGetReturnByIdQuery,
  useProcessReturnMutation,
  useRejectReturnMutation,
  useApplyCreditNoteMutation,
} from './returnsApi'
import { useGetOutstandingInvoicesQuery } from '@/features/invoices/invoicesApi'
import type { ReturnItemCondition } from '@/types/returns'

// ── Status config ──────────────────────────────────────────────────────────────
const statusConfig = {
  PENDING: {
    label: 'Pending Review',
    color: 'var(--vp-amber)',
    bg: 'var(--vp-amber-light)',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  PROCESSED: {
    label: 'Processed',
    color: 'var(--vp-teal)',
    bg: 'var(--vp-teal-light)',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'var(--vp-rose)',
    bg: 'var(--vp-rose-light)',
    icon: <XCircle className="w-4 h-4" />,
  },
}

// ── Condition badge config ─────────────────────────────────────────────────────
const conditionConfig: Record<ReturnItemCondition, { label: string; color: string; bg: string }> = {
  SALEABLE: { label: 'Saleable', color: 'var(--vp-teal)', bg: 'var(--vp-teal-light)' },
  DAMAGED: { label: 'Damaged', color: 'var(--vp-rose)', bg: 'var(--vp-rose-light)' },
  EXPIRED: { label: 'Expired', color: 'var(--vp-amber)', bg: 'var(--vp-amber-light)' },
}

// ── Credit note status config ──────────────────────────────────────────────────
const creditStatusConfig = {
  OPEN: { label: 'Open — ready to apply', color: 'var(--vp-teal)', bg: 'var(--vp-teal-light)' },
  APPLIED: { label: 'Applied to invoice', color: 'var(--vp-purple)', bg: 'var(--vp-purple-light)' },
  VOID: { label: 'Void', color: 'var(--vp-text-muted)', bg: 'var(--vp-bg-surface-alt)' },
}

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isOwner, isOwnerOrManager } = useAuth()

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [showProcess, setShowProcess] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: returnData, isLoading, isError } = useGetReturnByIdQuery(id ?? '', { skip: !id })
  const ret = returnData?.data

  // Outstanding invoices for the Apply Credit Note modal
  // Only fetch when the apply dialog is open — and only for OWNER
  const { data: outstandingData } = useGetOutstandingInvoicesQuery(undefined, {
    skip: !showApply || !isOwner,
  })
  const outstandingInvoices = useMemo(() => {
    if (!outstandingData?.data || !ret) return []
    // Filter to only invoices matching the same buyer as the return
    return outstandingData.data.filter((inv) => {
      if (ret.chemistId) return inv.chemistId === ret.chemistId
      if (ret.stockistId) return inv.stockistId === ret.stockistId
      return false
    })
  }, [outstandingData, ret])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [processReturn, { isLoading: processing }] = useProcessReturnMutation()
  const [rejectReturn, { isLoading: rejecting }] = useRejectReturnMutation()
  const [applyCreditNote, { isLoading: applying }] = useApplyCreditNoteMutation()

  const onProcess = async () => {
    if (!id) return
    try {
      await processReturn(id).unwrap()
      toast.success('Return processed — credit note raised')
      setShowProcess(false)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to process return')
    }
  }

  const onReject = async () => {
    if (!id) return
    try {
      await rejectReturn(id).unwrap()
      toast.success('Return rejected')
      setShowReject(false)
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to reject return')
    }
  }

  const onApplyCreditNote = async () => {
    if (!ret?.creditNote || !selectedInvoiceId) return
    try {
      await applyCreditNote({
        creditNoteId: ret.creditNote.id,
        invoiceId: selectedInvoiceId,
      }).unwrap()
      toast.success('Credit note applied to invoice')
      setShowApply(false)
      setSelectedInvoiceId('')
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } }
      toast.error(error?.data?.message ?? 'Failed to apply credit note')
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 skeleton-shimmer" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 skeleton-shimmer" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !ret) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <RotateCcw className="w-12 h-12 mb-4" style={{ color: 'var(--vp-text-muted)' }} />
        <p className="text-lg font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
          Return not found
        </p>
        <button onClick={() => navigate('/returns')} className="btn-secondary mt-4 text-sm">
          Back to Returns
        </button>
      </div>
    )
  }

  const status = statusConfig[ret.status]
  const buyerName = ret.chemistFirmName ?? ret.stockistFirmName ?? '—'
  const totalValue = ret.returnItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const isPending = ret.status === 'PENDING'
  const isProcessed = ret.status === 'PROCESSED'

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/returns')}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--vp-text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vp-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--vp-text-primary)' }}
            >
              {ret.returnNumber}
            </h1>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: status.bg, color: status.color }}
            >
              {status.icon}
              {status.label}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--vp-text-muted)' }}>
            {buyerName}
          </p>
        </div>

        {/* Action buttons — OWNER/MANAGER only, PENDING only */}
        {isOwnerOrManager && isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReject(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
              style={{ color: 'var(--vp-rose)', borderColor: 'var(--vp-rose)' }}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => setShowProcess(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Process Return
            </button>
          </div>
        )}

        {/* Apply Credit Note — OWNER only, PROCESSED with OPEN credit note */}
        {isOwner && isProcessed && ret.creditNote?.status === 'OPEN' && (
          <button
            onClick={() => setShowApply(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FileCheck className="w-4 h-4" />
            Apply Credit Note
          </button>
        )}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT — Return Info ───────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Return details card */}
          <div className="vp-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: status.bg }}
              >
                <span style={{ color: status.color }}>{status.icon}</span>
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                Return Details
              </h2>
            </div>

            {[
              {
                icon: <Building2 className="w-4 h-4" />,
                label: ret.chemistFirmName ? 'Chemist' : 'Stockist',
                value: buyerName,
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: 'Return Date',
                value: format(parseISO(ret.returnDate), 'MMM d, yyyy'),
              },
              {
                icon: <FileText className="w-4 h-4" />,
                label: 'Reason',
                value: ret.reason,
              },
              {
                icon: <Package className="w-4 h-4" />,
                label: 'Items',
                value: `${ret.returnItems.length} item${ret.returnItems.length !== 1 ? 's' : ''}`,
              },
              {
                icon: <IndianRupee className="w-4 h-4" />,
                label: 'Total Value',
                value: `₹${totalValue.toFixed(2)}`,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: 'var(--vp-bg-surface-alt)',
                    color: 'var(--vp-text-muted)',
                  }}
                >
                  {row.icon}
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                    {row.value}
                  </p>
                </div>
              </div>
            ))}

            <div
              className="flex items-center gap-4 pt-3 text-xs"
              style={{ borderTop: '1px solid var(--vp-border)', color: 'var(--vp-text-muted)' }}
            >
              <span>Created: {format(parseISO(ret.createdAt), 'MMM d, yyyy')}</span>
              <span>•</span>
              <span>Updated: {format(parseISO(ret.updatedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Credit Note card — only shown when PROCESSED */}
          {isProcessed && ret.creditNote && (
            <div className="vp-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--vp-purple-light)' }}
                >
                  <FileCheck className="w-5 h-5" style={{ color: 'var(--vp-purple)' }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  Credit Note
                </h2>
              </div>

              {(() => {
                const cn = ret.creditNote!
                const cs = creditStatusConfig[cn.status]
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: 'var(--vp-text-primary)' }}>
                        {cn.creditNoteNumber}
                      </p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cs.bg, color: cs.color }}
                      >
                        {cs.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" style={{ color: 'var(--vp-teal)' }} />
                      <p
                        className="text-xl font-bold"
                        style={{
                          color: 'var(--vp-teal)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {Number(cn.amount).toFixed(2)}
                      </p>
                    </div>
                    {cn.appliedToInvoiceNumber && (
                      <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                        Applied to invoice: {cn.appliedToInvoiceNumber}
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* ── RIGHT — Return Line Items ────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="vp-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--vp-purple-light)' }}
              >
                <Package className="w-5 h-5" style={{ color: 'var(--vp-purple)' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--vp-text-primary)' }}>
                  Returned Items
                </h2>
                <p className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                  {ret.returnItems.length} item{ret.returnItems.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {ret.returnItems.map((item) => {
                const cond = conditionConfig[item.condition]
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'var(--vp-bg-surface-alt)',
                      border: '1px solid var(--vp-border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: 'var(--vp-text-primary)' }}
                          >
                            {item.productName}
                          </p>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: cond.bg, color: cond.color }}
                          >
                            {cond.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                            Batch: {item.batchNumber}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                            HSN: {item.hsnCode}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                            Qty: {item.quantity}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--vp-text-muted)' }}>
                            Unit: ₹{Number(item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-0.5 justify-end">
                          <IndianRupee
                            className="w-3.5 h-3.5"
                            style={{ color: 'var(--vp-text-primary)' }}
                          />
                          <p
                            className="text-sm font-bold"
                            style={{ color: 'var(--vp-text-primary)' }}
                          >
                            {Number(item.lineTotal).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total row */}
            <div
              className="flex items-center justify-between mt-4 pt-4"
              style={{ borderTop: '1px solid var(--vp-border)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--vp-text-secondary)' }}>
                Total Credit Value
              </p>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" style={{ color: 'var(--vp-teal)' }} />
                <p
                  className="text-lg font-bold"
                  style={{
                    color: 'var(--vp-teal)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {totalValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Process Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog open={showProcess} onOpenChange={setShowProcess}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Process Return</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--vp-text-secondary)' }}>
            Processing <span className="font-semibold">{ret.returnNumber}</span> will:
          </p>
          <ul className="text-sm space-y-1 mt-2 ml-4" style={{ color: 'var(--vp-text-secondary)' }}>
            <li>• Restore SALEABLE items back to stock</li>
            <li>• Write off DAMAGED and EXPIRED items</li>
            <li>• Raise a credit note for ₹{totalValue.toFixed(2)}</li>
          </ul>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowProcess(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={onProcess}
              disabled={processing}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              {processing ? 'Processing...' : 'Confirm Process'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject Confirmation Dialog ───────────────────────────────────────── */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Reject Return</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--vp-text-secondary)' }}>
            Are you sure you want to reject{' '}
            <span className="font-semibold">{ret.returnNumber}</span>? No stock or financial changes
            will be made. This cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={onReject}
              disabled={rejecting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--vp-rose)', color: '#FFFFFF' }}
            >
              {rejecting && <Loader2 className="w-4 h-4 animate-spin" />}
              {rejecting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Apply Credit Note Dialog ─────────────────────────────────────────── */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent
          style={{ background: 'var(--vp-bg-surface)', border: '1px solid var(--vp-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--vp-text-primary)' }}>Apply Credit Note</DialogTitle>
          </DialogHeader>
          {ret.creditNote && (
            <div
              className="p-3 rounded-xl text-sm mb-2"
              style={{ background: 'var(--vp-teal-light)', color: 'var(--vp-teal)' }}
            >
              Credit Note <strong>{ret.creditNote.creditNoteNumber}</strong> · ₹
              {Number(ret.creditNote.amount).toFixed(2)} available
            </div>
          )}
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: 'var(--vp-text-secondary)' }}
            >
              Apply to Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="input-dark w-full"
            >
              <option value="">Select an outstanding invoice...</option>
              {outstandingInvoices.map((inv) => (
                <option key={inv.invoiceId} value={inv.invoiceId}>
                  {inv.invoiceNumber} — ₹{Number(inv.outstandingAmount).toFixed(2)} outstanding
                </option>
              ))}
            </select>
            {outstandingInvoices.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--vp-text-muted)' }}>
                No outstanding invoices for this buyer
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => {
                setShowApply(false)
                setSelectedInvoiceId('')
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onApplyCreditNote}
              disabled={applying || !selectedInvoiceId}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {applying && <Loader2 className="w-4 h-4 animate-spin" />}
              {applying ? 'Applying...' : 'Apply Credit Note'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
