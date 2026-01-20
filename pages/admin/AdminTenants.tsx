import React, { useState } from 'react';
import { Search, MoreVertical, Shield, ShieldOff, Trash2, Mail, User } from 'lucide-react';

const AdminTenants = () => {
    // Mock data
    const [users] = useState([
        { id: 1, name: 'Paulo Argolo', email: 'fluowai@gmail.com', role: 'SUPER_ADMIN', status: 'ACTIVE', plan: 'Enterprise' },
        { id: 2, name: 'João Silva', email: 'joao.silva@exemplo.com', role: 'ADMIN', status: 'ACTIVE', plan: 'Profissional' },
        { id: 3, name: 'Marcos Dev', email: 'marcos@teste.com', role: 'AGENT', status: 'BLOCKED', plan: 'Básico' },
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Gestão de Usuários</h1>
                    <p className="text-slate-500 font-medium">Administre todos os clientes e acessos da plataforma.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-6 border-b border-slate-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            placeholder="Buscar por nome ou email..." 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-6">Usuário</th>
                                <th className="p-6">Cargo</th>
                                <th className="p-6">Plano</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                    <Mail size={12} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                                            user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                         <span className="font-bold text-slate-700">{user.plan}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                                            user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {user.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Bloquear/Desbloquear">
                                                {user.status === 'ACTIVE' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Excluir">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTenants;
