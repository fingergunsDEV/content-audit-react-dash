// AuditDashboard.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const proxyUrl = 'https://corsproxy.io/?';

const AuditDashboard = () => {
  const [urls, setUrls] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedUrls = results.data.flat().filter(url => url);
        setUrls(parsedUrls);
      },
    });
  };

  const handleTextareaPaste = (e) => {
    const pasted = e.target.value.split('\n').map(url => url.trim()).filter(Boolean);
    setUrls(pasted);
  };

  const handleAudit = async () => {
    setLoading(true);
    const audits = await Promise.all(urls.map(async (url) => {
      try {
        const response = await fetch(proxyUrl + encodeURIComponent(url));
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const title = doc.querySelector('title')?.innerText || 'Missing';
        const metaDescription = doc.querySelector('meta[name="description"]')?.content || 'Missing';
        const h1 = doc.querySelector('h1')?.innerText || 'Missing';
        const canonical = doc.querySelector('link[rel="canonical"]')?.href || 'Missing';

        const pageType = doc.querySelector('meta[property="og:type"]')?.content || doc.querySelector('meta[name="page-type"]')?.content || 'unknown';

        const schemaScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        const schemaTypes = schemaScripts.map((script) => {
          try {
            const json = JSON.parse(script.textContent);
            if (Array.isArray(json)) {
              return json.map(j => j['@type']).join(', ');
            }
            return json['@type'] || 'N/A';
          } catch (e) {
            return 'Invalid JSON';
          }
        });

        return {
          url,
          status: response.status,
          title,
          description: metaDescription,
          h1,
          canonical,
          pageType,
          schemaTypes: schemaTypes.join('; '),
        };
      } catch (err) {
        return {
          url,
          status: 'Error',
          title: '-',
          description: '-',
          h1: '-',
          canonical: '-',
          pageType: '-',
          schemaTypes: '-',
        };
      }
    }));
    setResults(audits);
    setLoading(false);
  };

  const handleExport = () => {
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'seo-audit-results.csv');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">SEO + Schema Audit Dashboard</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <label className="block mb-2 font-medium">Upload CSV</label>
        <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />

        <label className="block mb-2 font-medium">Paste URLs (one per line)</label>
        <textarea rows="6" className="w-full border rounded p-2" onChange={handleTextareaPaste} placeholder="https://example.com/page" />

        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleAudit}
          disabled={loading || urls.length === 0}
        >
          {loading ? 'Auditing...' : 'Run Audit'}
        </button>

        {results.length > 0 && (
          <button
            className="ml-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleExport}
          >
            Export CSV
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-sm bg-white shadow rounded-xl">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">URL</th>
                <th className="p-3">Status</th>
                <th className="p-3">Title</th>
                <th className="p-3">Meta Description</th>
                <th className="p-3">H1</th>
                <th className="p-3">Canonical</th>
                <th className="p-3">Page Type</th>
                <th className="p-3">Schema Types</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3 break-all text-blue-700 underline"><a href={row.url} target="_blank" rel="noreferrer">{row.url}</a></td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">{row.title}</td>
                  <td className="p-3">{row.description}</td>
                  <td className="p-3">{row.h1}</td>
                  <td className="p-3">{row.canonical}</td>
                  <td className="p-3">{row.pageType}</td>
                  <td className="p-3">{row.schemaTypes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditDashboard;
