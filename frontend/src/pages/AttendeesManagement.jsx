import React, { useEffect, useState } from 'react';
import api from '../api';
import { Trash2, UserCheck, UserPlus, RefreshCw, AlertCircle, Edit3 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';

const emptyForm = { username: '', password: '', full_name: '', phone: '', email: '', role: 'attendee' };

const EmployeesManagement = () => {
  const [attendees, setAttendees] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendees');
      setAttendees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to load attendees' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

  const isDuplicateUsername = (username) => {
    const normalized = username.trim().toLowerCase();
    return attendees.some((attendee) => attendee.username?.toLowerCase() === normalized);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const username = formData.username.trim();

    if (!username) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }

    if (!editingEmployeeId && isDuplicateUsername(username)) {
      setMessage({ type: 'error', text: 'That username is already in use. Please choose a different one.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      username: formData.username.trim(),
      password: formData.password || undefined,
      full_name: formData.full_name.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      role: formData.role,
    };

    try {
      if (editingEmployeeId) {
        const updatePayload = { ...payload };
        if (!updatePayload.password) delete updatePayload.password;
        await api.put(`/attendees/${editingEmployeeId}`, updatePayload);
        setMessage({ type: 'success', text: 'Employee updated successfully.' });
      } else {
        await api.post('/attendees', payload);
        setMessage({ type: 'success', text: 'Employee created successfully.' });
      }

      setFormData(emptyForm);
      setEditingEmployeeId(null);
      fetchAttendees();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save employee' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployeeId(employee.id);
    setFormData({
      username: employee.username || '',
      password: '',
      full_name: employee.full_name || '',
      phone: employee.phone || '',
      email: employee.email || '',
      role: employee.role === 'kitchen' ? 'kitchen' : 'attendee',
    });
    setMessage({ type: '', text: '' });
  };

  const handleCancelEdit = () => {
    setEditingEmployeeId(null);
    setFormData(emptyForm);
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (attendeeId) => {
    if (!window.confirm('Remove this attendee login?')) return;
    setMessage({ type: '', text: '' });
    try {
      await api.delete(`/attendees/${attendeeId}`);
      setMessage({ type: 'success', text: 'Attendee removed.' });
      fetchAttendees();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to remove attendee' });
    }
  };

  if (loading) {
    return (
      <div className="page-container with-mobile-header-offset">
        <PageLoader message="Loading attendees..." />
      </div>
    );
  }

  return (
    <div className="page-container with-mobile-header-offset" style={{ background: '#f8fafc' }}>
      <PageHeader
        icon={UserCheck}
        title="Employees"
        subtitle="Create and manage billing attendees and kitchen display users"
      >
        <button className="btn" onClick={fetchAttendees}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </PageHeader>

      <div className="content-area">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'error' && <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-auto-fit gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="sysadmin-modal-icon small">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create / Edit Employee</h2>
                <p className="text-sm text-muted">Create attendee or kitchen display users and manage their access.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label-text">Employee Type</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="attendee">Attendee (Billing / Waiter)</option>
                  <option value="kitchen">KOT Display User</option>
                </select>
              </div>
              <div>
                <label className="label-text">Username</label>
                <input
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label-text">Password</label>
                <input
                  className="input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingEmployeeId}
                />
                {editingEmployeeId && (
                  <p className="text-xs text-muted mt-1">Leave blank to keep the current password.</p>
                )}
              </div>
              <div>
                <label className="label-text">Full Name</label>
                <input
                  className="input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label-text">Phone</label>
                <input
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label-text">Email</label>
                <input
                  className="input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <button className="btn flex-1" type="submit" disabled={saving}>
                  <UserPlus size={18} />
                  {saving ? (editingEmployeeId ? 'Saving...' : 'Creating...') : (editingEmployeeId ? 'Update Employee' : 'Create Employee')}
                </button>
                {editingEmployeeId && (
                  <button type="button" className="btn btn-secondary flex-1" onClick={handleCancelEdit} disabled={saving}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Active Employees</h2>
                <p className="text-sm text-muted">{attendees.length} login{attendees.length === 1 ? '' : 's'} available</p>
              </div>
            </div>

            <div className="overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee) => (
                    <tr key={attendee.id}>
                      <td className="font-medium">{attendee.username}</td>
                      <td>{attendee.full_name || '-'}</td>
                      <td>{attendee.role === 'kitchen' ? 'KOT Display User' : 'Attendee'}</td>
                      <td>
                        <div>{attendee.phone || '-'}</div>
                        <div className="text-xs text-muted">{attendee.email || ''}</div>
                      </td>
                      <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn-icon" onClick={() => handleEdit(attendee)} title="Edit employee">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-icon danger" onClick={() => handleDelete(attendee.id)} title="Remove employee">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {attendees.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted" style={{ padding: '32px' }}>
                        No attendee logins created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeesManagement;
