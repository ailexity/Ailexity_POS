import React, { useEffect, useState } from 'react';
import api from '../api';
import { Trash2, UserCheck, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';

const emptyForm = { username: '', password: '', full_name: '', phone: '', email: '' };

const AttendeesManagement = () => {
  const [attendees, setAttendees] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/attendees', {
        username: formData.username.trim(),
        password: formData.password,
        full_name: formData.full_name.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
      });
      setFormData(emptyForm);
      setMessage({ type: 'success', text: 'Attendee login created successfully.' });
      fetchAttendees();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to create attendee' });
    } finally {
      setSaving(false);
    }
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
        title="Attendees"
        subtitle="Create and manage attendee login access"
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
                <h2 className="text-xl font-bold">Create Login</h2>
                <p className="text-sm text-muted">Add an attendee account for billing or service workflows.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  required
                />
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
              <button className="btn w-full" type="submit" disabled={saving}>
                <UserPlus size={18} />
                {saving ? 'Creating...' : 'Create Attendee'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Active Attendees</h2>
                <p className="text-sm text-muted">{attendees.length} login{attendees.length === 1 ? '' : 's'} available</p>
              </div>
            </div>

            <div className="overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee) => (
                    <tr key={attendee.id}>
                      <td className="font-medium">{attendee.username}</td>
                      <td>{attendee.full_name || '-'}</td>
                      <td>
                        <div>{attendee.phone || '-'}</div>
                        <div className="text-xs text-muted">{attendee.email || ''}</div>
                      </td>
                      <td>
                        <button className="btn-icon danger" onClick={() => handleDelete(attendee.id)} title="Remove attendee">
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

export default AttendeesManagement;
