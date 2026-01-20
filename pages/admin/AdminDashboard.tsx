import React, { useState } from 'react';
import { Users, MessageSquare, Building2, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
    // Mock data for now
    const stats = [
        { label: 'Total de Clientes', value: '12', icon: <Building2 className="text-blue-600" size={24} />, change: '+2 esse mês' },
        { label: 'Instâncias Ativas', value: '34', icon: <MessageSquare className="text-green-600" size={24} />, change: '+5% vs mês passado' },
        { label: 'Usuários Totais', value: '148', icon: <Users className="text-purple-600" size={24} />, change: '+12 novos' },
        { label: 'ReceitaMRR', value: 'R$ 4.2k', icon: <TrendingUp className="text-orange-600" size={24} />, change: '+15%' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Visão Geral</h1>
                <p className="text-slate-500 font-medium">Bem-vindo ao painel de controle mestre.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                {stat.icon}
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-1">{stat.value}</h3>
                        <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                 <h3 className="text-xl font-bold text-slate-900 mb-6">Atividade Recente dos Tenants</h3>
                 <div className="text-center py-12 text-slate-400">
                    <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhuma atividade recente registrada.</p>
                 </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
