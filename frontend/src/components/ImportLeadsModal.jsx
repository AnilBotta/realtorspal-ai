import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { importLeads as defaultImportLeads } from "../api";

const TARGET_FIELDS = [
  // Lead Data tab
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "work_phone", label: "Work Phone" },
  { key: "home_phone", label: "Home Phone" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "email_2", label: "Email 2" },
  { key: "lead_description", label: "Lead Description" },
  { key: "pipeline", label: "Pipeline" },
  { key: "status", label: "Status" },
  { key: "stage", label: "Stage" },
  { key: "priority", label: "Priority" },
  { key: "lead_rating", label: "Lead Rating" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "zip_postal_code", label: "Zip/Postal Code" },
  { key: "neighborhood", label: "Neighborhood" },
  
  // More Details tab
  { key: "lead_source", label: "Lead Source" },
  { key: "lead_type", label: "Lead Type" },
  { key: "source_tags", label: "Tags" },
  
  // Buyer Info tab
  { key: "property_type", label: "Property Type" },
  { key: "buying_in", label: "Buying In" },
  { key: "budget", label: "Budget" },
  { key: "price_min", label: "Price Min" },
  { key: "price_max", label: "Price Max" },
  { key: "min_bedrooms", label: "Min Bedrooms" },
  { key: "min_bathrooms", label: "Min Bathrooms" },
  { key: "yard", label: "Yard" },
  { key: "garage", label: "Garage" },
  { key: "pool", label: "Pool" },
  { key: "spouse_first_name", label: "Spouse First Name" },
  { key: "spouse_last_name", label: "Spouse Last Name" },
  
  // Seller Info tab
  { key: "house_to_sell", label: "House to Sell" },
  { key: "selling_in", label: "Selling In" },
  { key: "house_type", label: "House Type" },
  { key: "expected_price", label: "Expected Price" },
  { key: "bedrooms", label: "Bedrooms" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "basement", label: "Basement" },
  { key: "parking_type", label: "Parking Type" },
  { key: "property_condition", label: "Property Condition" },
  { key: "listing_status", label: "Listing Status" },
  { key: "house_anniversary", label: "House Anniversary" },
  { key: "planning_to_sell_in", label: "Planning to Sell In" },
  { key: "owns_rents", label: "Owns/Rents" },
  { key: "mortgage_type", label: "Mortgage Type" },
  
  // Additional
  { key: "notes", label: "Notes" },
];

const STAGES = ["New","Contacted","Appointment","Onboarded","Closed"]; 

