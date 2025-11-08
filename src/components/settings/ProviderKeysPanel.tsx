"use client";
import React, { useEffect, useState } from 'react';

const PROVIDERS = ['openrouter','groq','gemini','mistral','cohere','cerebras'] as const;

type Provider = typeof PROVIDERS[number];

export default function ProviderKeysPanel() {
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/user/settings/provider-keys');
    const json = await res.json();
    const map: Record<string, boolean> = {};
    (json.providers || []).forEach((p: any) => map[p.provider] = p.hasKey);
    setStatus(map);
    // load limits
    const res2 = await fetch('/api/user/settings/provider-limits');
    const json2 = await res2.json();
    const lims: Record<string, number> = {};
    (json2.limits || []).forEach((r: any) => lims[r.provider] = r.max_requests_per_min);
    setLimits(lims);
  }

  useEffect(() => { load(); }, []);

  async function save(provider: string) {
    setSaving(provider); setError(null);
    try {
      const res = await fetch('/api/user/settings/provider-keys', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: inputs[provider] || '' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      await load();
      setInputs({ ...inputs, [provider]: '' });
    } catch (e: any) { setError(e.message); } finally { setSaving(null); }
  }

  async function remove(provider: string) {
    setSaving(provider); setError(null);
    try {
      const res = await fetch(`/api/user/settings/provider-keys/${provider}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      await load();
    } catch (e: any) { setError(e.message); } finally { setSaving(null); }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">My Provider API Keys</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="space-y-4">
        {PROVIDERS.map(p => (
          <div key={p} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium capitalize">{p}</div>
              <div className={status[p] ? 'text-green-600' : 'text-gray-500'}>
                {status[p] ? 'Configured' : 'Not configured'}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                placeholder={`Enter ${p} API key`}
                value={inputs[p] || ''}
                onChange={e => setInputs({ ...inputs, [p]: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <button
                disabled={saving === p || !inputs[p]}
                onClick={() => save(p)}
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {saving === p ? 'Saving...' : 'Save'}
              </button>
              {status[p] && (
                <button
                  disabled={saving === p}
                  onClick={() => remove(p)}
                  className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  {saving === p ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
            <div className=\"mt-3 flex items-center gap-2\">
              <label className=\"text-sm text-gray-700\">Max requests/min:</label>
              <input
                type=\"number\"
                min={1}
                value={limits[p] ?? 60}
                onChange={e => setLimits({ ...limits, [p]: Number(e.target.value) })}
                className=\"w-32 border px-2 py-1 rounded\"
              />
              <button
                disabled={saving === p}
                onClick={async () => {
                  setSaving(p);
                  try {
                    const res = await fetch('/api/user/settings/provider-limits', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ provider: p, maxRequestsPerMin: limits[p] ?? 60 })
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || 'Failed');
                  } catch (e: any) { setError(e.message); } finally { setSaving(null); }
                }}
                className=\"px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50\"
              >
                {saving === p ? 'Saving...' : 'Save Limit'}
              </button>
            </div>
          </div
        ))}
      </div>
    </div>
  );
}
