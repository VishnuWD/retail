'use client';

import { useState } from 'react';
import { Camera, RefreshCw, Barcode, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, X, Play } from 'lucide-react';

export default function MobileDashboard() {
  const [activeScreen, setActiveScreen] = useState('home'); // home, stocktake, scan_overlay
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  
  // Stocktake state
  const [stocktakeStep, setStocktakeStep] = useState(1); // 1: Scan, 2: Count, 3: Success
  const [targetProduct, setTargetProduct] = useState(null);
  const [physicalCount, setPhysicalCount] = useState('');

  const triggerScan = () => {
    setActiveScreen('scan_overlay');
    setCameraActive(true);
    setScannedBarcode('');
    
    // Simulate barcode capture after 2 seconds in browser
    setTimeout(() => {
      const mockBarcodes = ['8901058002315', '8901719101035', '8901491101836'];
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      setScannedBarcode(randomBarcode);
      
      // Auto-fetch product info
      const mockProducts = {
        '8901058002315': { id: 'p1', name: 'Amul Butter 100g', expectedQty: 12 },
        '8901719101035': { id: 'p2', name: 'Tata Salt 1kg', expectedQty: 45 },
        '8901491101836': { id: 'p3', name: 'Lays Classic Salted 50g', expectedQty: 8 }
      };

      setTargetProduct(mockProducts[randomBarcode] || { id: 'p_new', name: 'Unknown Scanned Item', expectedQty: 0 });
      setCameraActive(false);
      setStocktakeStep(2); // Go to count step
      setActiveScreen('stocktake');
    }, 2000);
  };

  const handleStocktakeSubmit = () => {
    if (!physicalCount || isNaN(physicalCount)) {
      alert('Please enter a valid physical quantity.');
      return;
    }
    
    // Log stock adjustment transaction simulation
    console.log(`[Mobile Stocktake] Adjusted ${targetProduct.name}. Expected: ${targetProduct.expectedQty}, Physical: ${physicalCount}`);
    setStocktakeStep(3);
  };

  const resetStocktake = () => {
    setStocktakeStep(1);
    setTargetProduct(null);
    setPhysicalCount('');
    setActiveScreen('home');
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-[80vh] flex flex-col justify-between border border-slate-200 rounded-2xl overflow-hidden shadow-lg relative">
      {/* Mobile Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <span className="font-bold text-sm tracking-wide">KiranaOS Mobile</span>
        <span className="bg-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Staff Console</span>
      </div>

      {/* Main viewport */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {activeScreen === 'home' && (
          <div className="space-y-4">
            {/* Dashboard summary stats card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>TODAY'S OPERATING SUMMARY</span>
                <span className="text-green-600 flex items-center gap-0.5 font-semibold">
                  <TrendingUp size={12} /> +8.4%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Sales Total</div>
                  <div className="text-lg font-bold text-slate-900">₹8,450.00</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Dues Pending</div>
                  <div className="text-lg font-bold text-slate-900 text-amber-600">₹1,200.00</div>
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mobile Operations</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={triggerScan}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-600 text-slate-800 transition-all shadow-sm"
                >
                  <Barcode className="text-indigo-600" size={24} />
                  <span className="text-xs font-semibold">Scan Barcode</span>
                </button>

                <button
                  onClick={() => {
                    setActiveScreen('stocktake');
                    setStocktakeStep(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-600 text-slate-800 transition-all shadow-sm"
                >
                  <RefreshCw className="text-indigo-600" size={24} />
                  <span className="text-xs font-semibold">Stocktake Audit</span>
                </button>
              </div>
            </div>

            {/* Simulated low stock warnings */}
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-amber-800 text-xs flex gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <div>
                <div className="font-bold">2 Low Stock Warnings</div>
                <div className="mt-0.5 text-amber-700">Amul Butter (3 units left) and Brit biscuits (5 units left).</div>
              </div>
            </div>
          </div>
        )}

        {/* STOCKTAKE FLOW WORKFLOW */}
        {activeScreen === 'stocktake' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Physical Inventory Audit</h3>
              <button onClick={resetStocktake} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {stocktakeStep === 1 && (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                  <Barcode size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Scan Product Barcode</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Point your camera or input scanner at the product to load its current system record.
                  </p>
                </div>
                <button
                  onClick={triggerScan}
                  className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-500 inline-flex items-center gap-1.5"
                >
                  <Camera size={14} /> Open Scanner Camera
                </button>
              </div>
            )}

            {stocktakeStep === 2 && targetProduct && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <div className="text-slate-400 font-semibold uppercase text-[9px]">Scanned Product</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{targetProduct.name}</div>
                  <div className="text-slate-500 mt-1">Expected System Count: **{targetProduct.expectedQty}** units</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Physical Shelf Count</label>
                  <input
                    type="number"
                    value={physicalCount}
                    onChange={(e) => setPhysicalCount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none text-sm"
                    placeholder="Enter physical count"
                  />
                </div>

                <button
                  onClick={handleStocktakeSubmit}
                  className="w-full bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-500 flex justify-center items-center gap-1.5"
                >
                  Submit Stock Adjustment <ChevronRight size={14} />
                </button>
              </div>
            )}

            {stocktakeStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Stocktake Logged</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Difference is logged under stock adjustments. System count updated successfully.
                  </p>
                </div>
                <button
                  onClick={resetStocktake}
                  className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-indigo-500"
                >
                  Return to Panel
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCANNER OVERLAY INTERACTIVE SIMULATION */}
        {activeScreen === 'scan_overlay' && (
          <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col justify-between p-6">
            <div className="flex justify-between items-center text-white">
              <span className="text-xs font-bold tracking-wide">Scanning via Camera...</span>
              <button onClick={() => setActiveScreen('home')} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Scanning viewport animation box */}
            <div className="h-48 border-2 border-dashed border-indigo-500 rounded-xl relative overflow-hidden flex items-center justify-center bg-slate-900/50">
              <div className="absolute inset-x-0 h-0.5 bg-indigo-500 animate-bounce top-10" />
              <div className="text-slate-400 text-xs text-center px-4">
                <Camera size={24} className="mx-auto mb-2 text-indigo-500 animate-pulse" />
                Align barcode inside this window
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-slate-400 text-xs">Simulating image capture and recognition...</p>
              {scannedBarcode && (
                <div className="text-indigo-400 font-bold font-mono text-sm">
                  Found: {scannedBarcode}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Footer Status */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 text-center text-[10px] text-slate-500 flex justify-between items-center">
        <span>Station Sync: Online</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="text-green-600" size={12} /> Secured
        </span>
      </div>
    </div>
  );
}