function guessMapping(headers){
  const m = {};
  headers.forEach(h => {
    const k = h.trim().toLowerCase().replace(/[\/\s]/g, '_');
    
    // Lead Data tab fields
    if (k.includes("first") && k.includes("name")) m[h] = "first_name";
    else if (k.includes("last") && k.includes("name")) m[h] = "last_name";
    else if (k.includes("email") && !k.includes("2")) m[h] = "email";
    else if (k.includes("email") && k.includes("2")) m[h] = "email_2";
    else if (k.includes("work") && k.includes("phone")) m[h] = "work_phone";
    else if (k.includes("home") && k.includes("phone")) m[h] = "home_phone";
    else if (k.includes("phone") || k.includes("mobile")) m[h] = "phone";
    else if (k.includes("date") && k.includes("birth")) m[h] = "date_of_birth";
    else if (k.includes("lead") && k.includes("description")) m[h] = "lead_description";
    else if (k.includes("pipeline")) m[h] = "pipeline";
    else if (k.includes("status")) m[h] = "status";
    else if (k.includes("stage")) m[h] = "stage";
    else if (k.includes("priority")) m[h] = "priority";
    else if (k.includes("lead") && k.includes("rating")) m[h] = "lead_rating";
    else if (k.includes("address")) m[h] = "address";
    else if (k.includes("city")) m[h] = "city";
    else if (k.includes("zip") || k.includes("postal")) m[h] = "zip_postal_code";
    else if (k.includes("neighborhood") || k.includes("location") || k.includes("area")) m[h] = "neighborhood";
    
    // More Details tab
    else if (k.includes("lead") && k.includes("source")) m[h] = "lead_source";
    else if (k.includes("lead") && k.includes("type")) m[h] = "lead_type";
    else if (k.includes("tag")) m[h] = "source_tags";
    
    // Buyer Info tab
    else if (k.includes("property") && k.includes("type")) m[h] = "property_type";
    else if (k.includes("buying") && k.includes("in")) m[h] = "buying_in";
    else if (k.includes("budget")) m[h] = "budget";
    else if (k.includes("price") && k.includes("min")) m[h] = "price_min";
    else if (k.includes("price") && k.includes("max")) m[h] = "price_max";
    else if (k.includes("min") && k.includes("bedroom")) m[h] = "min_bedrooms";
    else if (k.includes("min") && k.includes("bathroom")) m[h] = "min_bathrooms";
    else if (k.includes("yard")) m[h] = "yard";
    else if (k.includes("garage")) m[h] = "garage";
    else if (k.includes("pool")) m[h] = "pool";
    else if (k.includes("spouse") && k.includes("first")) m[h] = "spouse_first_name";
    else if (k.includes("spouse") && k.includes("last")) m[h] = "spouse_last_name";
    
    // Seller Info tab
    else if (k.includes("house") && k.includes("sell")) m[h] = "house_to_sell";
    else if (k.includes("selling") && k.includes("in")) m[h] = "selling_in";
    else if (k.includes("house") && k.includes("type")) m[h] = "house_type";
    else if (k.includes("expected") && k.includes("price")) m[h] = "expected_price";
    else if (k.includes("bedroom") && !k.includes("min")) m[h] = "bedrooms";
    else if (k.includes("bathroom") && !k.includes("min")) m[h] = "bathrooms";
    else if (k.includes("basement")) m[h] = "basement";
    else if (k.includes("parking")) m[h] = "parking_type";
    else if (k.includes("property") && k.includes("condition")) m[h] = "property_condition";
    else if (k.includes("listing") && k.includes("status")) m[h] = "listing_status";
    else if (k.includes("house") && k.includes("anniversary")) m[h] = "house_anniversary";
    else if (k.includes("planning") && k.includes("sell")) m[h] = "planning_to_sell_in";
    else if (k.includes("owns") || k.includes("rents")) m[h] = "owns_rents";
    else if (k.includes("mortgage")) m[h] = "mortgage_type";
    
    // Additional
    else if (k.includes("note")) m[h] = "notes";
    else m[h] = "";
  });
  return m;
}

