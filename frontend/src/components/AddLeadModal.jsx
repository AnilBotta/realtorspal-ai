import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

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
    ...(defaultValues || {}),
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
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
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-800">Add Lead</Dialog.Title>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-slate-600">First Name</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.first_name} onChange={(e)=>update('first_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-600">Last Name</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.last_name} onChange={(e)=>update('last_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-600">Email</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="email" value={form.email} onChange={(e)=>update('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-600">Phone</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" value={form.phone} onChange={(e)=>update('phone', e.target.value)} />
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
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_min} onChange={(e)=>update('price_min', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-slate-600">Price Max</label>
                    <input className="mt-1 w-full px-3 py-2 rounded-lg border" type="number" value={form.price_max} onChange={(e)=>update('price_max', e.target.value)} />
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
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button onClick={onClose} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                  <button onClick={save} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm">Save Lead</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}