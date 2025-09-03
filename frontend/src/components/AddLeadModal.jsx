import React, { Fragment, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

const E164 = /^\+[1-9]\d{7,14}$/; // strict E.164 with + and 8-15 digits

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

  const errors = useMemo(() => {
    const e = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.phone && !E164.test(form.phone)) e.phone = "Use E.164 format e.g. +1234567890";
    if (form.price_min && isNaN(parseInt(form.price_min, 10))) e.price_min = "Enter a number";
    if (form.price_max && isNaN(parseInt(form.price_max, 10))) e.price_max = "Enter a number";
    return e;
  }, [form]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const save = () => {
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) return;
    const payload = {
      ...form,
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
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-slate-600">First Name</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.first_name} onChange={(e)=>update('first_name', e.target.value)} onBlur={()=>blur('first_name')} />
                  </div>
                  <div>
                    <label className="text-slate-600">Last Name</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.last_name} onChange={(e)=>update('last_name', e.target.value)} onBlur={()=>blur('last_name')} />
                  </div>
                  <div>
                    <label className="text-slate-600">Email (optional)</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="email" value={form.email} onChange={(e)=>update('email', e.target.value)} onBlur={()=>blur('email')} />
                    {touched.email && errors.email && <div className="text-rose-600 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="text-slate-600">Phone (E.164)</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" placeholder="+1234567890" value={form.phone} onChange={(e)=>update('phone', e.target.value)} onBlur={()=>blur('phone')} />
                    {touched.phone && errors.phone && <div className="text-rose-600 text-xs mt-1">{errors.phone}</div>}
                  </div>
                  <div>
                    <label className="text-slate-600">Property Type</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.property_type} onChange={(e)=>update('property_type', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-600">Neighborhood</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.neighborhood} onChange={(e)=>update('neighborhood', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-600">Price Min</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_min} onChange={(e)=>update('price_min', e.target.value)} onBlur={()=>blur('price_min')} />
                    {touched.price_min && errors.price_min && <div className="text-rose-600 text-xs mt-1">{errors.price_min}</div>}
                  </div>
                  <div>
                    <label className="text-slate-600">Price Max</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_max} onChange={(e)=>update('price_max', e.target.value)} onBlur={()=>blur('price_max')} />
                    {touched.price_max && errors.price_max && <div className="text-rose-600 text-xs mt-1">{errors.price_max}</div>}
                  </div>
                  <div>
                    <label className="text-slate-600">Priority</label>
                    <select className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.priority} onChange={(e)=>update('priority', e.target.value)}>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-600">Tags (comma separated)</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.source_tags} onChange={(e)=>update('source_tags', e.target.value)} placeholder="Website, Lead Generator AI" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-slate-600">Notes</label>
                    <textarea className="mt-1 w-full px-3 py-2 rounded-lg border h-24" value={form.notes} onChange={(e)=>update('notes', e.target.value)} />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={onClose} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                  <button onClick={save} disabled={Object.keys(errors).length>0} className={`px-3 py-2 rounded-lg text-white text-sm ${Object.keys(errors).length>0? 'bg-slate-300 cursor-not-allowed':'bg-emerald-600 hover:bg-emerald-700'}`}>Save Lead</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}