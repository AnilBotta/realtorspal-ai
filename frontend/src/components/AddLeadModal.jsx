import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

const E164 = /^\+[1-9]\d{7,14}$/; // strict E.164 with + and 8-15 digits

const PROPERTY_TYPES = [
  "1BR Apartment","2BR Apartment","3BR Apartment",
  "2BR Condo","3BR Condo","4BR Condo",
  "2BR Townhouse","3BR Townhouse","4BR Townhouse",
  "3BR House","4BR House","5BR House"
];

const BUDGET_PRESETS = [
  { label: "Under $200K", min: 0, max: 200_000 },
  { label: "$200K - $300K", min: 200_000, max: 300_000 },
  { label: "$300K - $400K", min: 300_000, max: 400_000 },
  { label: "$400K - $500K", min: 400_000, max: 500_000 },
  { label: "$500K - $650K", min: 500_000, max: 650_000 },
  { label: "$650K - $800K", min: 650_000, max: 800_000 },
  { label: "$800K - $1M", min: 800_000, max: 1_000_000 },
  { label: "$1M - $1.5M", min: 1_000_000, max: 1_500_000 },
  { label: "$1.5M - $2M", min: 1_500_000, max: 2_000_000 },
  { label: "$2M+", min: 2_000_000, max: null },
  { label: "Custom Range", min: null, max: null, custom: true }
];

const LOCATIONS = [
  "Downtown","Midtown","Uptown","Suburbs","Waterfront","Historic District",
  "Business District","Residential Area","Luxury District","Other"
];

function normalizePhone(p){
  if (!p) return p;
  const trimmed = String(p).replace(/\s|-/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  // If numeric and reasonable length, prefix '+'
  if (/^[0-9]{8,15}$/.test(trimmed)) return "+" + trimmed;
  return p; // return as-is, will be validated and blocked
}

export default function AddLeadModal({ open, onClose, onCreate, defaultValues }){
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    property_type: "",
    neighborhood: "",
    price_min: "",
    price_max: "",
    priority: "medium",
    source_tags: "",
    notes: "",
    ...(defaultValues || {}),
  });
  const [touched, setTouched] = useState({});
  const [budgetPreset, setBudgetPreset] = useState("");

  const errors = useMemo(() => {
    const e = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.phone) {
      const normalized = normalizePhone(form.phone);
      if (!E164.test(normalized)) e.phone = "Use E.164 format e.g. +1234567890";
    }
    if (form.price_min && isNaN(parseInt(form.price_min, 10))) e.price_min = "Enter a number";
    if (form.price_max && isNaN(parseInt(form.price_max, 10))) e.price_max = "Enter a number";
    return e;
  }, [form]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const onChangeBudget = (val) => {
    setBudgetPreset(val);
    const preset = BUDGET_PRESETS.find(p => p.label === val);
    if (!preset) return;
    if (preset.custom) {
      // Allow manual entry
      return;
    }
    // Pre-fill price range
    update('price_min', preset.min ?? "");
    update('price_max', preset.max ?? "");
  };

  const save = () => {
    // Keep the button active but block save if critical errors persist
    const normalizedPhone = normalizePhone(form.phone);
    const hasPhoneError = !!(normalizedPhone && !E164.test(normalizedPhone));
    const hasEmailError = !!(form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));
    const hasNumError = !!((form.price_min && isNaN(parseInt(form.price_min, 10))) || (form.price_max && isNaN(parseInt(form.price_max, 10))));

    if (hasPhoneError || hasEmailError || hasNumError) {
      setTouched({ email: true, phone: true, price_min: true, price_max: true });
      return;
    }

    const payload = {
      ...form,
      phone: normalizedPhone || undefined,
      price_min: form.price_min ? parseInt(form.price_min, 10) : undefined,
      price_max: form.price_max ? parseInt(form.price_max, 10) : undefined,
      source_tags: form.source_tags ? form.source_tags.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    };
    onCreate(payload);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-800">Add Lead</Dialog.Title>

                {/* Personal Information */}
                <div className="mt-4">
                  <div className="text-sm font-medium text-slate-700 mb-2">Personal Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-slate-600">Full Name</label>
                      <input className="mt-1 w-full px-3 py-2 rounded-lg border" placeholder="e.g., John Doe" value={`${form.first_name}`.trim() || ''} onChange={(e)=>update('first_name', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-slate-600">Email Address (optional)</label>
                      <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="email" value={form.email} onChange={(e)=>update('email', e.target.value)} onBlur={()=>blur('email')} />
                      {touched.email && errors.email && <div className="text-rose-600 text-xs mt-1">{errors.email}</div>}
                    </div>
                    <div>
                      <label className="text-slate-600">Phone Number (E.164)</label>
                      <input className="mt-1 w-full px-3 py-2 rounded-lg border" placeholder="+1 555 123 4567" value={form.phone} onChange={(e)=>update('phone', e.target.value)} onBlur={()=>{ blur('phone'); update('phone', normalizePhone(form.phone)); }} />
                      {touched.phone && errors.phone && <div className="text-rose-600 text-xs mt-1">{errors.phone}</div>}
                    </div>
                    <div>
                      <label className="text-slate-600">Priority Level</label>
                      <select className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.priority} onChange={(e)=>update('priority', e.target.value)}>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Property Requirements */}
                <div className="mt-6">
                  <div className="text-sm font-medium text-slate-700 mb-2">Property Requirements</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-slate-600">Property Type</label>
                      <select className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.property_type} onChange={(e)=>update('property_type', e.target.value)}>
                        <option value="">Select property type</option>
                        {PROPERTY_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600">Budget Range</label>
                      <select className="mt-1 w-full px-3 py-2 rounded-lg border" value={budgetPreset} onChange={(e)=>onChangeBudget(e.target.value)}>
                        <option value="">Select budget range</option>
                        {BUDGET_PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600">Price Min</label>
                      <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_min} onChange={(e)=>update('price_min', e.target.value)} disabled={budgetPreset && !BUDGET_PRESETS.find(p=>p.label===budgetPreset)?.custom} />
                      {touched.price_min && errors.price_min && <div className="text-rose-600 text-xs mt-1">{errors.price_min}</div>}
                    </div>
                    <div>
                      <label className="text-slate-600">Price Max</label>
                      <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_max} onChange={(e)=>update('price_max', e.target.value)} disabled={budgetPreset && !BUDGET_PRESETS.find(p=>p.label===budgetPreset)?.custom} />
                      {touched.price_max && errors.price_max && <div className="text-rose-600 text-xs mt-1">{errors.price_max}</div>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-slate-600">Preferred Location</label>
                      <select className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.neighborhood} onChange={(e)=>update('neighborhood', e.target.value)}>
                        <option value="">Select preferred location</option>
                        {LOCATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6">
                  <div className="text-sm font-medium text-slate-700 mb-2">Additional Information</div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <label className="text-slate-600">Tags (comma separated)</label>
                      <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.source_tags} onChange={(e)=>update('source_tags', e.target.value)} placeholder="Website, Lead Generator AI" />
                    </div>
                    <div>
                      <label className="text-slate-600">Notes (Optional)</label>
                      <textarea className="mt-1 w-full px-3 py-2 rounded-lg border h-24" value={form.notes} onChange={(e)=>update('notes', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={onClose} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                  {/* Keep the button active; we still block in save() if errors remain */}
                  <button onClick={save} className={`px-3 py-2 rounded-lg text-white text-sm bg-emerald-600 hover:bg-emerald-700`}>Save Lead</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}