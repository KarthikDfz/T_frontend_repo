
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Book, 
  BarChart3, 
  Database, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const stats = [
  {
    title: 'Total Workbooks',
    value: '0',
    subtitle: '0 published, 0 unpublished',
    icon: Book,
    trend: '0%',
    color: 'text-blue-500'
  },
  {
    title: 'Total Dashboards',
    value: '0',
    subtitle: 'Across all workbooks',
    icon: BarChart3,
    trend: '0%',
    color: 'text-green-500'
  },
  {
    title: 'Data Sources',
    value: '0',
    subtitle: '0 live, 0 extracts',
    icon: Database,
    trend: '0%',
    color: 'text-purple-500'
  },
  {
    title: 'Migration Progress',
    value: '0%',
    subtitle: '0 completed, 0 pending',
    icon: Activity,
    trend: '0%',
    color: 'text-primary'
  }
];

const migrationStatus = [
  { label: 'Completed', value: 0, color: 'bg-green-500' },
  { label: 'In Progress', value: 0, color: 'bg-primary' },
  { label: 'Pending', value: 0, color: 'bg-gray-400' }
];

export const DashboardCards: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card glass-card-dark border-0 transition-apple hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-sf-pro">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Migration Status and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Migration Status */}
        <Card className="glass-card glass-card-dark border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Migration Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationStatus.map((status) => (
              <div key={status.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{status.label}</span>
                  <span className="font-medium">{status.value}%</span>
                </div>
                <Progress value={status.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card glass-card-dark border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Migration Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Sales Dashboard migrated',
                  time: '2 minutes ago',
                  status: 'success',
                  icon: CheckCircle
                },
                {
                  action: 'Financial Workbook validation',
                  time: '15 minutes ago',
                  status: 'warning',
                  icon: AlertTriangle
                },
                {
                  action: 'HR Analytics completed',
                  time: '1 hour ago',
                  status: 'success',
                  icon: CheckCircle
                },
                {
                  action: 'Customer Data source mapping',
                  time: '2 hours ago',
                  status: 'progress',
                  icon: Clock
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-apple hover:bg-muted/50">
                  <activity.icon className={`h-4 w-4 ${
                    activity.status === 'success' ? 'text-green-500' :
                    activity.status === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
