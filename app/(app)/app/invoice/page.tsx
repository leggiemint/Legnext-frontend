"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useUser } from "@/contexts/UserContext";

export const dynamic = 'force-dynamic';

interface Invoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: number;
  due_date: number | null;
  period_start: number;
  period_end: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  subscription: string | null;
  billing_reason: string | null;
}


export default function InvoicePage() {
  const sessionData = useSession();
  const session = sessionData?.data;
  useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination] = useState<{
    limit: number;
    cursor?: string;
    hasNext: boolean;
  }>({
    limit: 20,
    cursor: undefined,
    hasNext: false
  });

  // 获取发票数据 - 所有用户都可以查看历史发票
  useEffect(() => {
    if (session?.user?.id) {
      fetchInvoices();
    }
  }, [session]);

  const fetchInvoices = async (cursor?: string) => {
    try {
      setLoading(cursor ? false : true); // 只在初始加载时显示loading
      setError(null);
      
      // Fetch from Stripe API
      const response = await fetch('/api/stripe/invoices?limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      
      // 过滤重复的发票 - 如果同一个订阅有多个相同日期的发票，只保留第一个
      const filteredInvoices = (data.invoices || []).filter((invoice: Invoice, index: number, arr: Invoice[]) => {
        // 如果是 subscription_create 类型的发票，检查是否有重复
        if (invoice.billing_reason === 'subscription_create') {
          // 查找是否有相同订阅和相同日期的其他发票
          const duplicate = arr.find((otherInvoice, otherIndex) => 
            otherIndex < index && 
            otherInvoice.subscription === invoice.subscription &&
            otherInvoice.created === invoice.created &&
            otherInvoice.billing_reason === 'subscription_create'
          );
          return !duplicate; // 如果没有重复，保留这个发票
        }
        return true; // 其他类型的发票都保留
      });
      
      if (!cursor) {
        // First load - replace invoices
        setInvoices(filteredInvoices);
      } else {
        // Pagination - append invoices (for future enhancement)
        setInvoices(prev => [...prev, ...filteredInvoices]);
      }
      
      
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
      open: {
        icon: ClockIcon,
        text: 'Open',
        className: 'bg-yellow-100 text-yellow-800'
      },
      void: {
        icon: InformationCircleIcon,
        text: 'Void',
        className: 'bg-gray-100 text-gray-800'
      },
      uncollectible: {
        icon: ExclamationCircleIcon,
        text: 'Uncollectible',
        className: 'bg-red-100 text-red-800'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Stripe amounts are in cents
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
                              Invoice #{invoice.id.slice(-8)}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>{formatDate(invoice.created)}</span>
                              {invoice.billing_reason && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{invoice.billing_reason.replace('_', ' ')}</span>
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
                            {formatAmount(invoice.amount_paid, invoice.currency)}
                          </div>
                          {invoice.amount_due > 0 && (
                            <div className="text-sm text-red-600">
                              Due: {formatAmount(invoice.amount_due, invoice.currency)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        {invoice.invoice_pdf && (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          >
                            Download PDF
                          </a>
                        )}
                        {invoice.period_start && invoice.period_end && (
                          <span className="text-sm text-gray-500">
                            Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // 暂无发票
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