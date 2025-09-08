"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  goApiKey: string;
  preview: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const ApiKeysPage = () => {
  const { data: session, status } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  // 从本地数据库加载API Keys（行业标准）
  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data.apiKeys || []);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to fetch API keys');
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchApiKeys();
    }
  }, [session]);

  // 创建API Key
  const createApiKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `API Key - ${new Date().toLocaleDateString()}` 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewKey(data.data.apiKey.fullValue);
        await fetchApiKeys();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // 撤销API Key
  const revokeApiKey = async (keyId: string, keyName: string) => {
    if (!confirm(`This will permanently revoke "${keyName}". Continue?`)) {
      return;
    }

    setRevoking(keyId);
    setError(null);
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchApiKeys();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to revoke API key');
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      setError('Network error. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy. Please copy manually.');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
        <p className="text-gray-600">
          Manage your API keys for accessing the Legnext Midjourney API.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Error</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
            <button 
              className="text-red-400 hover:text-red-600 transition-colors"
              onClick={() => setError(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* New API Key Alert */}
      {showNewKey && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-800 mb-1">API Key Generated!</h3>
              <p className="text-sm text-gray-600 mb-3">Copy this key now - it won&apos;t be shown again.</p>
              <div className="bg-gray-900 text-purple-400 p-3 rounded-lg font-mono text-sm break-all border border-gray-700">
                {showNewKey}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button 
                className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(showNewKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button 
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                onClick={() => setShowNewKey(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Management */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <h2 className="card-title text-lg">API Keys</h2>
            <button
              className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={createApiKey}
              disabled={creating}
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create API Key'
              )}
            </button>
          </div>
          
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 14.5l-1.257-1.257A6 6 0 0114 7m-4 0a2 2 0 00-2 2m0 0a6 6 0 007.743 5.743L17.5 11l-1.257 1.257A6 6 0 0110 7z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6 text-lg">No API keys yet</p>
              <p className="text-sm text-gray-500">Create your first API key to start using the Legnext Midjourney API.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        !apiKey.isActive 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {!apiKey.isActive ? 'Revoked' : 'Active'}
                      </div>
                    </div>
                    {apiKey.isActive && (
                      <button
                        className={`px-3 py-1 border border-red-600 text-red-600 rounded-md text-sm hover:bg-red-600 hover:text-white transition-colors ${
                          revoking === apiKey.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => revokeApiKey(apiKey.id, apiKey.name)}
                        disabled={revoking === apiKey.id}
                        title="Revoke API key"
                      >
                        {revoking === apiKey.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Revoking...
                          </>
                        ) : (
                          'Revoke'
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm break-all border border-gray-700 mb-3">
                    {!apiKey.isActive ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : apiKey.preview}
                  </div>
                  
                  {apiKey.isActive && (
                    <div className="flex justify-end">
                      <button
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                        onClick={() => copyToClipboard(apiKey.goApiKey)}
                        title="Copy full API key"
                      >
                        {copied ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t border-gray-300">
                    <span>Created: {formatDate(apiKey.createdAt)}</span>
                    <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeysPage;