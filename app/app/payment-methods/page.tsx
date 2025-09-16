"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import AddPaymentMethodModal from "@/components/AddPaymentMethodModal";

export const dynamic = 'force-dynamic';

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
    country: string;
  } | null;
  created: number;
}

interface GroupedPaymentMethod {
  key: string;
  methods: PaymentMethod[];
  card: PaymentMethod['card'];
  mostRecentId: string;
  createdAt: number;
}

export default function PaymentMethodsPage() {
  const { data: session } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/stripe/payment-methods');
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Load payment methods when component mounts
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Handle payment method deletion
  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      setDeletingId(paymentMethodId);

      // Find the group that contains this payment method
      const group = groupedPaymentMethods.find(g =>
        g.methods.some(m => m.id === paymentMethodId)
      );

      if (group) {
        // Delete all methods in this group (handles both single and duplicate cards)
        const deletePromises = group.methods.map(method =>
          fetch(`/api/stripe/payment-methods?paymentMethodId=${method.id}`, {
            method: 'DELETE',
          })
        );

        const responses = await Promise.all(deletePromises);

        // Track successful and failed deletions
        const results = await Promise.all(
          responses.map(async (response, index) => ({
            response,
            methodId: group.methods[index].id,
            success: response.ok,
            error: response.ok ? null : await response.json().catch(() => ({ error: 'Unknown error' }))
          }))
        );

        const successfulDeletions = results.filter(r => r.success);
        const failedDeletions = results.filter(r => !r.success);

        if (failedDeletions.length > 0) {
          // Some deletions failed
          console.error('❌ Some payment method deletions failed:', failedDeletions);

          if (successfulDeletions.length > 0) {
            toast.error(
              `Partially completed: ${successfulDeletions.length} removed, ${failedDeletions.length} failed`
            );
          } else {
            throw new Error(failedDeletions[0].error?.error || 'Failed to remove payment method');
          }
        } else {
          // All deletions successful
          const message = group.methods.length > 1
            ? `Removed ${group.methods.length} duplicate payment methods`
            : 'Payment method removed successfully';
          toast.success(message);
        }
      } else {
        throw new Error('Payment method not found');
      }

      await fetchPaymentMethods();
      setShowDeleteModal(null);
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      toast.error(error.message || 'Failed to remove payment method');
    } finally {
      setDeletingId(null);
    }
  };

  // Group payment methods by brand and last4
  const groupPaymentMethods = (methods: PaymentMethod[]): GroupedPaymentMethod[] => {
    const groups = new Map<string, PaymentMethod[]>();

    methods.forEach(method => {
      if (method.card) {
        const key = `${method.card.brand}-${method.card.last4}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(method);
      }
    });

    return Array.from(groups.entries()).map(([key, methods]) => {
      // Sort by creation date, most recent first
      const sortedMethods = methods.sort((a, b) => b.created - a.created);
      const mostRecent = sortedMethods[0];

      return {
        key,
        methods: sortedMethods,
        card: mostRecent.card,
        mostRecentId: mostRecent.id,
        createdAt: mostRecent.created,
      };
    }).sort((a, b) => b.createdAt - a.createdAt); // Sort groups by most recent
  };

  // Get card brand display name and styling
  const getCardBrandInfo = (brand: string) => {
    const brandMap: Record<string, { name: string; color: string }> = {
      visa: { name: 'Visa', color: 'text-blue-600' },
      mastercard: { name: 'Mastercard', color: 'text-red-600' },
      amex: { name: 'American Express', color: 'text-green-600' },
      discover: { name: 'Discover', color: 'text-orange-600' },
      diners: { name: 'Diners Club', color: 'text-purple-600' },
      jcb: { name: 'JCB', color: 'text-blue-500' },
      unionpay: { name: 'Union Pay', color: 'text-red-500' },
    };

    return brandMap[brand] || { name: brand.toUpperCase(), color: 'text-gray-600' };
  };

  const groupedPaymentMethods = groupPaymentMethods(paymentMethods);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 pt-8 pb-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
          <p className="text-gray-600">Manage your saved payment methods for subscriptions and purchases.</p>
        </div>

        {/* Add Payment Method Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            Add Payment Method
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-50 rounded-lg p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods List */}
        {!loading && session && (
          <div className="space-y-4">
            {groupedPaymentMethods.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
                <p className="text-gray-600">Add a payment method to get started with subscriptions and purchases.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {groupedPaymentMethods.map((group) => {
                  const brandInfo = getCardBrandInfo(group.card?.brand || '');
                  return (
                    <div
                      key={group.key}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <CreditCardIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className={`font-semibold ${brandInfo.color}`}>
                                {brandInfo.name}
                              </span>
                              <span className="text-gray-600">
                                •••• {group.card?.last4}
                              </span>
                              <span className="text-sm text-gray-500">
                                {group.card?.exp_month}/{group.card?.exp_year}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500 capitalize">
                                {group.card?.funding} card
                              </span>
                              {group.card?.country && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <span className="text-sm text-gray-500">
                                    {group.card.country.toUpperCase()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowDeleteModal(group.mostRecentId)}
                            disabled={deletingId === group.mostRecentId}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove payment method"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Payment Method Modal */}
        {showAddModal && (
          <AddPaymentMethodModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchPaymentMethods();
              toast.success('Payment method added successfully!');
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (() => {
          const group = groupedPaymentMethods.find(g =>
            g.methods.some(m => m.id === showDeleteModal)
          );
          const brandInfo = getCardBrandInfo(group?.card?.brand || '');

          return (
            <div className="fixed inset-0 z-[60] overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                  onClick={() => !deletingId && setShowDeleteModal(null)}
                />

                {/* Modal */}
                <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Remove Payment Method
                      </h3>
                    </div>
                    {!deletingId && (
                      <button
                        onClick={() => setShowDeleteModal(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <div className="space-y-3">
                      {group && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-gray-800">
                            <CreditCardIcon className="w-4 h-4" />
                            <span className="font-medium">
                              {brandInfo.name} •••• {group.card?.last4}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        Are you sure you want to remove this payment method? This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(null)}
                      disabled={!!deletingId}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeletePaymentMethod(showDeleteModal)}
                      disabled={!!deletingId}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deletingId === showDeleteModal ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Removing...
                        </>
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}