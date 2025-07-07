'use client';

import { useEffect, useState } from 'react';
import { getRawInitData } from '@/lib/telegram/init';
import { getAuthHeaders } from '@/lib/auth/client';

export default function TestAuthFlowPage() {
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const testResults: any = {};

    // Test 1: Get raw init data
    const rawInitData = getRawInitData();
    testResults.rawInitData = rawInitData;
    
    // Test 2: Get auth headers
    const authHeaders = getAuthHeaders();
    testResults.authHeaders = authHeaders;

    // Test 3: Simple API call
    try {
      const response = await fetch('/api/test-auth-simple', {
        headers: authHeaders,
      });
      const data = await response.json();
      testResults.simpleApiCall = {
        status: response.status,
        data,
      };
    } catch (error) {
      testResults.simpleApiCall = { error: String(error) };
    }

    // Test 4: Stats API call
    try {
      const response = await fetch('/api/stats?period=all', {
        headers: authHeaders,
      });
      const data = await response.json();
      testResults.statsApiCall = {
        status: response.status,
        data,
      };
    } catch (error) {
      testResults.statsApiCall = { error: String(error) };
    }

    // Test 5: Check window.Telegram
    testResults.windowTelegram = {
      exists: typeof window !== 'undefined' && !!window.Telegram,
      webApp: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
      initData: typeof window !== 'undefined' && window.Telegram?.WebApp?.initData,
      initDataUnsafe: typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe,
    };

    // Test 6: Check URL hash
    testResults.urlHash = typeof window !== 'undefined' ? window.location.hash : null;

    // Test 7: Check session storage
    testResults.sessionStorage = typeof window !== 'undefined' ? sessionStorage.getItem('__telegram__initData') : null;

    setResults(testResults);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication Flow Test</h1>
      
      <div className="space-y-4">
        {Object.entries(results).map(([key, value]) => (
          <div key={key} className="border rounded p-4">
            <h2 className="font-semibold mb-2">{key}</h2>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <button
        onClick={runTests}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Re-run Tests
      </button>
    </div>
  );
}