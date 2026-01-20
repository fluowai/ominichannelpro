import React, { useState } from 'react';
import { Plus, Check, Edit2, Trash2, Package } from 'lucide-react';

const AdminPlans = () => {
    // Mock data for initial visualization
    const [plans, setPlans] = useState([
        { id: 1, name: 'Básico', price: 99.90, instances: 1, agents: 2, users: 3 },
        { id: 2, name: 'Profissional', price: 199.90, instances: 3, agents: 10, users: 10 },
        { id: 3, name: 'Enterprise', price: 499.90, instances: 10, agents: 50, users: 999 },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: '', instances: 1, agents: 1, users: 1 });

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      // Logic to be implemented later with backend
      setPlans([...plans, { ...formData, id: Date.now(), price: Number(formData.price) }]);
      setShowModal(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Planos e Cobrança</h1>
                    <p className="text-slate-500 font-medium">Defina os pacotes disponíveis para seus clientes.</p>
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                >
                    <Plus size={20} />
                    Novo Plano
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-500">
                             <Package size={120} />
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-sm font-bold text-slate-400">R$</span>
                                <span className="text-4xl font-black text-orange-600">{plan.price.toFixed(2)}</span>
                                <span className="text-sm font-bold text-slate-400">/mês</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {plan.instances} Instâncias WhatsApp
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                         <Check size={14} strokeWidth={3} />
                                    </div>
                                    {plan.agents} Agentes de IA
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                         <Check size={14} strokeWidth={3} />
                                    </div>
                                    {plan.users} Usuários por equipe
                                </li>
                            </ul>

                            <div className="flex gap-3">
                                <button className="flex-1 py-3 bg-slate-50 text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all">
                                    Editar
                                </button>
                                <button className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal for Demo */}
            {showModal && (
                 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
                        <h2 className="text-2xl font-black mb-6">Novo Plano</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                                <input required className="w-full bg-slate-50 border-none p-3 rounded-xl" onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Preço (R$)</label>
                                <input required type="number" className="w-full bg-slate-50 border-none p-3 rounded-xl" onChange={e => setFormData({...formData, price: e.target.value})} />
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-orange-600 text-white rounded-xl font-bold">Criar</button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default AdminPlans;
