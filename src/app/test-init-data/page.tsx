'use client';

import { useEffect, useState } from 'react';
import { getRawInitData, getTelegramUser } from '@/lib/telegram/init';
import { getAuthHeaders } from '@/lib/auth/client';

export default function TestInitDataPage() {
  const [initData, setInitData] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [headers, setHeaders] = useState<any>({});
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    // Get init data
    const rawData = getRawInitData();
    setInitData(rawData);

    // Get user
    const telegramUser = getTelegramUser();
    setUser(telegramUser);

    // Get headers
    const authHeaders = getAuthHeaders();
    setHeaders(authHeaders);
  }, []);

  const testAPI = async () => {
    try {
      const response = await fetch('/api/stats?period=all', {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      setTestResult({
        status: response.status,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Init Data Test</h1>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Raw Init Data:</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
          {initData || 'null'}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Telegram User:</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Auth Headers:</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
          {JSON.stringify(headers, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Window.Telegram:</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
          {typeof window !== 'undefined' ? JSON.stringify({
            exists: !!window.Telegram,
            webApp: !!window.Telegram?.WebApp,
            initData: window.Telegram?.WebApp?.initData ? 'present' : 'missing',
            initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe
          }, null, 2) : 'SSR'}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">URL Hash:</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
          {typeof window !== 'undefined' ? window.location.hash : 'SSR'}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Session Storage:</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
          {typeof window !== 'undefined' ? sessionStorage.getItem('__telegram__initData') || 'null' : 'SSR'}
        </pre>
      </div>

      <div className="space-y-2">
        <button 
          onClick={testAPI}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test API Call
        </button>
        
        {testResult && (
          <div>
            <h2 className="text-xl font-semibold">API Test Result:</h2>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}