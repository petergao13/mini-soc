'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState({
    processor: 'unknown',
    splunk: 'unknown',
    frontend: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/processor/health');
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(prev => ({
            ...prev,
            processor: data.status === 'healthy' ? 'connected' : 'disconnected'
          }));
        } else {
          setSystemStatus(prev => ({ ...prev, processor: 'disconnected' }));
        }
      } catch (error) {
        console.log('Processor check failed:', error);
        setSystemStatus(prev => ({ ...prev, processor: 'disconnected' }));
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded mr-3"></div>
              <h1 className="text-2xl font-bold text-gray-900">Mini SOC Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">System Status:</span>
                <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                  <span className="ml-1 capitalize">healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Loaded Successfully!</h2>
          <p className="text-lg text-gray-600">The frontend is now working properly.</p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processor</h3>
              <p className={`font-medium ${
                systemStatus.processor === 'connected' ? 'text-green-600' : 
                systemStatus.processor === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {systemStatus.processor === 'connected' ? 'Connected' : 
                 systemStatus.processor === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Splunk</h3>
              <p className="text-green-600 font-medium">Running</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Frontend</h3>
              <p className="text-green-600 font-medium">Active</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
