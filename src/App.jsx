import React, { useState, useEffect } from 'react';
import { FileUp, Download, Layout, Scissors, Info, AlertCircle, CheckCircle2, Loader2, Printer } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function App() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [impositionMode, setImpositionMode] = useState('xerox-pro'); 
  const [impositionData, setImpositionData] = useState(null);
  const [error, setError] = useState('');

  // Calculate physical sheet layout positions based on the user's printer type
  const calculateImposition = (count, mode) => {
    const totalSlots = Math.ceil(count / 4) * 4;
    const sheets = totalSlots / 4;
    const mapping = [];

    if (mode === 'xerox-pro' || mode === 'hp-home') {
      for (let i = 1; i <= sheets; i++) {
        const frontLeft = 2 * i - 1;
        const frontRight = (2 * i - 1) + (2 * sheets);
        const pageAfterFL = 2 * i;
        const pageAfterFR = (2 * i) + (2 * sheets);

        if (mode === 'xerox-pro') {
          // XEROX PROFESSIONAL DUPLEX: LONG EDGE FLIP
          // Front-Left is directly backed by Back-Left
          mapping.push({
            sheet: i,
            front: { left: frontLeft, right: frontRight },
            back: { left: pageAfterFL, right: pageAfterFR }
          });
        } else {
          // HP HOME DUPLEX: SHORT EDGE FLIP ("FLIP UP")
          // Due to manual rotation, Front-Left transfers to Back-Right
          mapping.push({
            sheet: i,
            front: { left: frontLeft, right: frontRight },
            back: { left: pageAfterFR, right: pageAfterFL }
          });
        }
      }
    } else if (mode === 'sequential') {
      // Standard side-by-side printing sequence (e.g., SubPrint)
      const totalSheets = Math.ceil(count / 4);
      for (let i = 0; i < totalSheets; i++) {
        mapping.push({
          sheet: i + 1,
          front: { left: (i * 4) + 1, right: (i * 4) + 3 },
          back: { left: (i * 4) + 2, right: (i * 4) + 4 }
        });
      }
    } else if (mode === 'duplicate-cover') {
      // Duplicates Page 1 on both halves of front. Page 2 (if exists) on both halves of back.
      mapping.push({
        sheet: 1,
        front: { left: 1, right: 1 },
        back: { left: count >= 2 ? 2 : 0, right: count >= 2 ? 2 : 0 }
      });
    }
    return { sheets, totalSlots, mapping };
  };

  useEffect(() => {
    if (file && pageCount > 0) {
      setImpositionData(calculateImposition(pageCount, impositionMode));
    }
  }, [impositionMode, file, pageCount]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setError('');
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      setError('Error reading PDF file.');
    }
  };

  const generateImposedPdf = async () => {
    if (!file || !impositionData) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const targetDoc = await PDFDocument.create();
      const { mapping } = impositionData;
      const pageWidth = 792; 
      const pageHeight = 612; 
      const halfWidth = pageWidth / 2;

      for (const item of mapping) {
        const frontSheet = targetDoc.addPage([pageWidth, pageHeight]);
        if (item.front.left > 0 && item.front.left <= pageCount) {
          const [p] = await targetDoc.embedPages([srcDoc.getPages()[item.front.left - 1]]);
          frontSheet.drawPage(p, { x: 0, y: 0, width: halfWidth, height: pageHeight });
        }
        if (item.front.right > 0 && item.front.right <= pageCount) {
          const [p] = await targetDoc.embedPages([srcDoc.getPages()[item.front.right - 1]]);
          frontSheet.drawPage(p, { x: halfWidth, y: 0, width: halfWidth, height: pageHeight });
        }

        const backSheet = targetDoc.addPage([pageWidth, pageHeight]);
        if (item.back.left > 0 && item.back.left <= pageCount) {
          const [p] = await targetDoc.embedPages([srcDoc.getPages()[item.back.left - 1]]);
          backSheet.drawPage(p, { x: 0, y: 0, width: halfWidth, height: pageHeight });
        }
        if (item.back.right > 0 && item.back.right <= pageCount) {
          const [p] = await targetDoc.embedPages([srcDoc.getPages()[item.back.right - 1]]);
          backSheet.drawPage(p, { x: halfWidth, y: 0, width: halfWidth, height: pageHeight });
        }
      }

      const pdfBytes = await targetDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${impositionMode.toUpperCase()}_IMPOSED.pdf`;
      link.click();
    } catch (err) {
      setError('Failed to generate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center justify-center gap-2">
            <Scissors className="w-8 h-8" />
            Cut-stack Imposition for Printing
          </h1>
          <p className="text-slate-500 mt-2">Adjusted settings for 2-up booklets on 8.5x11" paper.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-500" />
                Step 1: File
              </h2>
              <label className="block w-full cursor-pointer mb-6">
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                  {file ? <div className="text-green-700 font-semibold truncate">{file.name}</div> : <div className="text-slate-400 text-xs font-semibold">Select PDF</div>}
                </div>
              </label>

              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-500" />
                Step 2: Configuration
              </h2>
              <div className="flex flex-col gap-2 mb-6 text-xs font-bold">
                <button 
                  onClick={() => setImpositionMode('xerox-pro')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${impositionMode === 'xerox-pro' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                >
                  <div>Xerox / Office Pro</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-1">Automatic Duplex (Long-Edge).</div>
                </button>
                <button 
                  onClick={() => setImpositionMode('hp-home')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${impositionMode === 'hp-home' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                >
                  <div>HP / Home Manual</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-1">Manual Flip-Up (Short-Edge).</div>
                </button>
                <button 
                  onClick={() => setImpositionMode('duplicate-cover')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${impositionMode === 'duplicate-cover' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                >
                  <div>Duplicate (Cover Mode)</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-1">Puts page 1 side-by-side to save paper.</div>
                </button>
              </div>

              {impositionData && (
                <button
                  onClick={generateImposedPdf}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                  Export PDF
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
              <h2 className="text-lg font-semibold mb-4 text-slate-700 font-mono">Imposition Matrix</h2>
              {!impositionData ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed rounded-xl">Upload PDF to begin</div>
              ) : (
                <div className="space-y-4">
                  {impositionData.mapping.map((sheet, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Front (S{sheet.sheet})</span>
                          <div className="flex aspect-[1.29] border-2 border-slate-300 rounded bg-white shadow-sm overflow-hidden">
                            <div className="flex-1 flex items-center justify-center border-r border-slate-200 bg-indigo-50/50 font-bold text-lg">{sheet.front.left || 'X'}</div>
                            <div className="flex-1 flex items-center justify-center font-bold text-lg">{sheet.front.right || 'X'}</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase">Back</span>
                          <div className="flex aspect-[1.29] border-2 border-slate-300 rounded bg-white shadow-sm overflow-hidden">
                            <div className="flex-1 flex items-center justify-center border-r border-slate-200 font-bold text-lg">{sheet.back.left || 'X'}</div>
                            <div className="flex-1 flex items-center justify-center bg-indigo-50/50 font-bold text-lg">{sheet.back.right || 'X'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}