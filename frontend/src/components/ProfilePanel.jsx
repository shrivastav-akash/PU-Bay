import { useState } from 'react';
import { API_BASE_URL, authHeaders } from '../config';
import {
  X, Camera, FileText, Users, Settings, Download, Briefcase, GraduationCap,
  Sparkles, Heart, Check, Clock, Plus, Trash2,
} from 'lucide-react';
import Avatar from './Avatar';

const inputSm = {
  width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10,
  background: 'var(--pill)', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
};
const inputTiny = {
  padding: 8, border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--pill)',
  color: 'var(--ink)', fontSize: 12.5, fontFamily: 'inherit', outline: 'none',
};

export default function ProfilePanel({
  profile,
  user,
  currentUser,
  token,
  posts = [],
  onProfileUpdated,
  onClose,
  receivedRequests = [],
  sentRequests = [],
  allProfiles = [],
  onConnectionUpdated,
  onViewProfile,
  onToast,
}) {
  const isOwnProfile = !currentUser || user?._id === currentUser?._id;
  const [activeTab, setActiveTab] = useState('resume'); // resume | connections | edit | posts

  const userPosts = (posts || []).filter((p) => p.userId?._id === user?._id);
  const pendingSent = (sentRequests || []).filter((r) => r.status_accepted === null);
  const pendingReceived = (receivedRequests || []).filter((r) => r.status_accepted === null);
  const activeConnections = [
    ...(sentRequests || []).filter((r) => r.status_accepted === true).map((r) => r.connectionId),
    ...(receivedRequests || []).filter((r) => r.status_accepted === true).map((r) => r.userId),
  ].filter(Boolean);

  // Edit-form state
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [headline, setHeadline] = useState(profile?.currentPost || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [pastWork, setPastWork] = useState(profile?.pastWork || []);
  const [education, setEducation] = useState(profile?.education || []);
  const [newWork, setNewWork] = useState({ company: '', position: '', years: '' });
  const [newEdu, setNewEdu] = useState({ school: '', degree: '', fieldOfStudy: '' });

  const [updateLoading, setUpdateLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const toast = (m) => onToast && onToast(m);

  const goEdit = () => {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setHeadline(profile?.currentPost || '');
    setBio(profile?.bio || '');
    setPastWork(profile?.pastWork || []);
    setEducation(profile?.education || []);
    setActiveTab('edit');
  };

  const handleDownloadResume = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/download_resume?id=${profile._id}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success && data.data) window.open(`${API_BASE_URL}/${data.data}`, '_blank');
      else toast('Could not generate résumé');
    } catch (err) {
      console.error('Error downloading resume:', err);
      toast('Error generating PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
      const res = await fetch(`${API_BASE_URL}/update_profile_picture`, { method: 'POST', headers: authHeaders(token), body: formData });
      const data = await res.json();
      if (data.success) { onProfileUpdated(); toast('Avatar updated'); }
      else toast(data.message || 'Failed to upload picture');
    } catch (err) {
      console.error('Error uploading avatar:', err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const userRes = await fetch(`${API_BASE_URL}/user_update`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ name, username, email }),
      });
      const userData = await userRes.json();
      if (!userData.success) throw new Error(userData.message || 'Failed to update account details');

      const profRes = await fetch(`${API_BASE_URL}/update_profile_data`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ bio, currentPost: headline, pastWork, education }),
      });
      const profData = await profRes.json();
      if (!profData.success) throw new Error(profData.message || 'Failed to update professional details');

      toast('Profile updated');
      onProfileUpdated();
      setActiveTab('resume');
    } catch (err) {
      toast(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleConnectionAction = async (connectionId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/accept_connection_request`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ connectionId, action_type: action }),
      });
      const data = await res.json();
      if (data.success) { onConnectionUpdated(); toast(action === 'accept' ? 'You are now connected' : 'Request ignored'); }
      else toast(data.message || 'Error updating request');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendConnection = async (receiverId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/send_connection_request`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ receiverId }),
      });
      const data = await res.json();
      if (data.success) { onConnectionUpdated(); toast('Connection request sent'); }
      else toast(data.message || 'Failed to send request');
    } catch (err) {
      console.error(err);
    }
  };

  const addWork = () => {
    if (!newWork.company.trim() || !newWork.position.trim()) return;
    setPastWork([...pastWork, { ...newWork, years: newWork.years || '—' }]);
    setNewWork({ company: '', position: '', years: '' });
  };
  const addEdu = () => {
    if (!newEdu.school.trim() || !newEdu.degree.trim()) return;
    setEducation([...education, { ...newEdu }]);
    setNewEdu({ school: '', degree: '', fieldOfStudy: '' });
  };

  // connection status of the viewed (other) user
  const connectedWith = activeConnections.some((u) => u?._id === user?._id);
  const sentPendingWith = pendingSent.some((r) => r.connectionId?._id === user?._id);
  const receivedFrom = pendingReceived.find((r) => r.userId?._id === user?._id);

  // suggestions
  const suggestions = allProfiles.filter((p) => {
    const meId = currentUser?._id || user?._id;
    if (!p.userId || p.userId._id === meId) return false;
    const isSent = (sentRequests || []).some((r) => r.connectionId?._id === p.userId._id);
    const isRec = (receivedRequests || []).some((r) => r.userId?._id === p.userId._id);
    const isConn = activeConnections.some((u) => u?._id === p.userId._id);
    return !isSent && !isRec && !isConn;
  });

  const tabBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 10, fontWeight: 800,
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid var(--line)',
    background: active ? 'var(--accent)' : 'var(--card)', color: active ? 'var(--accent-ink)' : 'var(--ink)',
    boxShadow: active ? '2px 2px 0 var(--shadow)' : 'none',
  });

  const cardBox = { background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, padding: 16 };
  const sectionHead = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 10 };
  const rowBox = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 12, gap: 8 };

  const PersonRow = ({ u, right }) => (
    <div style={rowBox}>
      <div onClick={() => onViewProfile && onViewProfile(u?._id)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}>
        <Avatar user={u} size={36} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{u?.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u?.username}</div>
        </div>
      </div>
      {right}
    </div>
  );

  return (
    <div>
      {/* cover */}
      <div
        style={{
          height: 118, background: 'var(--accent)', borderBottom: '2px solid var(--line)', position: 'relative',
          backgroundImage: 'radial-gradient(var(--cover-dot) 1.5px, transparent 1.5px)', backgroundSize: '15px 15px',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', boxShadow: '2px 2px 0 var(--shadow)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={17} />
        </button>
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        {/* avatar + actions row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -42, gap: 10, position: 'relative', zIndex: 5 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar user={user} size={90} style={{ border: '3px solid var(--card)', outline: '1.5px solid var(--line)', background: 'var(--card)' }} />
            {isOwnProfile && (
              <label style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={avatarLoading} />
                <Camera size={13} />
              </label>
            )}
          </div>

          {!isOwnProfile && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              {connectedWith ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--good)', background: 'var(--good-bg)', border: '1.5px solid var(--good)', borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 13 }}><Check size={14} />Connected</span>
              ) : receivedFrom ? (
                <>
                  <button onClick={() => handleConnectionAction(receivedFrom._id, 'accept')} className="pu-press" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Accept</button>
                  <button onClick={() => handleConnectionAction(receivedFrom._id, 'reject')} className="pu-bd-danger" style={{ background: 'var(--card)', color: 'var(--danger)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Ignore</button>
                </>
              ) : sentPendingWith ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--soft)', background: 'var(--pill)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 13 }}><Clock size={14} />Pending</span>
              ) : (
                <button onClick={() => handleSendConnection(user?._id)} className="pu-press" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--accent)', color: 'var(--accent-ink)', border: '1.5px solid var(--line)', borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '2px 2px 0 var(--shadow)' }}><Plus size={14} />Connect</button>
              )}
            </div>
          )}
        </div>

        {/* identity */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--soft)', fontWeight: 700 }}>@{user?.username}</div>
          {(profile?.currentPost) && <div style={{ fontSize: 14.5, color: 'var(--ink)', marginTop: 7, fontWeight: 600 }}>{profile.currentPost}</div>}
          {profile?.bio && <div style={{ fontSize: 13.5, color: 'var(--soft)', marginTop: 6, fontStyle: 'italic' }}>“{profile.bio}”</div>}
        </div>

        {/* own tabs */}
        {isOwnProfile && (
          <div style={{ display: 'flex', gap: 7, marginTop: 18 }}>
            <button onClick={() => setActiveTab('resume')} style={tabBtn(activeTab === 'resume' || activeTab === 'posts')}><FileText size={14} />Résumé</button>
            <button onClick={() => setActiveTab('connections')} style={tabBtn(activeTab === 'connections')}><Users size={14} />Network</button>
            <button onClick={goEdit} style={tabBtn(activeTab === 'edit')}><Settings size={14} />Edit</button>
          </div>
        )}

        {/* ---------- RESUME ---------- */}
        {activeTab === 'resume' && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Professional résumé</div>
              <button onClick={handleDownloadResume} disabled={pdfLoading} className="pu-press" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--ink)', color: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 9, padding: '7px 12px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                <Download size={14} />{pdfLoading ? '…' : 'PDF'}
              </button>
            </div>

            <div style={cardBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1.5px solid var(--border)', paddingBottom: 9, marginBottom: 12, color: 'var(--ink)' }}>
                <Briefcase size={18} color="var(--accent)" /><div style={{ fontWeight: 800, fontSize: 14.5 }}>Work Experience</div>
              </div>
              {pastWork.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {pastWork.map((w, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{w.position}</div><div style={{ fontSize: 12.5, color: 'var(--soft)' }}>{w.company}</div></div>
                      <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, background: 'var(--pill)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 6, color: 'var(--ink)' }}>{w.years}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 13, color: 'var(--soft)', textAlign: 'center' }}>No experience added yet.</div>}
            </div>

            <div style={cardBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1.5px solid var(--border)', paddingBottom: 9, marginBottom: 12, color: 'var(--ink)' }}>
                <GraduationCap size={18} color="var(--accent)" /><div style={{ fontWeight: 800, fontSize: 14.5 }}>Education</div>
              </div>
              {education.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {education.map((e, i) => (
                    <div key={i}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{e.school}</div><div style={{ fontSize: 12.5, color: 'var(--soft)' }}>{e.degree}{e.fieldOfStudy ? ` · ${e.fieldOfStudy}` : ''}</div></div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 13, color: 'var(--soft)', textAlign: 'center' }}>No education added yet.</div>}
            </div>

            <div style={{ background: 'var(--card)', border: '2px solid var(--accent)', borderRadius: 14, padding: 16, boxShadow: '4px 4px 0 var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--border)', paddingBottom: 9, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}><Sparkles size={18} color="var(--accent)" fill="currentColor" stroke="none" /><div style={{ fontWeight: 800, fontSize: 14.5, fontFamily: 'var(--font-display)' }}>Latest post</div></div>
                {userPosts.length > 1 && <button onClick={() => setActiveTab('posts')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>All ({userPosts.length})</button>}
              </div>
              {userPosts.length > 0 ? (
                <>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{userPosts[0].body}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid var(--border)', paddingTop: 10, marginTop: 12, fontSize: 12, color: 'var(--soft)', fontWeight: 600 }}>
                    <span>{fmtDate(userPosts[0].createdAt)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontWeight: 800 }}><Heart size={13} fill="currentColor" stroke="none" />{userPosts[0].likes || 0}</span>
                  </div>
                </>
              ) : <div style={{ fontSize: 13, color: 'var(--soft)', textAlign: 'center', padding: '6px 0' }}>No posts published yet.</div>}
            </div>
          </div>
        )}

        {/* ---------- POSTS ---------- */}
        {activeTab === 'posts' && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{isOwnProfile ? 'All my posts' : `Posts by ${user?.name?.split(' ')[0]}`}</div>
              <button onClick={() => setActiveTab('resume')} className="pu-bd" style={{ background: 'var(--card)', color: 'var(--ink)', border: '1.5px solid var(--border)', borderRadius: 9, padding: '6px 11px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Back</button>
            </div>
            {userPosts.length > 0 ? userPosts.map((p) => (
              <div key={p._id} style={cardBox}>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{p.body}</div>
                {p.media && (
                  <div style={{ marginTop: 12, border: '1.5px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--pill)' }}>
                    {['mp4', 'mov', 'avi', 'webm'].includes(p.fileType)
                      ? <video src={`${API_BASE_URL}/${p.media}`} controls style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'contain' }} />
                      : <img src={`${API_BASE_URL}/${p.media}`} alt="Post media" style={{ display: 'block', width: '100%', maxHeight: 220, objectFit: 'cover' }} />}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid var(--border)', paddingTop: 10, marginTop: 12, fontSize: 12, color: 'var(--soft)', fontWeight: 600 }}>
                  <span>{fmtDate(p.createdAt)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontWeight: 800 }}><Heart size={13} fill="currentColor" stroke="none" />{p.likes || 0}</span>
                </div>
              </div>
            )) : <div style={{ fontSize: 13, color: 'var(--soft)', textAlign: 'center' }}>No posts published yet.</div>}
          </div>
        )}

        {/* ---------- NETWORK ---------- */}
        {activeTab === 'connections' && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={sectionHead}>Connections · {activeConnections.length}</div>
              {activeConnections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {activeConnections.map((u) => <PersonRow key={u._id} u={u} right={<span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 800 }}>Connected</span>} />)}
                </div>
              ) : <div style={{ fontSize: 13, color: 'var(--soft)' }}>No active connections yet.</div>}
            </div>

            {pendingReceived.length > 0 && (
              <div>
                <div style={sectionHead}>Invitations · {pendingReceived.length}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {pendingReceived.map((r) => (
                    <PersonRow key={r._id} u={r.userId} right={
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <button onClick={() => handleConnectionAction(r._id, 'accept')} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--line)', background: 'var(--accent)', color: 'var(--accent-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={15} /></button>
                        <button onClick={() => handleConnectionAction(r._id, 'reject')} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
                      </div>
                    } />
                  ))}
                </div>
              </div>
            )}

            {pendingSent.length > 0 && (
              <div>
                <div style={sectionHead}>Sent · {pendingSent.length}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {pendingSent.map((r) => (
                    <PersonRow key={r._id} u={r.connectionId} right={<span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--soft)', fontWeight: 700, background: 'var(--pill)', border: '1px solid var(--border)', padding: '4px 9px', borderRadius: 7 }}><Clock size={12} />Pending</span>} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={sectionHead}>People you may know</div>
              {suggestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {suggestions.map((p) => (
                    <PersonRow key={p._id} u={p.userId} right={<button onClick={() => handleSendConnection(p.userId?._id)} style={{ flexShrink: 0, color: 'var(--accent)', background: 'var(--card)', border: '1.5px solid var(--accent)', borderRadius: 9, padding: '6px 11px', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Connect</button>} />
                  ))}
                </div>
              ) : <div style={{ fontSize: 13, color: 'var(--soft)' }}>No new suggestions.</div>}
            </div>
          </div>
        )}

        {/* ---------- EDIT ---------- */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 9 }}>Account details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <input className="pu-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required style={inputSm} />
                <input className="pu-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required style={inputSm} />
                <input className="pu-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required style={inputSm} />
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 9 }}>Professional details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <input className="pu-input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" style={inputSm} />
                <textarea className="pu-input" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" style={{ ...inputSm, minHeight: 74, resize: 'vertical' }} />
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 9 }}>Experience</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 9 }}>
                {pastWork.map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', background: 'var(--pill)', border: '1px solid var(--border)', borderRadius: 9, gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{w.position} at {w.company} ({w.years})</span>
                    <button type="button" onClick={() => setPastWork(pastWork.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px', gap: 6, marginBottom: 7 }}>
                <input className="pu-input" value={newWork.company} onChange={(e) => setNewWork({ ...newWork, company: e.target.value })} placeholder="Company" style={inputTiny} />
                <input className="pu-input" value={newWork.position} onChange={(e) => setNewWork({ ...newWork, position: e.target.value })} placeholder="Position" style={inputTiny} />
                <input className="pu-input" value={newWork.years} onChange={(e) => setNewWork({ ...newWork, years: e.target.value })} placeholder="Years" style={inputTiny} />
              </div>
              <button type="button" onClick={addWork} className="pu-bd" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 11px', color: 'var(--ink)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}><Plus size={13} />Add experience</button>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 9 }}>Education</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 9 }}>
                {education.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', background: 'var(--pill)', border: '1px solid var(--border)', borderRadius: 9, gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{e.degree}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''} · {e.school}</span>
                    <button type="button" onClick={() => setEducation(education.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 7 }}>
                <input className="pu-input" value={newEdu.school} onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })} placeholder="School" style={inputTiny} />
                <input className="pu-input" value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Degree" style={inputTiny} />
                <input className="pu-input" value={newEdu.fieldOfStudy} onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })} placeholder="Field" style={inputTiny} />
              </div>
              <button type="button" onClick={addEdu} className="pu-bd" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 11px', color: 'var(--ink)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}><Plus size={13} />Add education</button>
            </div>

            <button type="submit" disabled={updateLoading} className="pu-press" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: '2px solid var(--line)', borderRadius: 12, padding: 12, fontWeight: 800, fontSize: 14.5, cursor: 'pointer', boxShadow: '4px 4px 0 var(--shadow)' }}>
              {updateLoading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
