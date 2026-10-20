
import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'

const API = 'http://localhost:3001/products'

async function requestProducts(url = API, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error('Request failed. Is JSON Server running?')
  if (response.status === 204) return null
  return response.json()
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>ShopAdmin</span>
        </NavLink>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <NavLink to="/" end className="nav-link">⌂ <span>Dashboard</span></NavLink>
          <NavLink to="/products" className="nav-link">▤ <span>Products</span></NavLink>
          <NavLink to="/products/new" className="nav-link">＋ <span>Add product</span></NavLink>
          <NavLink to="/assistant" className="nav-link">✧ <span>AI assistant</span></NavLink>
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">A</span>
          <div><strong>Administrator</strong><small>Store manager</small></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>Store management / <strong>Overview</strong></span>
          <span className="status"><i /> Admin workspace</span>
        </header>
        {children}
      </main>
    </div>
  )
}

function Dashboard() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    requestProducts()
      .then(setProducts)
      .catch(() => setError('Unable to load products. Start the JSON Server with npm run server.'))
  }, [])

  const inventory = products.reduce((sum, p) => sum + Number(p.stock || 0), 0)
  const value = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0)

  return (
    <section className="page">
      <div className="welcome">
        <div><p className="eyebrow">YOUR STORE AT A GLANCE</p><h1>Dashboard</h1>
          <p className="muted">Welcome back! Here's what's happening with your store.</p></div>
        <NavLink className="button primary" to="/products/new">＋ Add product</NavLink>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="stats-grid">
        <Stat label="Total products" value={products.length} icon="▤" />
        <Stat label="Units in stock" value={inventory} icon="▦" />
        <Stat label="Inventory value" value={`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon="$" />
      </div>
      <section className="panel">
        <div className="panel-heading"><div><h2>Recent products</h2><p className="muted">Products currently in your inventory</p></div>
          <NavLink to="/products" className="text-link">View all →</NavLink></div>
        <ProductTable products={products.slice(0, 5)} />
        {products.length === 0 && !error && <p className="empty">Loading products…</p>}
      </section>
    </section>
  )
}

function Stat({ label, value, icon }) {
  return <article className="stat-card"><span className="stat-icon">{icon}</span><p className="muted">{label}</p><strong>{value}</strong><small>Current inventory</small></article>
}

function ProductTable({ products, onEdit }) {
  if (!products.length) return <p className="empty">No products found.</p>
  return (
    <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th /></tr></thead>
      <tbody>{products.map(p => <tr key={p.id}><td><div className="product-cell"><span className="product-icon">▧</span><div><strong>{p.name}</strong><small>#{p.id}</small></div></div></td>
        <td>{p.category || 'Uncategorized'}</td><td>${Number(p.price).toFixed(2)}</td><td>{p.stock}</td>
        <td><span className={`pill ${Number(p.stock) > 0 ? 'in-stock' : 'out-stock'}`}>{Number(p.stock) > 0 ? 'In stock' : 'Out of stock'}</span></td>
        <td>{onEdit && <NavLink className="text-link" to={`/products/${p.id}/edit`}>Edit</NavLink>}</td>
      </tr>)}</tbody></table></div>
  )
}

function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    requestProducts().then(setProducts).catch(() => setError('Could not load products. Is JSON Server running?'))
  }, [])

  const filtered = products.filter(p =>
    [p.name, p.category, p.description].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  )

  return <section className="page">
    <div className="welcome"><div><p className="eyebrow">INVENTORY MANAGEMENT</p><h1>Products</h1><p className="muted">Search, review, and update your catalog.</p></div>
      <NavLink className="button primary" to="/products/new">＋ Add product</NavLink></div>
    <div className="search-row"><input aria-label="Search products" placeholder="Search by name, category, or description…" value={search} onChange={e => setSearch(e.target.value)} /><span>{filtered.length} products</span></div>
    {error && <p className="error">{error}</p>}
    <section className="panel"><ProductTable products={filtered} onEdit /></section>
  </section>
}

const emptyForm = { name: '', price: '', description: '', category: '', stock: '' }

function ProductForm({ edit = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(edit)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!edit) return
    requestProducts(`${API}/${id}`)
      .then(p => setForm({ name: p.name || '', price: String(p.price ?? ''), description: p.description || '', category: p.category || '', stock: String(p.stock ?? '') }))
      .catch(() => setError('Unable to load this product.'))
      .finally(() => setLoading(false))
  }, [edit, id])

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = { name: form.name.trim(), price: Number(form.price), description: form.description.trim(), category: form.category.trim(), stock: Number(form.stock) }
      if (!data.name || !data.category || form.price === '' || form.stock === '' || !Number.isFinite(data.price) || data.price < 0 || !Number.isInteger(data.stock) || data.stock < 0) {
        setError('Enter a name and category, a valid non-negative price, and a whole-number stock quantity.')
        return
      }
      await requestProducts(edit ? `${API}/${id}` : API, {
        method: edit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      navigate('/products')
    } catch (err) {
      setError(err.message || 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="page"><p>Loading product…</p></section>

  return <section className="page form-page">
    <p className="eyebrow">INVENTORY MANAGEMENT</p><h1>{edit ? 'Edit product' : 'Add a product'}</h1>
    <p className="muted">{edit ? 'Update product details and save your changes.' : 'Add a new item to your store catalog.'}</p>
    <form className="panel product-form" onSubmit={submit}>
      <div className="form-grid">
        <label>Product name<input name="name" value={form.name} onChange={update} required placeholder="e.g. Running Shoes" /></label>
        <label>Category<input name="category" value={form.category} onChange={update} required placeholder="e.g. Shoes" /></label>
        <label>Price ($)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} required /></label>
        <label>Stock quantity<input name="stock" type="number" min="0" step="1" value={form.stock} onChange={update} required /></label>
        <label className="full-width">Description<textarea name="description" value={form.description} onChange={update} rows="4" placeholder="Describe the product…" /></label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions"><NavLink className="button secondary" to="/products">Cancel</NavLink><button className="button primary" disabled={saving}>{saving ? 'Saving…' : edit ? 'Save changes' : 'Create product'}</button></div>
    </form>
  </section>
}


function Assistant() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function askAssistant(e) {
    e.preventDefault()
    if (!question.trim() || loading) return

    setLoading(true)
    setAnswer('')
    setError('')

    try {
      const response = await fetch('http://localhost:3002/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed.')
      }

      setAnswer(data.answer || 'The assistant returned an empty answer.')
    } catch (err) {
      setError(err.message || 'Could not connect to the AI backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">STORE SUPPORT</p>
      <h1>AI assistant</h1>
      <p className="muted">
        Get practical advice for managing your store.
      </p>

      <div className="panel assistant-panel">
        <span className="assistant-icon">✧</span>
        <h2>How can I help?</h2>

        <form onSubmit={askAssistant}>
          <label>
            Ask a product management question
            <textarea
              rows="3"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How can I improve inventory management?"
              required
            />
          </label>

          <button
            className="button primary"
            type="submit"
            disabled={!question.trim() || loading}
          >
            {loading ? 'Thinking…' : 'Ask assistant'}
          </button>
        </form>

        {error && <p className="error" role="alert">{error}</p>}

        {answer && (
          <div className="notice assistant-answer" aria-live="polite">
            {answer}
          </div>
        )}
      </div>
    </section>
  )
}


function AppContent() {
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/products" element={<Products />} />
    <Route path="/products/new" element={<ProductForm />} />
    <Route path="/products/:id/edit" element={<ProductForm edit />} />
    <Route path="/assistant" element={<Assistant />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Layout>
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>
}

