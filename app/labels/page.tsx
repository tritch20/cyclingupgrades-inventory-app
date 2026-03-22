'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import Papa from 'papaparse';
import Link from 'next/link';

type CsvRow = {
  SKU?: string;
  'SKU LAST 6'?: string;
  TITLE?: string;
};

type LabelRow = {
  id: string;
  rowNumber: number;
  sku: string;
  skuLast6: string;
  title: string;
  selected: boolean;
  quantity: number;
};

function BarcodePreview({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value.trim()) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        width: 1.1,
        height: 24,
      });
    } catch {
      // ignore barcode render errors
    }
  }, [value]);

  return <svg ref={svgRef} className="h-auto w-full" />;
}

function parseRowRange(input: string, maxRow: number): number[] {
  if (!input.trim()) return [];

  const selected = new Set<number>();
  const parts = input.split(',');

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;

    if (part.includes('-')) {
      const [startRaw, endRaw] = part.split('-').map((p) => p.trim());
      const start = Number(startRaw);
      const end = Number(endRaw);

      if (!Number.isInteger(start) || !Number.isInteger(end)) continue;

      const low = Math.max(1, Math.min(start, end));
      const high = Math.min(maxRow, Math.max(start, end));

      for (let i = low; i <= high; i++) {
        selected.add(i);
      }
    } else {
      const value = Number(part);
      if (Number.isInteger(value) && value >= 1 && value <= maxRow) {
        selected.add(value);
      }
    }
  }

  return Array.from(selected);
}

