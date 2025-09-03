import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

const E164 = /^\+[1-9]\d{7,14}$/;

export default function LeadDrawer({ open, lead, onClose, onSave, onDelete }){
  const [form, setForm] = useState(lead || {});
  useEffect(() => { setForm(lead || {}); }, [lead]);

  const errors = useMemo(() => {
    const e = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.phone && !E164.test(form.phone)) e.phone = "Use E.164 format e.g. +1234567890";
    if (form.price_min && isNaN(parseInt(form.price_min, 10))) e.price_min = "Enter a number";
    if (form.price_max && isNaN(parseInt(form.price_max, 10))) e.price_max = "Enter a number";
    return e;
  }, [form]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (Object.keys(errors).length) return;
    const payload = { ...form };
    if (payload.price_min && typeof payload.price_min === 'string') payload.price_min = parseInt(payload.price_min, 10);
    if (payload.price_max && typeof payload.price_max === 'string') payload.price_max = parseInt(payload.price_max, 10);
    if (Array.isArray(payload.source_tags)) { /* ok */ }
    else if (typeof payload.source_tags === 'string') payload.source_tags = payload.source_tags.split(',').map(s=>s.trim()).filter(Boolean);
    onSave(payload);
  };

  const confirmDelete = () => {
    if (!lead) return;
    if (window.confirm('Delete this lead? This cannot be undone.')) onDelete(lead.id);
  };

  if (!lead) return null;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-200" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="px-6 py-4 border-b">
                      <Dialog.Title className="text-lg font-semibold text-slate-800">Lead Details</Dialog.Title>
                      <div className="text-xs text-slate-500">ID: {lead.id}</div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-slate-600">First Name</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.first_name || ''} onChange={(e)=>update('first_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-slate-600">Last Name</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.last_name || ''} onChange={(e)=>update('last_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-slate-600">Email</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.email || ''} onChange={(e)=>update('email', e.target.value)} />
                        {errors.email && <div className="text-rose-600 text-xs mt-1">{errors.email}</div>}
                      </div>
                      <div>
                        <label className="text-slate-600">Phone (E.164)</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" placeholder="+1234567890" value={form.phone || ''} onChange={(e)=>update('phone', e.target.value)} />
                        {errors.phone && <div className="text-rose-600 text-xs mt-1">{errors.phone}</div>}
                      </div>
                      <div>
                        <label className="text-slate-600">Property Type</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.property_type || ''} onChange={(e)=>update('property_type', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-slate-600">Neighborhood</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.neighborhood || ''} onChange={(e)=>update('neighborhood', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-slate-600">Price Min</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_min ?? ''} onChange={(e)=>update('price_min', e.target.value)} />
                        {errors.price_min && <div className="text-rose-600 text-xs mt-1">{errors.price_min}</div>}
                      </div>
                      <div>
                        <label className="text-slate-600">Price Max</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_max ?? ''} onChange={(e)=>update('price_max', e.target.value)} />
                        {errors.price_max && <div className="text-rose-600 text-xs mt-1">{errors.price_max}</div>}
                      </div>
                      <div>
                        <label className="text-slate-600">Priority</label>
                        <select className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.priority || 'medium'} onChange={(e)=>update('priority', e.target.value)}>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-slate-600">Tags (comma separated)</label>
                        <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={Array.isArray(form.source_tags) ? form.source_tags.join(', ') : (form.source_tags || '')} onChange={(e)=>update('source_tags', e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-slate-600">Notes</label>
                        <textarea className="mt-1 w-full px-3 py-2 rounded-lg border h-24" value={form.notes || ''} onChange={(e)=>update('notes', e.target.value)} />
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                      <button onClick={confirmDelete} className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm">Delete Lead</button>
                      <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                        <button onClick={save} disabled={Object.keys(errors).length>0} className={`px-3 py-2 rounded-lg text-white text-sm ${Object.keys(errors).length>0? 'bg-slate-300 cursor-not-allowed':'bg-emerald-600 hover:bg-emerald-700'}`}>Save Changes</button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}