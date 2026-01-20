
import React, { useState, useEffect } from 'react';
import { Plus, Search, Home, MapPin, Bed, Bath, AlertCircle, Loader2, X, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface Property {
    id: string;
    code: string;
    title: string;
    description: string;
    price: number;
    type: string;
    city: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    status: string;
    images: string[];
}

export default function Properties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        price: '',
        type: 'APARTMENT',
        city: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        imageUrl: '' // Simple URL input for now
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const { data } = await api.get('/properties');
            setProperties(data);
        } catch (error) {
            console.error('Error fetching properties', error);
            // toast.error('Erro ao carregar imóveis'); // API might not exist yet
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                area: Number(formData.area),
                images: formData.imageUrl ? [formData.imageUrl] : []
            };

            if (editingProperty) {
                await api.put(`/properties/${editingProperty.id}`, payload);
                toast.success('Imóvel atualizado!');
            } else {
                await api.post('/properties', payload);
                toast.success('Imóvel cadastrado!');
            }
            setShowModal(false);
            fetchProperties();
        } catch (error) {
            toast.error('Erro ao salvar imóvel');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await api.delete(`/properties/${id}`);
            toast.success('Imóvel removido!');
            fetchProperties();
        } catch (error) {
            toast.error('Erro ao remover');
        }
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setFormData({
            code: property.code,
            title: property.title,
            description: property.description,
            price: property.price.toString(),
            type: property.type,
            city: property.city,
            bedrooms: property.bedrooms.toString(),
            bathrooms: property.bathrooms.toString(),
            area: property.area.toString(),
            imageUrl: property.images[0] || ''
        });
        setShowModal(true);
    };

    const openNew = () => {
        setEditingProperty(null);
        setFormData({
            code: '', title: '', description: '', price: '', type: 'APARTMENT', city: '', bedrooms: '', bathrooms: '', area: '', imageUrl: ''
        });
        setShowModal(true);
    };

    const filtered = properties.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="p-10 max-w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Imóveis</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Gerencie seu catálogo imobiliário para os agentes.</p>
                </div>
                <button onClick={openNew} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center gap-2">
                    <Plus size={20} />
                    Novo Imóvel
                </button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por título ou código..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-100 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">
                        <Home size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhum imóvel encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filtered.map(property => (
                            <div key={property.id} className="border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                                <div className="h-48 bg-slate-200 relative">
                                    {property.images[0] ? (
                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Home size={32} /></div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(property)} className="p-2 bg-white rounded-lg shadow-md hover:bg-orange-50 text-orange-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(property.id)} className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                    <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
                                        {property.code}
                                    </span>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 line-clamp-1">{property.title}</h3>
                                        <span className="text-orange-600 font-black text-lg">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{property.description}</p>
                                    
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms}</span>
                                        <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {property.city}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900">{editingProperty ? 'Editar Imóvel' : 'Novo Imóvel'}</h2>
                                <button type="button" onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Código</label>
                                    <input required className="w-full px-4 py-2 bg-slate-50 border rounded-xl" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Preço</label>
                                    <input required type="number" className="w-full px-4 py-2 bg-slate-50 border rounded-xl" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                    <input required className="w-full px-4 py-2 bg-slate-50 border rounded-xl" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                                    <textarea required className="w-full px-4 py-2 bg-slate-50 border rounded-xl h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">URL da Imagem (Capa)</label>
                                    <input className="w-full px-4 py-2 bg-slate-50 border rounded-xl" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Cidade</label>
                                    <input required className="w-full px-4 py-2 bg-slate-50 border rounded-xl" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                                    <select className="w-full px-4 py-2 bg-slate-50 border rounded-xl" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                        <option value="APARTMENT">Apartamento</option>
                                        <option value="HOUSE">Casa</option>
                                        <option value="LAND">Terreno</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-2 col-span-2">
                                    <div><label className="text-xs font-bold">Quartos</label><input type="number" className="w-full px-2 py-2 border rounded-xl" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold">Banheiros</label><input type="number" className="w-full px-2 py-2 border rounded-xl" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold">Área (m²)</label><input type="number" className="w-full px-2 py-2 border rounded-xl" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} /></div>
                                </div>
                            </div>
                            
                            <button className="w-full mt-8 bg-orange-600 text-white font-bold py-4 rounded-2xl hover:bg-orange-700">Salvar Imóvel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
