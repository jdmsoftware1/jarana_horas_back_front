import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api`;
};

const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

const AbsenceCategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    icon: '📅',
    requiresApproval: true,
    isPaid: null,
    maxDaysPerYear: null,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${getApiUrl()}/absence-categories/all`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingCategory
        ? `${getApiUrl()}/absence-categories/${editingCategory.id}`
        : `${getApiUrl()}/absence-categories`;
      
      const response = await authenticatedFetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
        fetchCategories();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/absence-categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Categoría eliminada');
        fetchCategories();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
      color: category.color,
      icon: category.icon,
      requiresApproval: category.requiresApproval,
      isPaid: category.isPaid,
      maxDaysPerYear: category.maxDaysPerYear,
      isActive: category.isActive,
      sortOrder: category.sortOrder
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      color: '#3B82F6',
      icon: '📅',
      requiresApproval: true,
      isPaid: null,
      maxDaysPerYear: null,
      isActive: true,
      sortOrder: 0
    });
  };

  const initializeDefaults = async () => {
    if (!confirm('¿Inicializar categorías por defecto? Esto no afectará las existentes.')) return;

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/absence-categories/initialize-defaults`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.created} categorías creadas, ${data.skipped} ya existían`);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
      alert('Error al inicializar categorías');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-dark font-serif">
            Categorías de Ausencias
          </h2>
          <p className="text-brand-medium mt-1">
            Gestiona las categorías personalizadas de ausencias
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={initializeDefaults}
            className="px-4 py-2 text-sm border border-brand-light text-brand-light rounded-lg hover:bg-brand-light/10 transition-colors"
          >
            Inicializar por defecto
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium transition-colors flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-mid/20 sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-neutral-dark">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-brand-medium hover:text-neutral-dark"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                    placeholder="EJEMPLO_CODIGO"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-dark mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-neutral-mid/30 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Icono (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none text-center text-2xl"
                    maxLength="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    ¿Es pagado?
                  </label>
                  <select
                    value={formData.isPaid === null ? 'null' : formData.isPaid.toString()}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isPaid: e.target.value === 'null' ? null : e.target.value === 'true' 
                    })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                  >
                    <option value="null">Depende del caso</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">
                    Máx. días/año
                  </label>
                  <input
                    type="number"
                    value={formData.maxDaysPerYear || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      maxDaysPerYear: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-full px-3 py-2 border border-neutral-mid/30 rounded-lg focus:border-brand-light focus:ring-0 focus:outline-none"
                    placeholder="Sin límite"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    className="rounded border-neutral-mid/30"
                  />
                  <span className="text-sm text-neutral-dark">Requiere aprobación</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-neutral-mid/30"
                  />
                  <span className="text-sm text-neutral-dark">Activa</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-mid/20">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-brand-medium hover:text-neutral-dark"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-mid/20 overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-mid/20">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Aprobación
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Pagado
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-dark uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-mid/20">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-neutral-light/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-dark">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-xs text-brand-medium">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-neutral-light px-2 py-1 rounded">
                    {category.code}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {category.requiresApproval ? (
                    <Check className="inline text-green-500" size={18} />
                  ) : (
                    <X className="inline text-gray-400" size={18} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {category.isPaid === null ? (
                    <span className="text-xs text-brand-medium">Variable</span>
                  ) : category.isPaid ? (
                    <Check className="inline text-green-500" size={18} />
                  ) : (
                    <X className="inline text-red-500" size={18} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    category.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {category.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-brand-light hover:text-brand-medium mr-3"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  {!category.isSystem && (
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {category.isSystem && (
                    <span className="text-xs text-brand-medium" title="Categoría del sistema">
                      🔒
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-brand-medium mb-4" size={48} />
            <p className="text-brand-medium">No hay categorías configuradas</p>
            <button
              onClick={initializeDefaults}
              className="mt-4 px-4 py-2 bg-brand-light text-brand-cream rounded-lg hover:bg-brand-medium"
            >
              Inicializar categorías por defecto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenceCategoryManager;
