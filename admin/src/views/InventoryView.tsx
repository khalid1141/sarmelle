import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductVariant, InventorySummary, VariantHistoryItem } from '../types';
import { apiClient } from '../api/apiClient';
import { formatCurrency, formatIST } from '../utils/formatters';
import { DataTable, Column, FilterConfig } from '../components/common/DataTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export default function InventoryView() {
  const [summary, setSummary] = useState<InventorySummary>({ this_month_orders: 0, this_month_sales: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Inline edit state
  const [editingVariant, setEditingVariant] = useState<{
    variantId: string;
    productId: string;
    productName: string;
    variantName: string;
    oldQty: number;
    newQty: number;
    heldUnits: number;
  } | null>(null);
  const [editReason, setEditReason] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  // History modal state
  const [historyVariant, setHistoryVariant] = useState<{ variantId: string; title: string } | null>(null);
  const [historyItems, setHistoryItems] = useState<VariantHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await apiClient.get<{ summary: InventorySummary; products: Product[]; updated_at: string }>('/api/admin/inventory');
      if (res.ok) {
        setSummary(res.data.summary);
        setProducts(res.data.products);
        setUpdatedAt(res.data.updated_at);
        setError(null);
      } else {
        setError(res.error.message);
      }
    } catch {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  // 30-second polling timer, cancelled on unmount
  useEffect(() => {
    fetchInventory();
    const interval = setInterval(() => {
      fetchInventory();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchInventory]);

  // Handle quantity change input
  const handleQuantityInputChange = (productId: string, variantId: string, valStr: string) => {
    const num = parseInt(valStr, 10);
    if (isNaN(num) || num < 0) return;

    const prod = products.find((p) => p.id === productId);
    const v = prod?.variants.find((item) => item.id === variantId);
    if (!prod || !v) return;

    setEditingVariant({
      variantId,
      productId,
      productName: prod.name,
      variantName: `${v.color} / ${v.size} (SKU: ${v.sku})`,
      oldQty: v.available_quantity,
      newQty: num,
      heldUnits: prod.held_units || 0,
    });
    setEditReason('');
    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!editingVariant || !editReason.trim()) return;

    const res = await apiClient.patch(`/api/admin/inventory/variants/${editingVariant.variantId}`, {
      quantity: editingVariant.newQty,
      reason: editReason.trim(),
    });

    if (res.ok) {
      setIsConfirmOpen(false);
      setEditingVariant(null);
      setEditReason('');
      fetchInventory();
    } else {
      alert(res.error.message || 'Failed to update quantity');
    }
  };

  const openHistory = async (variantId: string, productTitle: string, v: ProductVariant) => {
    setHistoryVariant({ variantId, title: `${productTitle} - ${v.color} (${v.size})` });
    setHistoryLoading(true);
    try {
      const res = await apiClient.get<VariantHistoryItem[]>(`/api/admin/inventory/variants/${variantId}/history`);
      if (res.ok) {
        setHistoryItems(res.data);
      } else {
        setHistoryItems([]);
      }
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter products by category and status
  const displayedProducts = products.filter((p) => {
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  // Unique categories for filter
  const categories = Array.from(new Set(products.map((p) => p.category))).map((cat) => ({
    label: cat,
    value: cat,
  }));

  const statuses = [
    { label: 'Active', value: 'Active' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Archived', value: 'Archived' },
  ];

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-md ${p.image_placeholder_color} shrink-0 border border-stone-200 flex items-center justify-center text-xs font-semibold text-stone-500`}>
            IMG
          </div>
          <div>
            <div className="font-medium text-stone-900">{p.name}</div>
            <div className="text-xs text-stone-500">Category: {p.category}</div>
            {p.held_units && p.held_units > 0 ? (
              <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                Checkout in progress: {p.held_units} held
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (p) => <span className="text-stone-700">{p.category}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => {
        const styles =
          p.status === 'Active'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : p.status === 'Draft'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-stone-100 text-stone-600 border-stone-200';
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
            {p.status}
          </span>
        );
      },
    },
    {
      key: 'total_available',
      header: 'Total Available Units',
      sortable: true,
      render: (p) => {
        const total = p.variants.reduce((sum, v) => sum + v.available_quantity, 0);
        return <span className="font-semibold text-stone-900">{total} units</span>;
      },
    },
  ];

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-stone-500">
        Loading inventory dashboard...
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg border border-amber-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">This month's orders</p>
            <p className="text-3xl font-bold text-stone-900 mt-1 font-mono">{summary.this_month_orders.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-amber-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">This month's sales</p>
            <p className="text-3xl font-bold text-stone-900 mt-1 font-mono">{formatCurrency(summary.this_month_sales)}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Updated at status bar */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>Updated at {updatedAt || formatIST(new Date())}</span>
        <button
          type="button"
          onClick={fetchInventory}
          className="text-stone-700 hover:text-stone-900 font-medium underline"
        >
          Refresh now
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        data={displayedProducts}
        columns={columns}
        searchPlaceholder="Search product name..."
        searchKey="name"
        filters={[
          { key: 'category', label: 'Category', options: categories },
          { key: 'status', label: 'Status', options: statuses },
        ]}
        filterValues={{ category: filterCategory, status: filterStatus }}
        onFilterChange={(key, val) => {
          if (key === 'category') setFilterCategory(val);
          if (key === 'status') setFilterStatus(val);
        }}
        rowKey={(p) => p.id}
        renderExpandedRow={(product) => (
          <div className="py-2 px-1 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Product Variants & Stock Levels
            </h4>
            <div className="bg-white rounded-md border border-stone-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 uppercase font-semibold border-b border-stone-200">
                    <th className="px-4 py-2.5">Colour</th>
                    <th className="px-4 py-2.5">Size</th>
                    <th className="px-4 py-2.5">SKU</th>
                    <th className="px-4 py-2.5">Available Quantity</th>
                    <th className="px-4 py-2.5 text-right">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {product.variants.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50">
                      <td className="px-4 py-2.5 flex items-center gap-2 font-medium text-stone-900">
                        {v.color_hex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block shrink-0"
                            style={{ backgroundColor: v.color_hex }}
                          />
                        )}
                        {v.color}
                      </td>
                      <td className="px-4 py-2.5 text-stone-700 font-medium">{v.size}</td>
                      <td className="px-4 py-2.5 font-mono text-stone-500">{v.sku}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            defaultValue={v.available_quantity}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== v.available_quantity) {
                                handleQuantityInputChange(product.id, v.id, e.target.value);
                              }
                            }}
                            className="w-20 px-2.5 py-1 text-sm bg-stone-50 border border-stone-300 rounded font-mono focus:outline-hidden focus:ring-2 focus:ring-stone-900 focus:bg-white"
                          />
                          <span className="text-stone-500">units</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openHistory(v.id, product.name, v)}
                          className="text-stone-700 hover:text-stone-900 font-medium underline"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      />

      {/* Confirm Dialog for Quantity Edit */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Stock Quantity Change"
        message={
          <div className="space-y-3">
            <p>
              You are updating quantity for <strong className="text-stone-900">{editingVariant?.variantName}</strong> from{' '}
              <span className="font-mono font-semibold">{editingVariant?.oldQty}</span> to{' '}
              <span className="font-mono font-semibold text-stone-900">{editingVariant?.newQty}</span>.
            </p>
            {editingVariant && editingVariant.heldUnits > 0 && editingVariant.newQty < editingVariant.heldUnits && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-md">
                ⚠️ Warning: {editingVariant.heldUnits} units are currently held in checkouts for this product.
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Reason for change (Required)
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g., Physical recount, returned items, etc."
                required
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
        }
        confirmLabel="Save Quantity"
        onConfirm={handleConfirmUpdate}
        onCancel={() => {
          setIsConfirmOpen(false);
          setEditingVariant(null);
        }}
      />

      {/* History Modal */}
      {historyVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-amber-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-bold text-stone-900">Variant History: {historyVariant.title}</h3>
              <button
                type="button"
                onClick={() => setHistoryVariant(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {historyLoading ? (
                <div className="text-center py-8 text-stone-500">Loading history...</div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-8 text-stone-500 italic">No history records found for this variant.</div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((item) => (
                    <div key={item.id} className="p-3 bg-stone-50 rounded-md border border-stone-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="font-semibold text-stone-700">{item.admin_name}</span>
                        <span>{formatIST(item.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-800 font-medium">
                        <span>Quantity changed:</span>
                        <span className="font-mono bg-stone-200 px-1.5 py-0.5 rounded">{item.old_quantity}</span>
                        <span>→</span>
                        <span className="font-mono bg-stone-200 px-1.5 py-0.5 rounded">{item.new_quantity}</span>
                      </div>
                      <div className="text-stone-600 italic">Reason: {item.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-200 text-right mt-4">
              <button
                type="button"
                onClick={() => setHistoryVariant(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
