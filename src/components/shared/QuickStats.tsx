import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface QuickStatsProps {
  stats: StatItem[];
}

export function QuickStats({ stats }: QuickStatsProps) {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400';
      case 'green':
        return 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'red':
        return 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400';
      case 'purple':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);

        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
              <CardTitle className="text-xs font-medium truncate pr-2">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 rounded-lg ${colorClasses} flex-shrink-0`}>
                <Icon className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold truncate">{stat.value}</div>
              {stat.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {stat.description}
                </p>
              )}
              {stat.trend && (
                <div className="flex items-center mt-1">
                  <span
                    className={`text-[10px] font-medium ${
                      stat.trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1 truncate">
                    vs mes anterior
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


