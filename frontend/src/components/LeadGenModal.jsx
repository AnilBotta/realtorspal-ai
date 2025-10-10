import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Search, MapPin, Home, DollarSign, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { triggerLeadGeneration, getLeadGenStatus, getLeadGenStream } from '../api';

const LeadGenModal = ({ isOpen, onClose, user }) => {
  const [searchParams, setSearchParams] = useState({
    startUrl: '',
    maxPages: 2
  });
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, done, error
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [counts, setCounts] = useState(null);
  const [leadIds, setLeadIds] = useState([]);
  const eventSourceRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleStart = async () => {
    try {
      // Validate URL
      if (!searchParams.startUrl || !searchParams.startUrl.includes('kijiji.ca')) {
        alert('Please enter a valid Kijiji URL');
        return;
      }

      setLogs([]);
      setSummary(null);
      setCounts(null);
      setLeadIds([]);
      setStatus('running');

      // Start lead generation with URL and pages
      const requestData = {
        startUrl: searchParams.startUrl,
        maxPages: searchParams.maxPages
      };
      const response = await triggerLeadGeneration(requestData);
      const newJobId = response.data.job_id;
      setJobId(newJobId);

      // Connect to SSE stream
      const eventSource = new EventSource(getLeadGenStream(newJobId));
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('log', (e) => {
        setLogs(prev => [...prev, e.data]);
      });

      eventSource.addEventListener('status', (e) => {
        setStatus(e.data);
      });

      eventSource.addEventListener('summary', (e) => {
        setSummary(e.data);
      });

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
      };

      // Poll for status updates
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await getLeadGenStatus(newJobId);
          const jobStatus = statusResponse.data.status;
          setStatus(jobStatus);

          if (statusResponse.data.summary) {
            setSummary(statusResponse.data.summary);
          }
          if (statusResponse.data.counts) {
            setCounts(statusResponse.data.counts);
          }
          if (statusResponse.data.lead_ids) {
            setLeadIds(statusResponse.data.lead_ids);
          }

          if (jobStatus === 'done' || jobStatus === 'error') {
            clearInterval(pollIntervalRef.current);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Error starting lead generation:', error);
      setStatus('error');
      setLogs(prev => [...prev, `Error: ${error.message}`]);
    }
  };

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setJobId(null);
    setStatus('idle');
    setLogs([]);
    setSummary(null);
    setCounts(null);
    setLeadIds([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Search size={24} className="text-blue-600" />
                Lead Generation AI
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Search for properties and automatically generate leads
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Search Location *
                </label>
                <input
                  type="text"
                  value={searchParams.place}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, place: e.target.value }))}
                  placeholder="e.g., Toronto, GTA, Downtown Toronto"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Home size={16} className="inline mr-2" />
                  Property Type (Optional)
                </label>
                <input
                  type="text"
                  value={searchParams.propertyType}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, propertyType: e.target.value }))}
                  placeholder="e.g., detached houses, condos, townhouses"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign size={16} className="inline mr-2" />
                  Max Results
                </label>
                <input
                  type="number"
                  value={searchParams.maxResults}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 10 }))}
                  min="1"
                  max="50"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play size={18} />
                Start Lead Generation
              </button>
            </div>
          )}

          {(status === 'running' || status === 'queued') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Loader size={24} className="animate-spin text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                    {status === 'queued' ? 'Queued' : 'Running'}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Searching {searchParams.place} for {searchParams.propertyType || 'properties'}...
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Live Activity</h4>
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="text-gray-700 dark:text-gray-300">
                      {log}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-gray-500 dark:text-gray-400 italic">
                      Waiting for activity...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-300">
                    Lead Generation Complete
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {leadIds.length} leads successfully generated
                  </p>
                </div>
              </div>

              {counts && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {counts.found || 0}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">Found</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {counts.posted || 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">Posted</div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                      {counts.duplicates || 0}
                    </div>
                    <div className="text-sm text-amber-700 dark:text-amber-400">Duplicates</div>
                  </div>
                </div>
              )}

              {summary && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {summary}
                  </p>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Search
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertCircle size={24} className="text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-300">
                    Lead Generation Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    An error occurred during lead generation
                  </p>
                </div>
              </div>

              <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-96 overflow-y-auto bg-red-50 dark:bg-red-900/10">
                <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">Error Log</h4>
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="text-red-700 dark:text-red-400">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadGenModal;