'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

// Это ваши данные из URL
const TELEGRAM_DATA = 'user=%7B%22id%22%3A693920846%2C%22first_name%22%3A%22%D0%94%D0%B8%D0%BC%D0%B0%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22amasasin%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2Fo01N7o56ywaFI-vEQwOEuZWMNgQLpKU4kKcOm1KsofI.svg%22%7D&chat_instance=1541822198052251267&chat_type=private&auth_date=1751629989&signature=NDo3mxqE9sNdDXe6NimoRDTBEmGe378QX4pTf2RZw1UlRergroMX93iKmxh_nMf773Y-mVHLUQ07EM95I1MNDA&hash=a8c1a6f1d1079ea80d8e89dbb171f764da46a1f58e0694f68614b914f4038378';

export default function SaveDataPage() {
  const router = useRouter();

  useEffect(() => {
    // Автоматически сохраняем при загрузке
    const decoded = decodeURIComponent(TELEGRAM_DATA);
    sessionStorage.setItem('telegram_init_data', decoded);
    console.log('Saved Telegram data:', decoded);
  }, []);

  const saveData = () => {
    const decoded = decodeURIComponent(TELEGRAM_DATA);
    sessionStorage.setItem('telegram_init_data', decoded);
    localStorage.setItem('telegram_init_data_backup', decoded);
    alert('Данные сохранены! Теперь можете вернуться на главную.');
  };

  const clearData = () => {
    sessionStorage.removeItem('telegram_init_data');
    localStorage.removeItem('telegram_init_data_backup');
    alert('Данные очищены!');
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Сохранить Telegram данные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Эта страница сохранит ваши Telegram данные в браузере для тестирования.
          </p>
          
          <div className="space-y-2">
            <Button onClick={saveData} className="w-full">
              Сохранить данные
            </Button>
            <Button onClick={clearData} variant="destructive" className="w-full">
              Очистить данные
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              На главную
            </Button>
            <Button onClick={() => router.push('/debug')} variant="outline" className="w-full">
              Debug страница
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Сохраненные данные:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {decodeURIComponent(TELEGRAM_DATA)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}