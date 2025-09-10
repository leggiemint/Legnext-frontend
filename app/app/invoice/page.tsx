"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, CalendarIcon, CurrencyDollarIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { usePlan } from "@/contexts/UserContext";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'canceled';
  description: string;
  paymentMethod?: string;
  items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  metadata?: {
    planName?: string;
    credits?: number;
    gateway?: string;
  };
}

interface InvoiceResponse {
  invoices: Invoice[];
  pagination: {
    limit: number;
    cursor?: string;
    hasNext: boolean;
  };
  summary: {
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalAmount: number;
    lastInvoiceDate: string | null;
  };
}

export default function InvoicePage() {
  const { data: session } = useSession();
  const { isProUser, plan } = usePlan();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    limit: number;
    cursor?: string;
    hasNext: boolean;
  }>({
    limit: 20,
    cursor: undefined,
    hasNext: false
  });
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    totalAmount: 0,
    lastInvoiceDate: null as string | null
  });

  // 获取发票数据
  useEffect(() => {
    if (session?.user?.id) {
      // 只有Pro用户（当前或曾经）才获取发票数据
      if (isProUser || plan === 'pro') {
        fetchInvoices();
      } else {
        setLoading(false);
      }
    }
  }, [session, isProUser, plan]);

  const fetchInvoices = async (cursor?: string) => {
    try {
      setLoading(cursor ? false : true); // 只在初始加载时显示loading
      setError(null);
      
      // Fetch from Stripe API only
      const response = await fetch('/api/stripe/invoices?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data: InvoiceResponse = await response.json();
      
      if (!cursor) {
        // First load - replace invoices
        setInvoices(data.invoices);
      } else {
        // Pagination - append invoices (for future enhancement)
        setInvoices(prev => [...prev, ...data.invoices]);
      }
      
      setPagination(data.pagination);
      setSummary(data.summary);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: {
        icon: CheckCircleIcon,
        text: 'Paid',
        className: 'bg-green-100 text-green-800'
      },
      pending: {
        icon: ClockIcon,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800'
      },
      failed: {
        icon: ExclamationCircleIcon,
        text: 'Failed',
        className: 'bg-red-100 text-red-800'
      },
      canceled: {
        icon: InformationCircleIcon,
        text: 'Canceled',
        className: 'bg-gray-100 text-gray-800'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // 免费用户且从未有过Pro计划
  if (!session) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your invoices.</p>
        </div>
      </div>
    );
  }

  // 免费用户且从未有过Pro计划 - 符合行业标准的做法
  if (!isProUser && plan === 'free') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
          <p className="text-gray-600 mb-8">Your billing history and invoices</p>
          
          {/* 免费用户空状态 - 行业标准做法 */}
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
            <p className="text-gray-600 mb-6">
              Invoices will appear here when you subscribe to a paid plan.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">Your billing history and payment invoices</p>
          </div>
          <button
            onClick={() => fetchInvoices()}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Refresh
          </button>
        </div>


        {/* Summary Cards */}
        {!loading && invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.totalInvoices}</p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Paid Invoices</h3>
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{summary.paidInvoices}</p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {formatAmount(summary.totalAmount)}
              </p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">Last Invoice</h3>
                <CalendarIcon className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {summary.lastInvoiceDate ? formatDate(summary.lastInvoiceDate) : 'None'}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border shadow-sm p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your invoices...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Invoices</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoices List */}
        {!loading && !error && (
          <>
            {invoices.length > 0 ? (
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Invoice History
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {invoice.description}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>{formatDate(invoice.date)}</span>
                              {invoice.paymentMethod && (
                                <>
                                  <span>•</span>
                                  <span>{invoice.paymentMethod}</span>
                                </>
                              )}
                              <span>•</span>
                              {getStatusBadge(invoice.status)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Stripe
                            </span>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatAmount(invoice.amount, invoice.currency)}
                          </div>
                          {invoice.metadata?.credits && (
                            <div className="text-sm text-gray-500">
                              {invoice.metadata.credits.toLocaleString()} credits
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice Items */}
                      {invoice.items.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                          <div className="space-y-1">
                            {invoice.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.description}
                                  {item.quantity && item.quantity > 1 && ` (×${item.quantity})`}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {formatAmount(item.amount, invoice.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // 有Pro计划但暂无发票
              <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Found</h3>
                <p className="text-gray-600">
                  Your payment history will appear here once you have completed transactions.
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination.hasNext && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchInvoices(pagination.cursor)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Load More Invoices
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}