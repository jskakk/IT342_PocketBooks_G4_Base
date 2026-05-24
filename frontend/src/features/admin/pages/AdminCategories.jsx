import { useState, useEffect } from 'react'
import { apiUrl } from '../../../lib/api'
import AdminSidebar from '../components/AdminSidebar'

function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' })
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const authToken = localStorage.getItem('authToken')

  useEffect(() => {
    fetchCategories()
  }, [authToken])

  const fetchCategories = async () => {
    try {
      const response = await fetch(apiUrl('/api/admin/categories'), {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? apiUrl(`/api/admin/categories/${editingId}`) : apiUrl('/api/admin/categories')

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newCategory)
      })

      if (!response.ok) throw new Error('Failed to save category')

      setNewCategory({ name: '', icon: '' })
      setEditingId(null)
      setShowForm(false)
      setError('')
      fetchCategories()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (cat) => {
    setNewCategory({ name: cat.name, icon: cat.icon || '' })
    setEditingId(cat.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      const response = await fetch(apiUrl(`/api/admin/categories/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (!response.ok) throw new Error('Failed to delete')
      fetchCategories()
    } catch (err) {
      setError('Failed to delete category')
    }
  }

  if (loading) return <div className="dashboard-layout"><AdminSidebar active="categories" /><main><p>Loading...</p></main></div>

  return (
    <div className="dashboard-layout">
      <AdminSidebar active="categories" />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Category Management</h1>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setNewCategory({ name: '', icon: '' }); }}>
            + Add Category
          </button>
        </header>

        <div className="dashboard-content admin-full">
          {error && <div className="error-message">{error}</div>}

          {showForm && (
            <div className="form-card">
              <h2>{editingId ? 'Edit Category' : 'New Category'}</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Icon (emoji or name)"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save</button>
                  <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.icon || '-'}</td>
                  <td>{cat.name}</td>
                  <td>{new Date(cat.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(cat)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(cat.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

export default AdminCategories