export default function LabelsPage() {
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [labelWidth, setLabelWidth] = useState(2);
  const [labelHeight, setLabelHeight] = useState(1);
  const [rangeInput, setRangeInput] = useState('');
  const [defaultQuantity, setDefaultQuantity] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');

  const maxRow = labels.length;

  const expandedPrintLabels = useMemo(() => {
    const expanded: LabelRow[] = [];

    for (const label of labels) {
      if (!label.selected) continue;

      const safeQty = Math.max(1, label.quantity || 1);

      for (let i = 0; i < safeQty; i++) {
        expanded.push(label);
      }
    }

    return expanded;
  }, [labels]);

  const selectedCount = labels.filter((label) => label.selected).length;
  const totalPrintCount = expandedPrintLabels.length;

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('');

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows: LabelRow[] = results.data
          .map((row, index) => {
            const sku = String(row.SKU || '').trim();
            const skuLast6 = String(row['SKU LAST 6'] || '').trim();
            const title = String(row.TITLE || '').trim();

            if (!sku) return null;

            return {
              id: `${sku}-${index}`,
              rowNumber: index + 1,
              sku,
              skuLast6: skuLast6 || sku.slice(-7),
              title,
              selected: true,
              quantity: Math.max(1, defaultQuantity),
            };
          })
          .filter((row): row is LabelRow => row !== null);

        setLabels(parsedRows);
        setStatusMessage(`Loaded ${parsedRows.length} labels from CSV.`);
      },
      error: () => {
        setStatusMessage('Failed to parse CSV file.');
      },
    });

    e.target.value = '';
  };

  const updateLabelSelection = (id: string, selected: boolean) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === id ? { ...label, selected } : label
      )
    );
  };

  const updateLabelQuantity = (id: string, quantity: number) => {
    const safeQty = Math.max(1, quantity || 1);

    setLabels((prev) =>
      prev.map((label) =>
        label.id === id ? { ...label, quantity: safeQty } : label
      )
    );
  };

  const selectAll = () => {
    setLabels((prev) => prev.map((label) => ({ ...label, selected: true })));
  };

  const clearAll = () => {
    setLabels((prev) => prev.map((label) => ({ ...label, selected: false })));
  };

  const applyDefaultQuantityToAll = () => {
    const safeQty = Math.max(1, defaultQuantity || 1);

    setLabels((prev) =>
      prev.map((label) => ({
        ...label,
        quantity: safeQty,
      }))
    );
  };

  const selectRowsFromRange = () => {
    if (!labels.length) return;

    const rowsToSelect = new Set(parseRowRange(rangeInput, labels.length));

    if (!rowsToSelect.size) {
      setStatusMessage('No valid rows found in the range input.');
      return;
    }

    setLabels((prev) =>
      prev.map((label) => ({
        ...label,
        selected: rowsToSelect.has(label.rowNumber),
      }))
    );

    setStatusMessage(`Selected ${rowsToSelect.size} row(s).`);
  };

  const handlePrint = () => {
    if (!expandedPrintLabels.length) {
      setStatusMessage('No labels selected to print.');
      return;
    }

    window.print();
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Label Generator</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload a CSV, choose what to print, and send the selected labels to
              your thermal printer.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Back to Scanner
            </Link>

            <button
              onClick={handlePrint}
              className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:opacity-90"
            >
              Print Selected
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[380px_1fr]">
          <div className="space-y-6 print:hidden">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900">Controls</h2>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">
                    Upload CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Expected headers: <strong>SKU</strong>,{' '}
                    <strong>SKU LAST 6</strong>, <strong>TITLE</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Label Width (in)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.1}
                      value={labelWidth}
                      onChange={(e) =>
                        setLabelWidth(Math.max(0.5, Number(e.target.value) || 2))
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-800">
                      Label Height (in)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.1}
                      value={labelHeight}
                      onChange={(e) =>
                        setLabelHeight(Math.max(0.5, Number(e.target.value) || 1))
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">
                    Default Quantity
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={defaultQuantity}
                      onChange={(e) =>
                        setDefaultQuantity(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={applyDefaultQuantityToAll}
                      className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">
                    Select Rows
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="Example: 1-20 or 1,3,7"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={selectRowsFromRange}
                      className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900">Summary</h2>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div>
                  Loaded labels: <span className="font-semibold">{labels.length}</span>
                </div>
                <div>
                  Selected rows:{' '}
                  <span className="font-semibold">{selectedCount}</span>
                </div>
                <div>
                  Total labels to print:{' '}
                  <span className="font-semibold">{totalPrintCount}</span>
                </div>
              </div>

              {statusMessage && (
                <div className="mt-4 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
                  {statusMessage}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 print:hidden">
              <h2 className="text-xl font-bold text-gray-900">Preview</h2>
              <p className="mt-1 text-sm text-gray-600">
                Only selected labels will print.
              </p>
            </div>

            {!labels.length ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 print:hidden">
                Upload a CSV to preview labels.
              </div>
            ) : (
              <>
                <div className="space-y-4 print:hidden">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={label.selected}
                            onChange={(e) =>
                              updateLabelSelection(label.id, e.target.checked)
                            }
                            className="h-5 w-5"
                          />
                          <div className="text-sm font-medium text-gray-800">
                            Row {label.rowNumber}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">
                            Qty
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={label.quantity}
                            onChange={(e) =>
                              updateLabelQuantity(
                                label.id,
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            }
                            className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div
                        className="label-sheet-item border border-gray-300 bg-white text-black"
                        style={{
                          width: `${labelWidth}in`,
                          height: `${labelHeight}in`,
                        }}
                      >
                        <div className="label-inner">
                          <div className="label-title" title={label.title}>
                            {label.title || 'No Title'}
                          </div>

                          <div className="label-sku-full" title={label.sku}>
                            {label.sku}
                          </div>

                          <div className="label-sku-large">
                            {label.skuLast6 || label.sku.slice(-7)}
                          </div>

                          <div className="label-barcode">
                            <BarcodePreview value={label.sku} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden print:block">
                  <div className="print-label-stack">
                    {expandedPrintLabels.map((label, index) => (
                      <div
                        key={`${label.id}-print-${index}`}
                        className="label-sheet-item bg-white text-black"
                        style={{
                          width: `${labelWidth}in`,
                          height: `${labelHeight}in`,
                        }}
                      >
                        <div className="label-inner">
                          <div className="label-title" title={label.title}>
                            {label.title || 'No Title'}
                          </div>

                          <div className="label-sku-full" title={label.sku}>
                            {label.sku}
                          </div>

                          <div className="label-sku-large">
                            {label.skuLast6 || label.sku.slice(-7)}
                          </div>

                          <div className="label-barcode">
                            <BarcodePreview value={label.sku} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .label-sheet-item {
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .label-inner {
          height: 100%;
          width: 100%;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          padding: 0.04in 0.05in;
          gap: 0.01in;
          text-align: center;
          align-items: center;
          justify-items: center;
        }

        .label-title {
          font-size: 7px;
          line-height: 1.05;
          font-weight: 600;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          width: 100%;
          word-break: break-word;
        }

        .label-sku-full {
          font-size: 7px;
          line-height: 1;
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .label-sku-large {
          font-size: 16px;
          line-height: 1;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          text-align: center;
        }

        .label-barcode {
          height: 0.28in;
          width: 100%;
          display: flex;
          align-items: end;
          justify-content: center;
        }

        .label-barcode svg {
          width: 100%;
          height: 100%;
        }

        .print-label-stack {
          display: flex;
          flex-direction: column;
          gap: 0;
          align-items: flex-start;
        }

        @media print {
          @page {
            margin: 0;
          }

          html,
          body {
            background: white;
            margin: 0;
            padding: 0;
          }

          .label-sheet-item {
            border: none !important;
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 0;
          }
        }
      `}</style>
    </main>
  );
}