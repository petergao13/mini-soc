'use client';

import { useState, useEffect } from 'react';

interface SystemStatus {
  zeek: string;
  processor: string;
  splunk: string;
  frontend: string;
  liveCapture?: string;
}

interface DashboardStats {
  totalConnections: number;
  activeConnections: number;
  totalPackets: number;
  alerts: number;
  topSources: Array<{ ip: string; count: number }>;
  topDestinations: Array<{ ip: string; count: number }>;
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    zeek: 'checking',
    processor: 'checking',
    splunk: 'checking',
    frontend: 'checking',
    liveCapture: 'unknown'
  });
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalConnections: 0,
    activeConnections: 0,
    totalPackets: 0,
    alerts: 0,
    topSources: [],
    topDestinations: []
  });

  const checkStatus = async () => {
    try {
      // Check processor status
      const processorResponse = await fetch('/api/processor/health');
      const processorData = await processorResponse.json();
      
      // Check Zeek status
      const zeekResponse = await fetch('/api/zeek/health');
      const zeekData = await zeekResponse.json();
      
      // Check Splunk status
      const splunkResponse = await fetch('/api/splunk/health');
      const splunkData = await splunkResponse.json();

      setSystemStatus({
        zeek: zeekData.status,
        processor: processorData.status,
        splunk: splunkData.status,
        frontend: 'running',
        liveCapture: zeekData.status === 'running' ? 'active' : 'inactive'
      });
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      // Mock data for now - in a real implementation, this would come from Splunk
      setDashboardStats({
        totalConnections: 1247,
        activeConnections: 23,
        totalPackets: 45678,
        alerts: 3,
        topSources: [
          { ip: '192.168.1.100', count: 156 },
          { ip: '192.168.1.101', count: 89 },
          { ip: '10.0.0.50', count: 67 }
        ],
        topDestinations: [
          { ip: '8.8.8.8', count: 234 },
          { ip: '1.1.1.1', count: 189 },
          { ip: '208.67.222.222', count: 145 }
        ]
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    loadDashboardStats();
    
    // Set up periodic status checks
    const statusInterval = setInterval(checkStatus, 30000); // Every 30 seconds
    
    return () => clearInterval(statusInterval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checking':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'stopped':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return '🟢';
      case 'checking':
        return '🟡';
      case 'error':
      case 'stopped':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mini SOC Dashboard</h1>
          <p className="mt-2 text-gray-600">Real-time network security monitoring and analysis</p>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Zeek Status */}
          <div className={`card border ${getStatusColor(systemStatus.zeek)}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">{getStatusIcon(systemStatus.zeek)}</span>
              <div>
                <h3 className="font-semibold">Zeek</h3>
                <p className="text-sm opacity-75">
                  {systemStatus.zeek === 'checking' ? 'Checking...' : 
                   systemStatus.zeek === 'running' ? 'Processing logs' : 
                   systemStatus.zeek}
                </p>
              </div>
            </div>
          </div>

          {/* Live Capture Status */}
          <div className={`card border ${getStatusColor(systemStatus.liveCapture || 'unknown')}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {systemStatus.liveCapture === 'active' ? '📡' : 
                 systemStatus.liveCapture === 'inactive' ? '⏸️' : '❓'}
              </span>
              <div>
                <h3 className="font-semibold">Live Capture</h3>
                <p className="text-sm opacity-75">
                  {systemStatus.liveCapture === 'active' ? 'Capturing live traffic' :
                   systemStatus.liveCapture === 'inactive' ? 'PCAP mode' :
                   'Unknown status'}
                </p>
              </div>
            </div>
          </div>

          {/* Processor Status */}
          <div className={`card border ${getStatusColor(systemStatus.processor)}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">{getStatusIcon(systemStatus.processor)}</span>
              <div>
                <h3 className="font-semibold">Processor</h3>
                <p className="text-sm opacity-75">
                  {systemStatus.processor === 'checking' ? 'Checking...' : 
                   systemStatus.processor === 'running' ? 'Enriching events' : 
                   systemStatus.processor}
                </p>
              </div>
            </div>
          </div>

          {/* Splunk Status */}
          <div className={`card border ${getStatusColor(systemStatus.splunk)}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">{getStatusIcon(systemStatus.splunk)}</span>
              <div>
                <h3 className="font-semibold">Splunk</h3>
                <p className="text-sm opacity-75">
                  {systemStatus.splunk === 'checking' ? 'Checking...' : 
                   systemStatus.splunk === 'running' ? 'Indexing logs' : 
                   systemStatus.splunk}
                </p>
              </div>
            </div>
          </div>

          {/* Frontend Status */}
          <div className={`card border ${getStatusColor(systemStatus.frontend)}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">{getStatusIcon(systemStatus.frontend)}</span>
              <div>
                <h3 className="font-semibold">Frontend</h3>
                <p className="text-sm opacity-75">
                  {systemStatus.frontend === 'checking' ? 'Checking...' : 
                   systemStatus.frontend === 'running' ? 'Dashboard active' : 
                   systemStatus.frontend}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Capture Controls */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Capture Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Start Live Capture</h3>
              <p className="text-sm text-blue-700 mt-1">Begin real-time network monitoring</p>
              <button className="btn-primary mt-3 w-full">
                Start Live Mode
              </button>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">PCAP Mode</h3>
              <p className="text-sm text-green-700 mt-1">Process static packet captures</p>
              <button className="btn-primary mt-3 w-full">
                Switch to PCAP
              </button>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Capture Status</h3>
              <p className="text-sm text-gray-700 mt-1">Monitor current capture state</p>
              <button className="btn-primary mt-3 w-full">
                Check Status
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Statistics */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Connection Statistics</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading statistics...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalConnections.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">Total Connections</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{dashboardStats.activeConnections}</div>
                    <div className="text-sm text-green-700">Active Connections</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{dashboardStats.totalPackets.toLocaleString()}</div>
                    <div className="text-sm text-purple-700">Total Packets</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{dashboardStats.alerts}</div>
                    <div className="text-sm text-red-700">Alerts</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top IP Addresses */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Top IP Addresses</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Top Sources</h3>
                <div className="space-y-2">
                  {dashboardStats.topSources.map((source, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{source.ip}</span>
                      <span className="text-sm text-gray-600">{source.count} connections</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Top Destinations</h3>
                <div className="space-y-2">
                  {dashboardStats.topDestinations.map((dest, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm">{dest.ip}</span>
                      <span className="text-sm text-gray-600">{dest.count} connections</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
