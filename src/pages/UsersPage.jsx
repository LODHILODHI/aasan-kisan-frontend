import { useEffect, useState } from 'react'
import { getAdminUsers, getRoles } from '../api/admin'
import { getApiError } from '../api/client'
import { cellValue } from '../utils/format'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [usersRes, rolesRes] = await Promise.all([getAdminUsers(), getRoles()])
      const u = usersRes.data?.items ?? usersRes.data ?? []
      const r = rolesRes.data?.items ?? rolesRes.data ?? []
      setUsers(Array.isArray(u) ? u : [])
      setRoles(Array.isArray(r) ? r : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <Header title="Admin users" subtitle="Staff accounts and role grants" />

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-6">
          <Card title={`${users.length} users`}>
            <Table
              columns={[
                { key: 'email', label: 'Email', render: (r) => cellValue(r.email) },
                {
                  key: 'roles',
                  label: 'Roles',
                  render: (r) => (
                    <div className="flex flex-wrap gap-1">
                      {(r.grants ?? []).map((g, i) => (
                        <Badge key={i} tone="info">
                          {cellValue(g.role ?? g)}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'active',
                  label: 'Status',
                  render: (r) => (
                    <Badge tone={r.active !== false ? 'success' : 'danger'}>
                      {r.active !== false ? 'active' : 'inactive'}
                    </Badge>
                  ),
                },
              ]}
              rows={users}
              emptyMessage="No admin users"
            />
          </Card>

          <Card title="Available roles" subtitle={`${roles.length} roles defined`}>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role.id ?? role.name ?? role.role}>{cellValue(role.name ?? role.role ?? role.id)}</Badge>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
