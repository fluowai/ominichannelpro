
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  ArrowUpRight,
  Zap,
  Clock,
  CheckCircle,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

// Mock data for charts (until we implement history endpoint)
const chartData = [
  { name: 'Seg', leads: 40, vendas: 24, amt: 2400 },
  { name: 'Ter', leads: 30, vendas: 13, amt: 2210 },
  { name: 'Qua', leads: 20, vendas: 58, amt: 2290 },
  { name: 'Qui', leads: 27, vendas: 39, amt: 2000 },
  { name: 'Sex', leads: 18, vendas: 48, amt: 2181 },
  { name: 'Sáb', leads: 23, vendas: 38, amt: 2500 },
  { name: 'Dom', leads: 34, vendas: 43, amt: 2100 },
];

const StatCard = ({ title, value, change, icon: Icon, color, loading }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} className="text-white" />
      </div>
      <span className={`flex items-center gap-1 text-sm font-bold ${
        change >= 0 ? 'text-emerald-500' : 'text-red-500'
      } bg-slate-50 px-2 py-1 rounded-lg`}>
        {change >= 0 ? '+' : ''}{change}%
        <ArrowUpRight size={14} />
      </span>
    </div>
    
    <div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <h3 className="text-3xl font-black text-slate-900">{value}</h3>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartDataState, setChartDataState] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getHistory()
        ]);
        setStats(statsRes.data);
        setChartDataState(historyRes.data.history);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast.error('Erro ao atualizar dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-10 font-['Poppins'] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Visão Geral</h1>
        <p className="text-slate-500 font-medium">Acompanhe o desempenho dos seus agentes em tempo real.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Total de Conversas" 
          value={stats?.conversations.total || 0}
          change={12} 
          icon={MessageSquare} 
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard 
          title="Agentes Ativos" 
          value={stats?.agents.active || 0}
          change={5} 
          icon={Zap} 
          color="bg-orange-500"
          loading={loading}
        />
        <StatCard 
          title="Mensagens Hoje" 
          value={stats?.messages.today || 0}
          change={8} 
          icon={TrendingUp} 
          color="bg-purple-500"
          loading={loading}
        />
        <StatCard 
          title="Campanhas" 
          value={stats?.campaigns.total || 0}
          change={-2} 
          icon={Users} 
          color="bg-pink-500"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Fluxo de Conversas</h3>
              <p className="text-sm text-slate-400 font-medium">Interações nos últimos 7 dias</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <MoreVertical size={20} className="text-slate-400" />
            </button>
          </div>
          
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataState.length > 0 ? chartDataState : chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{color: '#fff'}}
                  cursor={{stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#f97316" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Conversão</h3>
            <p className="text-slate-400 text-sm mb-8">Performance dos agentes</p>

            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black">84%</span>
              <span className="text-emerald-400 font-bold mb-2 flex items-center">
                +4.2% <ArrowUpRight size={16} />
              </span>
            </div>

            <div className="h-[200px] w-full mt-8" style={{ minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataState.length > 0 ? chartDataState : chartData}>
                  <Bar 
                    dataKey="vendas" 
                    fill="#f97316" 
                    radius={[4, 4, 4, 4]} 
                    barSize={8}
                  />
                  <XAxis hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.1)'}}
                    contentStyle={{borderRadius: '12px', border: 'none'}}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
