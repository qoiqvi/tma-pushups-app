'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTelegramInitData } from '@/lib/telegram/mock';
import { useUser } from '@/hooks/useUser';
import { useOverallStats } from '@/hooks/useStats';
import { useWorkouts } from '@/hooks/useWorkouts';
import { logger } from '@/lib/debug';

export default function DebugPage() {
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Хуки для проверки
  const { data: user, error: userError, isLoading: userLoading } = useUser();
  const { data: stats, error: statsError, isLoading: statsLoading } = useOverallStats();
  const { data: workouts, error: workoutsError, isLoading: workoutsLoading } = useWorkouts(1, 0);

  // Обновляем логи из глобального logger
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLogs(logger.getLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Детальная проверка окружения
    logger.info('=== DEBUG PAGE LOADED ===');
    logger.info(`URL: ${window.location.href}`);
    logger.info(`Hash: ${window.location.hash}`);
    logger.info(`Telegram WebApp available: ${!!window.Telegram?.WebApp}`);
    
    if (window.Telegram?.WebApp) {
      logger.info(`InitData present: ${!!window.Telegram.WebApp.initData}`);
      logger.info(`Version: ${window.Telegram.WebApp.version}`);
      logger.info(`Platform: ${window.Telegram.WebApp.platform}`);
    }
    
    // Проверяем initData
    const initData = getTelegramInitData();
    logger.info(`Final InitData length: ${initData.length}`);
    if (initData) {
      try {
        const params = new URLSearchParams(initData);
        logger.info('InitData params:', Object.fromEntries(params));
        const user = params.get('user');
        if (user) {
          const userData = JSON.parse(user);
          logger.info(`Parsed User ID: ${userData.id}`);
          logger.info(`Parsed User name: ${userData.first_name} ${userData.last_name || ''}`);
        }
      } catch (e) {
        logger.error(`Error parsing initData: ${e}`);
      }
    }
  }, []);

  // Логирование состояний хуков
  useEffect(() => {
    if (user) logger.info(`User loaded: ID=${user.telegramId}`);
    if (userError) logger.error(`User error: ${String(userError)}`);
  }, [user, userError]);

  useEffect(() => {
    if (stats) logger.info(`Stats loaded: workouts=${stats.total_workouts}, reps=${stats.total_reps}`);
    if (statsError) logger.error(`Stats error: ${String(statsError)}`);
  }, [stats, statsError]);

  useEffect(() => {
    if (workouts) logger.info(`Workouts loaded: count=${workouts.total}`);
    if (workoutsError) logger.error(`Workouts error: ${String(workoutsError)}`);
  }, [workouts, workoutsError]);

  const testAPI = async (endpoint: string) => {
    logger.info(`Testing ${endpoint}...`);
    try {
      const initData = getTelegramInitData();
      logger.info(`Sending InitData:`, { length: initData.length, preview: initData.substring(0, 50) + '...' });
      
      const response = await fetch(endpoint, {
        headers: {
          'X-Telegram-Init-Data': initData,
        },
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      logger.info(`${endpoint} - Status: ${response.status}`);
      setTestResult({ endpoint, status: response.status, data });
      
      if (!response.ok) {
        logger.error(`${endpoint} - Error: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      logger.error(`${endpoint} - Exception: ${error.message}`);
      setTestResult({ endpoint, error: error.message });
    }
  };

  const testAuthFlow = async () => {
    logger.info('Testing auth flow...');
    try {
      const initData = getTelegramInitData();
      logger.info('Testing with InitData:', { 
        length: initData.length,
        hasUser: initData.includes('user='),
        hasHash: initData.includes('hash=')
      });
      
      const response = await fetch('/api/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData,
        },
        body: JSON.stringify({ test: true })
      });
      
      const data = await response.json();
      logger.info('Auth test result:', data);
      setTestResult({ action: 'testAuth', data });
    } catch (error: any) {
      logger.error(`Auth test error: ${error.message}`);
    }
  };

  const checkServerEnv = async () => {
    logger.info('Checking server environment variables...');
    try {
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      logger.info('Server environment:', data.server_env);
      setTestResult({ action: 'checkServerEnv', data });
    } catch (error: any) {
      logger.error(`Check server env error: ${error.message}`);
    }
  };

  const createTestWorkout = async () => {
    logger.info('Creating test workout...');
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': getTelegramInitData(),
        },
        body: JSON.stringify({
          started_at: new Date().toISOString(),
          notes: 'Test workout from debug page'
        })
      });
      
      const data = await response.json();
      logger.info(`Workout created: ${response.ok ? 'Success' : 'Failed'}`);
      if (data.id) {
        logger.info(`Workout ID: ${data.id}`);
      }
      setTestResult({ action: 'createWorkout', status: response.status, data });
    } catch (error: any) {
      logger.error(`Create workout error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Статус подключений */}
          <div className="space-y-2">
            <h3 className="font-semibold">Connection Status</h3>
            <div className="text-sm space-y-1">
              <div>User: {userLoading ? '⏳' : user ? '✅' : '❌'} {userError ? String(userError) : ''}</div>
              <div>Stats: {statsLoading ? '⏳' : stats ? '✅' : '❌'} {statsError ? String(statsError) : ''}</div>
              <div>Workouts: {workoutsLoading ? '⏳' : workouts ? '✅' : '❌'} {workoutsError ? String(workoutsError) : ''}</div>
            </div>
          </div>

          {/* Данные пользователя */}
          {user && (
            <div className="space-y-2">
              <h3 className="font-semibold">User Data</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {/* URL информация */}
          <div className="space-y-2">
            <h3 className="font-semibold">URL Information</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify({
                href: typeof window !== 'undefined' ? window.location.href : 'N/A',
                hash: typeof window !== 'undefined' ? window.location.hash : 'N/A',
                hashParams: typeof window !== 'undefined' ? Object.fromEntries(new URLSearchParams(window.location.hash.slice(1))) : {},
                telegramWebApp: typeof window !== 'undefined' ? {
                  available: !!window.Telegram?.WebApp,
                  initData: window.Telegram?.WebApp?.initData?.substring(0, 50) + '...',
                  version: window.Telegram?.WebApp?.version,
                  platform: window.Telegram?.WebApp?.platform,
                } : 'N/A'
              }, null, 2)}
            </pre>
          </div>

          {/* Переменные окружения */}
          <div className="space-y-2">
            <h3 className="font-semibold">Environment Variables</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify({
                NODE_ENV: process.env.NODE_ENV,
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***HIDDEN***' : 'NOT SET',
                TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '***HIDDEN***' : 'NOT SET',
                CRON_SECRET: process.env.CRON_SECRET ? '***HIDDEN***' : 'NOT SET',
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
                NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
                NEXT_PUBLIC_BUILD_DATE: process.env.NEXT_PUBLIC_BUILD_DATE,
                VERCEL: process.env.VERCEL,
                VERCEL_ENV: process.env.VERCEL_ENV,
                VERCEL_URL: process.env.VERCEL_URL,
                VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
              }, null, 2)}
            </pre>
          </div>

          {/* Кнопки тестирования */}
          <div className="space-y-2">
            <h3 className="font-semibold">API Tests</h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={checkServerEnv} variant="destructive">
                Check Server ENV
              </Button>
              <Button size="sm" onClick={() => testAPI('/api/health')} variant="secondary">
                Health Check
              </Button>
              <Button size="sm" onClick={testAuthFlow} variant="outline">
                Test Auth Flow
              </Button>
              <Button size="sm" onClick={() => testAPI('/api/user/me')}>
                Test User API
              </Button>
              <Button size="sm" onClick={() => testAPI('/api/stats?period=all')}>
                Test Stats API
              </Button>
              <Button size="sm" onClick={() => testAPI('/api/workouts?limit=10')}>
                Test Workouts API
              </Button>
              <Button size="sm" onClick={createTestWorkout}>
                Create Test Workout
              </Button>
            </div>
          </div>

          {/* Результат последнего теста */}
          {testResult && (
            <div className="space-y-2">
              <h3 className="font-semibold">Last Test Result</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Логи */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">System Logs</h3>
              <Button size="sm" onClick={() => logger.clear()}>
                Clear Logs
              </Button>
            </div>
            <div className="bg-gray-900 text-white p-2 rounded h-64 overflow-auto font-mono text-xs">
              {systemLogs.map((log, i) => (
                <div key={i} className={
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'warn' ? 'text-yellow-400' : 
                  'text-green-400'
                }>
                  [{log.timestamp.split('T')[1].split('.')[0]}] {log.level.toUpperCase()}: {log.message}
                  {log.data && (
                    <div className="ml-4 text-gray-400">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}