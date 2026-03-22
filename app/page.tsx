'use client';

import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';

type RecentScan = {
  date: string;
  sku: string;
  location: string;
  action: 'created' | 'updated';
  status: string;
};

export default function HomePage() {
  const [sku, setSku] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  const skuInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const submitAssignment = async () => {
    const trimmedSku = sku.trim();
    const trimmedLocation = location.trim();

    if (!trimmedSku || !trimmedLocation) {
      setStatus('error');
      setMessage('Please scan both a SKU and a location.');
      return;
    }

    setSku('');
    setLocation('');
    skuInputRef.current?.focus();

    try {
      const response = await fetch('/api/assign-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: trimmedSku,
          location: trimmedLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Request failed.');
      }

      setStatus('success');
      setMessage(data.message || 'Location saved.');

      if (data.scan) {
        setRecentScans((prev) => [data.scan, ...prev.slice(0, 7)]);
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? `Save failed for ${trimmedSku}: ${error.message}`
          : `Save failed for ${trimmedSku}.`
      );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitAssignment();
  };

  const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      locationInputRef.current?.focus();
    }
  };

  const handleLocationKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAssignment();
    }
  };

  const handleClear = () => {
    setSku('');
    setLocation('');
    setMessage('');
    setStatus('idle');
    skuInputRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inventory Scanner
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Scan the item SKU, then scan the storage location. The save happens
              automatically and recent activity appears on the right.
            </p>
          </div>

          <Link
            href="/labels"
            className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:opacity-90"
          >
            Open Label Generator
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Scan Item</h2>
              <p className="mt-1 text-sm text-gray-600">
                Scan SKU first, then scan the bin or storage location.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="sku"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Item SKU
                </label>
                <input
                  id="sku"
                  ref={skuInputRef}
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  onKeyDown={handleSkuKeyDown}
                  placeholder="Scan or type SKU"
                  className="w-full rounded-xl border border-gray-300 px-4 py-4 text-xl text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-gray-800"
                >
                  Location
                </label>
                <input
                  id="location"
                  ref={locationInputRef}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  placeholder="Scan or type location"
                  className="w-full rounded-xl border border-gray-300 px-4 py-4 text-xl text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:opacity-90"
                >
                  Assign Location
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-800 transition hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </form>

            {message && (
              <div
                className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
                  status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Scans</h2>
                <p className="mt-1 text-sm text-gray-600">
                  The most recent scanned items will appear here.
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {recentScans.length}
              </div>
            </div>

            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                  No scans yet.
                </div>
              ) : (
                recentScans.map((scan, index) => (
                  <div
                    key={`${scan.sku}-${scan.location}-${index}`}
                    className="rounded-xl border border-gray-200 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="break-all font-semibold text-gray-900">
                          {scan.sku}
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          Location:{' '}
                          <span className="font-medium">{scan.location}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Date: {scan.date}
                        </div>
                      </div>

                      <div
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          scan.action === 'updated'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {scan.action}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}