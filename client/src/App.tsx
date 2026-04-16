import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react'
import './App.css'

type Contact = {
  id: string
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
}

type ContactForm = Omit<Contact, 'id'>

type FieldErrors = Partial<Record<keyof ContactForm, string>>

const API_URL = 'http://localhost:8080/api/contacts'

const emptyForm: ContactForm = {
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
}

const normalize = (value: string) => value.trim().toLowerCase()

const validateContact = (data: ContactForm) => {
  const errors: FieldErrors = {}

  if (!data.firstName.trim()) errors.firstName = 'First name is required.'
  if (!data.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!data.address.trim()) errors.address = 'Address is required.'
  if (!data.city.trim()) errors.city = 'City is required.'
  if (!data.state.trim()) errors.state = 'State is required.'
  if (!data.zip.trim()) {
    errors.zip = 'Zip is required.'
  } else if (!/^\d{4,10}$/.test(data.zip.trim())) {
    errors.zip = 'Zip must be 4 to 10 digits.'
  }

  const phoneDigits = data.phone.replace(/\D/g, '')
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (phoneDigits.length < 7) {
    errors.phone = 'Phone number looks too short.'
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

const requestJson = async <T,>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }
  if (response.status === 204) {
    return null as T
  }
  return (await response.json()) as T
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadContacts = async () => {
      setLoading(true)
      try {
        const data = await requestJson<Contact[]>(API_URL)
        if (active) {
          setContacts(data)
          setMessage(null)
        }
      } catch (error) {
        if (active) {
          setMessage('Unable to load contacts from the server.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadContacts()

    return () => {
      active = false
    }
  }, [])

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts
    const query = normalize(search)
    return contacts.filter((contact) =>
      normalize(`${contact.firstName} ${contact.lastName}`).includes(query),
    )
  }, [contacts, search])

  const handleFieldChange = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setErrors({})
    setEditingId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateContact(form)

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const updated = await requestJson<Contact>(
          `${API_URL}/${editingId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(form),
          },
        )
        setContacts((prev) =>
          prev.map((contact) => (contact.id === editingId ? updated : contact)),
        )
      } else {
        const created = await requestJson<Contact>(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        })
        setContacts((prev) => [created, ...prev])
      }

      resetForm()
      setMessage(null)
    } catch (error) {
      setMessage('Unable to save changes to the server.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (contact: Contact) => {
    const { id, ...rest } = contact
    setEditingId(id)
    setForm(rest)
    setErrors({})
  }

  const deleteContact = async (contactId: string) => {
    setSaving(true)
    try {
      await requestJson(`${API_URL}/${contactId}`, { method: 'DELETE' })
      setContacts((prev) => prev.filter((contact) => contact.id !== contactId))
      if (editingId === contactId) {
        resetForm()
      }
      setMessage(null)
    } catch (error) {
      setMessage('Unable to delete contact from the server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Address Book System</p>
          <h1>Build your contacts, one person at a time.</h1>
          <p className="subhead">
            Create, edit, and remove people while keeping everything synced to
            your local server.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-label">Total Contacts</span>
              <span className="stat-value">{contacts.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Visible</span>
              <span className="stat-value">{filteredContacts.length}</span>
            </div>
          </div>
          <div className="status">
            <span>
              {loading
                ? 'Loading contacts from the server...'
                : 'Changes are saved to the server instantly.'}
            </span>
            {message ? <span className="status-error">{message}</span> : null}
          </div>
        </div>
        <div className="hero-card">
          <h2>What you can do</h2>
          <ul>
            <li>Capture full contact details and keep them organized.</li>
            <li>Add new people to your address book.</li>
            <li>Edit existing people by selecting their name.</li>
            <li>Delete any person from the collection.</li>
            <li>Manage multiple contacts at once.</li>
          </ul>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Create + Update</p>
              <h2>{editingId ? 'Edit Contact' : 'Add Contact'}</h2>
            </div>
            {editingId ? (
              <button
                className="ghost"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>First Name</span>
                <input
                  value={form.firstName}
                  onChange={(event) =>
                    handleFieldChange('firstName', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.firstName)}
                  disabled={saving}
                />
                {errors.firstName ? <small>{errors.firstName}</small> : null}
              </label>

              <label className="field">
                <span>Last Name</span>
                <input
                  value={form.lastName}
                  onChange={(event) =>
                    handleFieldChange('lastName', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.lastName)}
                  disabled={saving}
                />
                {errors.lastName ? <small>{errors.lastName}</small> : null}
              </label>

              <label className="field full">
                <span>Street Address</span>
                <input
                  value={form.address}
                  onChange={(event) =>
                    handleFieldChange('address', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.address)}
                  disabled={saving}
                />
                {errors.address ? <small>{errors.address}</small> : null}
              </label>

              <label className="field">
                <span>City</span>
                <input
                  value={form.city}
                  onChange={(event) =>
                    handleFieldChange('city', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.city)}
                  disabled={saving}
                />
                {errors.city ? <small>{errors.city}</small> : null}
              </label>

              <label className="field">
                <span>State</span>
                <input
                  value={form.state}
                  onChange={(event) =>
                    handleFieldChange('state', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.state)}
                  disabled={saving}
                />
                {errors.state ? <small>{errors.state}</small> : null}
              </label>

              <label className="field">
                <span>Zip</span>
                <input
                  value={form.zip}
                  onChange={(event) =>
                    handleFieldChange('zip', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.zip)}
                  disabled={saving}
                />
                {errors.zip ? <small>{errors.zip}</small> : null}
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    handleFieldChange('phone', event.target.value)
                  }
                  placeholder="+91 "
                  aria-invalid={Boolean(errors.phone)}
                  disabled={saving}
                />
                {errors.phone ? <small>{errors.phone}</small> : null}
              </label>

              <label className="field full">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    handleFieldChange('email', event.target.value)
                  }
                  placeholder=""
                  aria-invalid={Boolean(errors.email)}
                  disabled={saving}
                />
                {errors.email ? <small>{errors.email}</small> : null}
              </label>
            </div>

            <div className="form-actions">
              <button className="primary" type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : editingId
                  ? 'Save Changes'
                  : 'Add Contact'}
              </button>
              <button
                className="ghost"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Clear Form
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">View + Manage</p>
              <h2>Contacts</h2>
            </div>
            <span className="badge">{contacts.length}</span>
          </div>

          <div className="search-row">
            <input
              className="search"
              placeholder="Search by name to edit or delete"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={loading}
            />
            <button
              className="ghost"
              type="button"
              onClick={() => setSearch('')}
              disabled={loading}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading contacts...</p>
              <span>Waiting for the server to respond.</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="empty-state">
              <p>No contacts yet.</p>
              <span>Add a person to start building your address book.</span>
            </div>
          ) : (
            <ul className="contact-list">
              {filteredContacts.map((contact, index) => (
                <li
                  key={contact.id}
                  className="contact-card"
                  style={{ '--delay': `${index * 60}ms` } as CSSProperties}
                >
                  <div className="contact-main">
                    <div>
                      <h3>
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <p className="contact-line">{contact.address}</p>
                      <p className="contact-line">
                        {contact.city}, {contact.state} {contact.zip}
                      </p>
                    </div>
                    <div className="contact-meta">
                      <span>{contact.phone}</span>
                      <span>{contact.email}</span>
                    </div>
                  </div>
                  <div className="contact-actions">
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => startEdit(contact)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => deleteContact(contact.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
