'use client';

import { Page } from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <Page back={false}>
      <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
        <div className="container mx-auto px-4 py-8">
          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-pink-gradient mb-2">
              Pushups Tracker
            </h1>
            <p className="text-muted-foreground">
              Отслеживайте свой прогресс каждый день
            </p>
          </div>

          {/* Главная кнопка */}
          <div className="flex justify-center mb-8">
            <Button size="lg" className="bg-pink-gradient shadow-lg">
              <Activity className="mr-2" />
              Начать тренировку
            </Button>
          </div>

          {/* Карточки статистики */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Последняя тренировка
                </CardTitle>
                <CardDescription>Вчера в 19:30</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">85</p>
                <p className="text-sm text-muted-foreground">повторений</p>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Эта неделя
                </CardTitle>
                <CardDescription>3 из 4 тренировок</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">245</p>
                <p className="text-sm text-muted-foreground">повторений всего</p>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Прогресс
                </CardTitle>
                <CardDescription>За последний месяц</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">+15%</p>
                <p className="text-sm text-muted-foreground">рост результатов</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