export default function ImportLeadsModal({ open, onClose, onImported, onImportApi, userId }){
  const [step, setStep] = useState(1); // 1: choose, 2: map, 3: review
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [defaultStage, setDefaultStage] = useState("New");
  const [inDashboard, setInDashboard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Reset modal state when opening
  const resetModal = () => {
    console.log('=== RESETTING IMPORT MODAL ===');
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({}); 
    setDefaultStage("New");
    setInDashboard(false);
    setBusy(false);
    setResult(null);
  };

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      resetModal();
    }
  }, [open]);

  const handleClose = () => {
    console.log('=== CLOSING IMPORT MODAL ===');
    resetModal();
    onClose();
  };

  const handleFile = async (file) => {
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transform: (value, field) => {
          // Ensure all values are strings, especially phone numbers
          if (value !== null && value !== undefined) {
            return String(value).trim();
          }
          return '';
        },
        complete: (res) => {
          const hdrs = res.meta.fields || [];
          setHeaders(hdrs);
          setMapping(guessMapping(hdrs));
          setRows(res.data);
          setStep(2);
        }
      });
    } else if (["xlsx","xls"].includes(ext)) {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const hdrs = (json[0] || []).map(String);
      const dataRows = (json.slice(1) || []).map((arr) => {
        const obj = {};
        hdrs.forEach((h, i) => { 
          // Convert all values to strings to avoid type issues, especially for phone numbers
          let value = arr[i];
          if (value !== null && value !== undefined) {
            // Convert to string and handle Excel number formatting
            value = String(value).trim();
            // If it looks like a phone number (all digits, 7-15 chars), keep as string
            if (/^\d{7,15}$/.test(value)) {
              obj[h] = value;
            } else {
              obj[h] = value;
            }
          } else {
            obj[h] = '';
          }
        });
        return obj;
      });
      setHeaders(hdrs);
      setMapping(guessMapping(hdrs));
      setRows(dataRows);
      setStep(2);
    } else {
      alert('Please upload a CSV or Excel file');
    }
  };

  const mappedPreview = useMemo(() => {
    return rows.slice(0, 20).map((r) => {
      const o = {};
      Object.entries(mapping).forEach(([src, dest]) => {
        if (!dest) return;
        o[dest] = r[src];
      });
      return o;
    });
  }, [rows, mapping]);

  const applyImport = async () => {
    console.log('=== IMPORT BUTTON CLICKED ===');
    console.log('Current step:', step);
    console.log('User ID:', userId);
    console.log('Rows to process:', rows.length);
    console.log('Mapping:', mapping);
    console.log('Default stage:', defaultStage);
    console.log('In dashboard:', inDashboard);
    
    setBusy(true);
    try{
      const leads = rows.map((r, index) => {
        const o = {};
        Object.entries(mapping).forEach(([src, dest]) => {
          if (!dest) return;
          let val = r[src];
          
          // Convert all values to strings first to avoid type issues
          if (val !== null && val !== undefined) {
            val = String(val).trim();
          }
          
          if (dest === 'price_min' || dest === 'price_max') {
            const n = parseInt(String(val||'').replace(/[^0-9]/g,''), 10);
            if (!isNaN(n)) val = n; else val = undefined;
          } else if (dest === 'source_tags' && typeof val === 'string') {
            val = val.split(',').map(s=>s.trim()).filter(Boolean);
          } else if (dest === 'phone' && val) {
            // Ensure phone numbers are always strings
            val = String(val).trim();
          }
          
          if (val !== undefined && val !== '') o[dest] = val;
        });
        console.log(`Processed lead ${index}:`, o);
        return o;
      });
      
      console.log('Final leads array to import:', leads);
      const payload = { user_id: userId, default_stage: defaultStage, in_dashboard: inDashboard, leads };
      console.log('Final payload:', payload);
      
      console.log('Calling onImportApi...');
      const res = await onImportApi(payload);
      console.log('Import API response:', res);
      
      setResult(res);
      if (res?.inserted_leads?.length) {
        console.log('Calling onImported with', res.inserted_leads.length, 'leads');
        onImported(res.inserted_leads);
      } else {
        console.log('No inserted_leads in response or empty array');
      }
      setStep(3);
      console.log('=== IMPORT COMPLETED SUCCESSFULLY ===');
    }catch(e){
      console.error('=== IMPORT ERROR ===', e);
      console.error('Error type:', typeof e);
      console.error('Error message:', e?.message);
      console.error('Error response:', e?.response);
      console.error('Error response data:', e?.response?.data);
      console.error('Error stack:', e?.stack);
      
      let errorMsg = 'Import failed';
      
      try {
        if (e?.response?.data) {
          const errorData = e.response.data;
          console.error('Processing backend error data:', errorData);
          
          if (typeof errorData === 'string') {
            errorMsg = errorData;
          } else if (errorData.detail) {
            if (typeof errorData.detail === 'string') {
              errorMsg = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
              // Handle pydantic validation errors
              errorMsg = `Validation error: ${errorData.detail.map(err => `${err.loc?.join('.')} - ${err.msg}`).join('; ')}`;
            } else {
              errorMsg = `Import failed: ${JSON.stringify(errorData.detail)}`;
            }
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMsg = `Import failed with ${errorData.errors.length} errors. First error: ${errorData.errors[0]?.reason || 'Unknown error'}`;
          } else {
            errorMsg = `Import failed with server error: ${JSON.stringify(errorData)}`;
          }
        } else if (e?.message) {
          errorMsg = e.message;
        } else {
          errorMsg = `Import failed: ${JSON.stringify(e)}`;
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        errorMsg = `Import failed with parsing error: ${String(e)}`;
      }
      
      console.error('Final error message to show:', errorMsg);
      alert(errorMsg);
    }finally{
      setBusy(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-800">Import Leads</Dialog.Title>

                {step === 1 && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border p-4 bg-slate-50">
                      <div className="text-sm font-medium mb-2">Upload CSV or Excel</div>
                      <input type="file" accept=".csv,.xlsx,.xls" onChange={(e)=> e.target.files && handleFile(e.target.files[0])} />
                      <div className="text-xs text-slate-500 mt-2">Max 10MB. First sheet will be parsed for Excel.</div>
                    </div>
                    <div className="rounded-xl border p-4 bg-white">
                      <div className="text-sm font-medium mb-2">Google Drive / Google Sheets</div>
                      <div className="text-xs text-slate-500">Coming soon. Click Connect to enable Google import.</div>
                      <button disabled className="mt-2 px-3 py-2 rounded-lg border text-sm text-slate-400">Connect Google (soon)</button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-4">
                    <div className="text-sm text-slate-600">File: <span className="font-medium text-slate-800">{fileName}</span></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Default Stage</div>
                        <select className="w-full px-2 py-1 rounded border" value={defaultStage} onChange={(e)=>setDefaultStage(e.target.value)}>
                          {STAGES.map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Add to Dashboard</div>
                        <select className="w-full px-2 py-1 rounded border" value={inDashboard? 'yes':'no'} onChange={(e)=>setInDashboard(e.target.value==='yes')}>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Map Columns</div>
                      <div className="overflow-auto border rounded-xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="text-left p-2">Source Column</th>
                              <th className="text-left p-2">Map To</th>
                            </tr>
                          </thead>
                          <tbody>
                            {headers.map(h => (
                              <tr key={h} className="border-t">
                                <td className="p-2">{h}</td>
                                <td className="p-2">
                                  <select className="px-2 py-1 rounded border" value={mapping[h] || ''} onChange={(e)=>setMapping(m=>({...m, [h]: e.target.value}))}>
                                    <option value="">Skip</option>
                                    {TARGET_FIELDS.map(tf => <option key={tf.key} value={tf.key}>{tf.label}</option>)}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Preview (first 20 rows)</div>
                      <div className="overflow-auto border rounded-xl">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              {Object.keys(mappedPreview[0] || {}).map(k => <th key={k} className="text-left p-2">{k}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {mappedPreview.map((r,i)=> (
                              <tr key={i} className="border-t">
                                {Object.keys(mappedPreview[0] || {}).map(k => <td key={k} className="p-2">{String(r[k] ?? '')}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button onClick={()=>setStep(1)} className="px-3 py-2 rounded-lg border text-sm">Back</button>
                      <button onClick={applyImport} disabled={busy} className={`px-3 py-2 rounded-lg text-white text-sm ${busy? 'bg-slate-300 cursor-not-allowed':'bg-emerald-600 hover:bg-emerald-700'}`}>{busy? 'Importing...':'Import'}</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-4">
                    <div className="text-sm">Imported: <span className="font-medium text-emerald-700">{result?.inserted || 0}</span> • Skipped: <span className="font-medium text-rose-700">{result?.skipped || 0}</span></div>
                    {!!(result?.errors?.length) && (
                      <div className="mt-2 text-xs text-slate-600">
                        <div className="font-medium">Errors</div>
                        <ul className="list-disc pl-5">
                          {result.errors.slice(0,10).map((e,i)=>(<li key={i}>Row {e.row}: {e.reason}</li>))}
                        </ul>
                        {result.errors.length > 10 && <div className="mt-1">+{result.errors.length-10} more</div>}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button onClick={handleClose} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">Done</button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}