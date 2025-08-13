'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  GlobeAltIcon,
  ClockIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface SystemStatus {
  zeek: 'healthy' | 'unhealthy' | 'unknown';
  splunk: 'healthy' | 'unhealthy' | 'unknown';
  processor: 'healthy' | 'unhealthy' | 'unknown';
}

interface DashboardStats {
  totalEvents: number;
  uniqueIPs: number;
  topProtocols: Array<{ protocol: string; count: number }>;
  recentAlerts: Array<{ id: string; message: string; severity: string; timestamp: string }>;
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    zeek: 'unknown',
    splunk: 'unknown',
    processor: 'unknown'
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    uniqueIPs: 0,
    topProtocols: [],
    recentAlerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
    loadDashboardStats();
    const interval = setInterval(() => {
      checkSystemStatus();
      loadDashboardStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check processor health
      const processorResponse = await axios.get('/api/processor/health');
      setSystemStatus(prev => ({
        ...prev,
        processor: processorResponse.data.status === 'healthy' ? 'healthy' : 'unhealthy'
      }));
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, processor: 'unhealthy' }));
    }

    // For demo purposes, set other services as healthy
    setSystemStatus(prev => ({
      ...prev,
      zeek: 'healthy',
      splunk: 'healthy'
    }));
  };

  const loadDashboardStats = async () => {
    // Mock data for demonstration
    setStats({
      totalEvents: 1247,
      uniqueIPs: 89,
      topProtocols: [
        { protocol: 'TCP', count: 856 },
        { protocol: 'UDP', count: 234 },
        { protocol: 'ICMP', count: 157 }
      ],
      recentAlerts: [
        { id: '1', message: 'Suspicious connection to external IP', severity: 'medium', timestamp: '2024-01-20T10:30:00Z' },
        { id: '2', message: 'High volume of DNS queries', severity: 'low', timestamp: '2024-01-20T10:25:00Z' },
        { id: '3', message: 'Port scan detected', severity: 'high', timestamp: '2024-01-20T10:20:00Z' }
      ]
    });
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <ShieldCheckIcon className="w-5 h-5" />;
      case 'unhealthy': return <ExclamationTriangleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-8 h-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Mini SOC Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">System Status:</span>
                {Object.entries(systemStatus).map(([service, status]) => (
                  <div key={service} className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span className="ml-1 capitalize">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="w-8 h-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEvents.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unique IPs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.uniqueIPs}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Connections</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Alerts Today</p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Protocol Distribution */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Protocol Distribution</h2>
            <div className="space-y-3">
              {stats.topProtocols.map((protocol) => (
                <div key={protocol.protocol} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{protocol.protocol}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${(protocol.count / stats.totalEvents) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">{protocol.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
            <div className="space-y-3">
              {stats.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    alert.severity === 'high' ? 'bg-red-500' : 
                    alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()} • {alert.severity} severity
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <button className="btn-primary">
              Process New PCAP
            </button>
            <button className="btn-secondary">
              View All Events
            </button>
            <button className="btn-secondary">
              Export Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
