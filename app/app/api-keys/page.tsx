"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

const ApiKeysPage = () => {
  const { data: session, status } = useSession();
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [fullApiKey, setFullApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  // 加载API Key (只取第一个活跃的)
  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const data = await response.json();
        const activeKey = data.keys?.find((key: ApiKey) => key.isActive);
        setApiKey(activeKey || null);
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchApiKey();
    }
  }, [session]);

  // 创建API Key
  const createApiKey = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Key' }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewKey(data.key.key);
        await fetchApiKey();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create API key'}`);
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // 重新生成API Key
  const rotateApiKey = async () => {
    if (!confirm('This will generate a new API key and invalidate the current one. Continue?')) {
      return;
    }

    setRotating(true);
    try {
      // 先删除旧的
      if (apiKey) {
        await fetch(`/api/user/api-keys/${apiKey.id}`, { method: 'DELETE' });
      }
      
      // 创建新的
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Key' }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewKey(data.key.key);
        await fetchApiKey();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to rotate API key'}`);
      }
    } catch (error) {
      console.error('Failed to rotate API key:', error);
      alert('Network error. Please try again.');
    } finally {
      setRotating(false);
    }
  };

  // 获取完整API密钥
  const getFullApiKey = async () => {
    if (!apiKey) return;
    
    try {
      const response = await fetch(`/api/user/api-keys/${apiKey.id}/full`);
      if (response.ok) {
        const data = await response.json();
        setFullApiKey(data.key);
        return data.key;
      } else {
        throw new Error('Failed to get full API key');
      }
    } catch (error) {
      console.error('Failed to get full API key:', error);
      alert('Failed to get full API key. Please rotate to get a new one.');
      return null;
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      let keyToCopy = fullApiKey;
      
      // 如果没有完整密钥，先获取
      if (!keyToCopy) {
        keyToCopy = await getFullApiKey();
      }
      
      if (keyToCopy) {
        await navigator.clipboard.writeText(keyToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy. Please copy manually.');
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Key</h1>
        <p className="text-gray-600">
          Your API key for accessing the Legnext Midjourney API.
        </p>
      </div>

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

      {/* API Key Card */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          {apiKey ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-lg">Your API Key</h2>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                  Active
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all pr-4 text-gray-800">
                    {apiKey.key}
                  </code>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <button
                      className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                      onClick={copyToClipboard}
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
                          Copy Full
                        </>
                      )}
                    </button>
                    <button
                      className="px-3 py-1 border border-purple-600 text-purple-600 rounded-md text-sm hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1"
                      onClick={rotateApiKey}
                      disabled={rotating}
                      title="Generate new API key"
                    >
                      {rotating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Rotating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                          Rotate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Created: {formatDate(apiKey.createdAt)}</span>
                <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 14.5l-1.257-1.257A6 6 0 0114 7m-4 0a2 2 0 00-2 2m0 0a6 6 0 007.743 5.743L17.5 11l-1.257 1.257A6 6 0 0110 7z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6 text-lg">No API key yet</p>
              <button
                className={`px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  'Generate API Key'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeysPage;