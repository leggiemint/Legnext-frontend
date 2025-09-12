"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useBackendApiKeys } from '@/hooks/useBackendSWR';

interface BackendApiKey {
  id: number;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
  revoked: boolean;
  account_id: number;
  isInitKey?: boolean; // Flag to identify the initial API key
}

const ApiKeysPage = () => {
  const { data: session, status } = useSession();
  const [creating, setCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [revoking, setRevoking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKeys, setNewlyCreatedKeys] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'generate' | 'fetch'>('generate');
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'nodejs' | 'python' | 'php'>('curl');

  // 使用SWR从backend系统获取API keys
  const { apiKeys, loading, error: backendError, refresh } = useBackendApiKeys();

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  // 合并错误状态
  const displayError = error || backendError;

  // 创建API Key (backend系统)
  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newKeyName.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewKey(data.apiKey.value);
        setNewKeyName(''); // 清空输入框
        // 标记新创建的key
        setNewlyCreatedKeys(prev => new Set(prev).add(data.apiKey.id));
        refresh(); // 刷新SWR缓存
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

  // 撤销API Key (backend系统)
  const revokeApiKey = async (keyId: number, keyName: string) => {
    if (!confirm(`This will permanently revoke "${keyName}". Continue?`)) {
      return;
    }

    setRevoking(keyId);
    setError(null);
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}/revoke`, {
        method: 'POST',
      });

      if (response.ok) {
        refresh(); // 刷新SWR缓存
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
  const copyToClipboard = async (key: string, keyId: number) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(prev => ({ ...prev, [keyId]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [keyId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy. Please copy manually.');
    }
  };


  // 隐藏API key的显示值
  const maskApiKey = (value: string | null | undefined) => {
    if (!value || typeof value !== 'string') return 'N/A';
    if (value.length <= 8) return value;
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  };

  // 使用占位符让用户自己填入API key
  const getPlaceholderApiKey = () => {
    return 'your-api-key-here';
  };

  // 生成示例代码
  const generateSampleCode = () => {
    const apiKey = getPlaceholderApiKey();
    
    if (activeTab === 'generate') {
      switch (selectedLanguage) {
        case 'curl':
          return `curl --location 'https://api.legnext.ai/api/v1/diffusion' \\
--header 'x-api-key: ${apiKey}' \\
--header 'Content-Type: application/json' \\
--data '{
    "text": "A beautiful sunset over the snow mountains --v 7 --draft",
    "callback": "https://webhook.site/your-webhook-url"
}'`;
        case 'nodejs':
          return `// Node.js (fetch API)
import fetch from "node-fetch";

const url = "https://api.legnext.ai/api/v1/diffusion";
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
  },
  body: JSON.stringify({
    text: "A beautiful sunset over the snow mountains --v 7 --draft",
    // Optional:
    // callback: "https://webhook.site/your-webhook-url"
  })
});

if (!res.ok) {
  console.error("Request failed:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log("task_id:", data.task_id); // Use this with /fetch`;
        case 'python':
          return `# Python (requests)
import requests
import json

url = "https://api.legnext.ai/api/v1/diffusion"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
}
data = {
    "text": "A beautiful sunset over the snow mountains --v 7 --draft",
    # Optional:
    # "callback": "https://webhook.site/your-webhook-url"
}

response = requests.post(url, headers=headers, json=data)

if response.status_code != 200:
    print(f"Request failed: {response.status_code} {response.text}")
    exit(1)

result = response.json()
print(f"task_id: {result['task_id']}")  # Use this with /fetch`;
        case 'php':
          return `<?php
// PHP (cURL)
$url = "https://api.legnext.ai/api/v1/diffusion";
$headers = [
    "Content-Type: application/json",
    "x-api-key: ${apiKey}"
];
$data = [
    "text" => "A beautiful sunset over the snow mountains --v 7 --draft",
    // Optional:
    // "callback" => "https://webhook.site/your-webhook-url"
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode != 200) {
    echo "Request failed: $httpCode $response";
    exit(1);
}

$result = json_decode($response, true);
echo "task_id: " . $result['task_id']; // Use this with /fetch
?>`;
        default:
          return '';
      }
    } else {
      // Fetch result examples
      switch (selectedLanguage) {
        case 'curl':
          return `curl --location 'https://api.legnext.ai/api/v1/job/your-job-id' \\
--header 'x-api-key: ${apiKey}'`;
        case 'nodejs':
          return `// Node.js (fetch API)
import fetch from "node-fetch";

const jobId = "your-job-id";
const url = "https://api.legnext.ai/api/v1/job/" + jobId;
const res = await fetch(url, {
  method: "GET",
  headers: {
    "x-api-key": "${apiKey}"
  }
});

if (!res.ok) {
  console.error("Request failed:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log("Job status:", data.status);
console.log("Result:", data);`;
        case 'python':
          return `# Python (requests)
import requests

job_id = "your-job-id"
url = f"https://api.legnext.ai/api/v1/job/{job_id}"
headers = {
    "x-api-key": "${apiKey}"
}

response = requests.get(url, headers=headers)

if response.status_code != 200:
    print(f"Request failed: {response.status_code} {response.text}")
    exit(1)

result = response.json()
print(f"Job status: {result['status']}")
print(f"Result: {result}")`;
        case 'php':
          return `<?php
// PHP (cURL)
$jobId = "your-job-id";
$url = "https://api.legnext.ai/api/v1/job/" . $jobId;
$headers = [
    "x-api-key: ${apiKey}"
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode != 200) {
    echo "Request failed: $httpCode $response";
    exit(1);
}

$result = json_decode($response, true);
echo "Job status: " . $result['status'];
echo "Result: " . print_r($result, true);
?>`;
        default:
          return '';
      }
    }
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
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Error</h3>
              <p className="text-sm text-gray-600">{displayError}</p>
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
                  setCopied(prev => ({ ...prev, 'new-key': true }));
                  setTimeout(() => setCopied(prev => ({ ...prev, 'new-key': false })), 2000);
                }}
              >
                {copied['new-key'] ? '✓ Copied' : 'Copy'}
              </button>
              <button 
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setShowNewKey(null);
                  setNewlyCreatedKeys(new Set()); // 清除新创建key的状态
                }}
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
          </div>

          {/* Create New API Key Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-3">Create New API Key</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter API key name..."
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={creating}
              />
              <button
                className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={createApiKey}
                disabled={creating || !newKeyName.trim()}
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
              {apiKeys.map((apiKey: BackendApiKey) => (
                <div key={apiKey.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <div className="flex gap-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          apiKey.revoked 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {apiKey.revoked ? 'Revoked' : 'Active'}
                        </div>
                      </div>
                    </div>
                    {!apiKey.revoked && !apiKey.isInitKey && (
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
                    {apiKey.isInitKey && (
                      <div className="px-3 py-1 bg-gray-200 text-gray-500 rounded-md text-sm cursor-not-allowed">
                        Cannot Revoke
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm break-all border border-gray-700 mb-3">
                    {apiKey.revoked ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : maskApiKey(apiKey.value)}
                  </div>
                  
                  {!apiKey.revoked && (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {apiKey.isInitKey ? 'Initial API key - cannot be revoked' : 'API key created'}
                      </div>
                      {/* 只在showNewKey状态且是新创建的key时显示copy按钮 */}
                      {showNewKey && newlyCreatedKeys.has(apiKey.id) && (
                        <button
                          className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
                          onClick={() => copyToClipboard(apiKey.value, apiKey.id)}
                          title="Copy API key"
                        >
                          {copied[apiKey.id] ? (
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
                      )}
                    </div>
                  )}
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Usage Examples */}
      {apiKeys.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200 mt-8">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="card-title text-lg">API Usage Examples</h2>
              <div className="text-sm text-gray-500">
                Don&apos;t forget to replace <code className="bg-gray-100 px-1 rounded">&lt;api_key&gt;</code> with your actual API key.
              </div>
            </div>

            {/* Action Tabs */}
            <div className="flex gap-1 mb-4">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'generate'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('generate')}
              >
                Generate 4 images using /Imagine
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'fetch'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab('fetch')}
              >
                Fetch the Result using /Fetch
              </button>
            </div>

            {/* Language Tabs */}
            <div className="flex gap-1 mb-4">
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'curl'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedLanguage('curl')}
              >
                CURL
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'nodejs'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedLanguage('nodejs')}
              >
                Node.js
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'python'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedLanguage('python')}
              >
                Python
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLanguage === 'php'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedLanguage('php')}
              >
                PHP
              </button>
            </div>

            {/* Code Example */}
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  {selectedLanguage === 'curl' ? 'cURL' : 
                   selectedLanguage === 'nodejs' ? 'Node.js' :
                   selectedLanguage === 'python' ? 'Python' : 'PHP'}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedLanguage === 'curl' ? 'example.sh' :
                   selectedLanguage === 'nodejs' ? 'example.js' :
                   selectedLanguage === 'python' ? 'example.py' : 'example.php'}
                </span>
              </div>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(generateSampleCode());
                    setCopied(prev => ({ ...prev, 'sample-code': true }));
                    setTimeout(() => setCopied(prev => ({ ...prev, 'sample-code': false })), 2000);
                  }}
                  title="Copy code"
                >
                  {copied['sample-code'] ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  )}
                </button>
              </div>
              <div className="p-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{generateSampleCode()}</code>
                </pre>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;