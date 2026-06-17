import { useState } from 'react';
import { API_BASE_URL } from '../config';
import { 
  User, Briefcase, GraduationCap, Download, FileText, Check, X, Camera, Plus, Trash2, Users, Settings, Clock, Heart 
} from 'lucide-react';

export default function ProfilePanel({ 
  profile, 
  user, 
  currentUser,
  token, 
  posts = [],
  onProfileUpdated, 
  onClose,
  receivedRequests,
  sentRequests,
  allProfiles,
  onConnectionUpdated,
  onViewProfile
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'connections' | 'edit' | 'posts'
  
  const isOwnProfile = !currentUser || user?._id === currentUser?._id;
  
  const userPosts = (posts || []).filter(p => p.userId?._id === user?._id);
  const pendingSentRequests = (sentRequests || []).filter(r => r.status_accepted === null);
  const pendingReceivedRequests = (receivedRequests || []).filter(r => r.status_accepted === null);
  
  const activeConnections = [
    ...(sentRequests || [])
      .filter(r => r.status_accepted === true)
      .map(r => ({ ...r, otherUser: r.connectionId })),
    ...(receivedRequests || [])
      .filter(r => r.status_accepted === true)
      .map(r => ({ ...r, otherUser: r.userId }))
  ].filter(c => c.otherUser !== null && c.otherUser !== undefined);

  // Edit forms state
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [bio, setBio] = useState(profile?.bio || '');
  const [currentPost, setCurrentPost] = useState(profile?.currentPost || '');
  
  // Sub-documents state
  const [pastWork, setPastWork] = useState(profile?.pastWork || []);
  const [education, setEducation] = useState(profile?.education || []);
  
  // Add new item forms state
  const [newCompany, setNewCompany] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newYears, setNewYears] = useState('');
  
  const [newSchool, setNewSchool] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [newFieldOfStudy, setNewFieldOfStudy] = useState('');
  
  // Loaders
  const [updateLoading, setUpdateLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Resume Download Handler
  const handleDownloadResume = async () => {
    setPdfLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/download_resume?id=${profile._id}`);
      const data = await response.json();
      if (data.success && data.data) {
        // Trigger file download
        const fileUrl = `${API_BASE_URL}/${data.data}`;
        window.open(fileUrl, '_blank');
      } else {
        alert("Failed to generate resume");
      }
    } catch (err) {
      console.error("Error downloading resume:", err);
      alert("Error generating PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('token', token);
    formData.append('profile_picture', file);

    try {
      const response = await fetch(`${API_BASE_URL}/update_profile_picture`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        onProfileUpdated();
        alert('Avatar updated successfully!');
      } else {
        alert(data.message || 'Failed to upload picture');
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Edit profile submit handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      // 1. Update User fields (name, username, email)
      const userRes = await fetch(`${API_BASE_URL}/user_update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, username, email })
      });
      const userData = await userRes.json();
      if (!userData.success) {
        throw new Error(userData.message || 'Failed to update user account details');
      }

      // 2. Update Profile fields (bio, currentPost, pastWork, education)
      const profileRes = await fetch(`${API_BASE_URL}/update_profile_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          bio, 
          currentPost, 
          pastWork, 
          education 
        })
      });
      const profileData = await profileRes.json();
      if (!profileData.success) {
        throw new Error(profileData.message || 'Failed to update professional details');
      }

      alert('Profile updated successfully!');
      onProfileUpdated();
      setActiveTab('profile');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Add work item
  const handleAddWork = () => {
    if (!newCompany.trim() || !newPosition.trim() || !newYears.trim()) return;
    const updated = [...pastWork, { company: newCompany, position: newPosition, years: newYears }];
    setPastWork(updated);
    setNewCompany('');
    setNewPosition('');
    setNewYears('');
  };

  const handleDeleteWork = (idx) => {
    const updated = pastWork.filter((_, i) => i !== idx);
    setPastWork(updated);
  };

  // Add education item
  const handleAddEducation = () => {
    if (!newSchool.trim() || !newDegree.trim() || !newFieldOfStudy.trim()) return;
    const updated = [...education, { school: newSchool, degree: newDegree, fieldOfStudy: newFieldOfStudy }];
    setEducation(updated);
    setNewSchool('');
    setNewDegree('');
    setNewFieldOfStudy('');
  };

  const handleDeleteEducation = (idx) => {
    const updated = education.filter((_, i) => i !== idx);
    setEducation(updated);
  };

  // Connection decision
  const handleConnectionAction = async (connectionId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/accept_connection_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, connectionId, action_type: action })
      });
      const data = await response.json();
      if (data.success) {
        onConnectionUpdated();
      } else {
        alert(data.message || 'Error updating request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send connection from panel
  const handleSendConnection = async (receiverId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/send_connection_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, receiverId })
      });
      const data = await response.json();
      if (data.success) {
        alert("Connection request sent!");
        onConnectionUpdated();
      } else {
        alert(data.message || "Failed to send request");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const userAvatarUrl = user?.profilePicture && user.profilePicture !== 'default.jpg'
    ? `${API_BASE_URL}/${user.profilePicture}`
    : null;

  const getConnectionButton = () => {
    if (!currentUser || !user) return null;

    // Check if they are already connected
    const isAlreadyConnected = activeConnections.some(
      c => c.otherUser?._id === user._id
    );

    if (isAlreadyConnected) {
      return (
        <span style={{ 
          fontSize: '0.85rem', 
          color: '#10b981', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          padding: '0.5rem 0.8rem',
          background: 'var(--input-bg)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid #10b981'
        }}>
          <Check size={15} /> Connected
        </span>
      );
    }

    // Check if there is a pending request received from this user
    const receivedReq = pendingReceivedRequests.find(r => r.userId?._id === user._id);
    if (receivedReq) {
      return (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handleConnectionAction(user._id, 'accept')}
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Check size={15} /> Accept
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleConnectionAction(user._id, 'reject')}
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem', color: 'var(--danger-color)' }}
          >
            <X size={15} /> Ignore
          </button>
        </div>
      );
    }

    // Check if there is a pending request sent to this user
    const hasSentPending = pendingSentRequests.some(r => r.connectionId?._id === user._id);
    if (hasSentPending) {
      return (
        <span style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          padding: '0.5rem 0.8rem',
          background: 'var(--input-bg)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <Clock size={15} /> Pending
        </span>
      );
    }

    // Otherwise, show "Send Connection" button
    return (
      <button 
        className="btn btn-primary" 
        onClick={() => handleSendConnection(user._id)}
        style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
      >
        <Plus size={15} /> Send Connection
      </button>
    );
  };

  // Filter suggestion profiles: profiles of other users not currently sent/received/connected
  const suggestionProfiles = allProfiles.filter(p => {
    const mainUserId = currentUser?._id || user?._id;
    if (!p.userId || p.userId._id === mainUserId) return false;
    
    const isSent = sentRequests.some(r => r.connectionId?._id === p.userId._id);
    const isReceived = receivedRequests.some(r => r.userId?._id === p.userId._id);
    const isAlreadyConnected = activeConnections.some(c => c.otherUser?._id === p.userId._id);
    
    return !isSent && !isReceived && !isAlreadyConnected;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Cover Banner */}
      <div style={{ 
        height: '140px', 
        background: 'linear-gradient(135deg, #a78bfa 0%, #db2777 100%)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Profile Avatar Overlay */}
      <div style={{ padding: '0 1.5rem', position: 'relative', marginTop: '-50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {userAvatarUrl ? (
            <img 
              src={userAvatarUrl} 
              alt={user.name} 
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid var(--bg-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'var(--input-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid var(--bg-secondary)',
              flexShrink: 0
            }}>
              <User size={48} />
            </div>
          )}
          {isOwnProfile && (
            <label style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid var(--bg-secondary)'
            }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={avatarLoading} />
              <Camera size={14} />
            </label>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', zIndex: 5 }}>
          {isOwnProfile ? (
            <button 
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('profile')}
              style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            >
              <FileText size={15} /> Resume
            </button>
          ) : (
            getConnectionButton()
          )}
          {isOwnProfile && (
            <button 
              className={`btn ${activeTab === 'connections' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('connections')}
              style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            >
              <Users size={15} /> Social
            </button>
          )}
          {isOwnProfile && (
            <button 
              className={`btn ${activeTab === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('edit')}
              style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            >
              <Settings size={15} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* User Basic Info */}
      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem' }}>{user.name}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>@{user.username}</p>
        {currentPost ? (
          <p style={{ marginTop: '0.4rem', fontWeight: 500, fontSize: '0.95rem' }}>{currentPost}</p>
        ) : (
          isOwnProfile && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setActiveTab('edit')}
              style={{ 
                marginTop: '0.5rem', 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.8rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.3rem',
                borderStyle: 'dashed',
                borderColor: 'var(--accent-color)',
                color: 'var(--accent-color)'
              }}
            >
              <Plus size={14} /> Add Heading
            </button>
          )
        )}
        {bio && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', fontStyle: 'italic' }}>"{bio}"</p>}
      </div>

      {/* Main Tab Panels */}
      <div style={{ flex: 1, padding: '0 1.5rem 2rem 1.5rem', overflowY: 'auto' }}>
        
        {/* TAB 1: LinkedIn Form / Resume Preview */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Professional Resume</h3>
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadResume} 
                disabled={pdfLoading}
                style={{ fontSize: '0.85rem' }}
              >
                <Download size={15} /> {pdfLoading ? 'Generating...' : 'PDF Resume'}
              </button>
            </div>

            {/* Experience list */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <Briefcase size={18} color="var(--accent-color)" />
                <h4 style={{ fontWeight: 700 }}>Work Experience</h4>
              </div>

              {pastWork.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pastWork.map((work, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h5 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{work.position}</h5>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{work.company}</p>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, backgroundColor: 'var(--input-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {work.years}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No work experience added.</p>
              )}
            </div>

            {/* Education list */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <GraduationCap size={18} color="var(--accent-color)" />
                <h4 style={{ fontWeight: 700 }}>Education</h4>
              </div>

              {education.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {education.map((edu, idx) => (
                    <div key={idx}>
                      <h5 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{edu.school}</h5>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{edu.degree} — {edu.fieldOfStudy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No education history added.</p>
              )}
            </div>

            {/* Latest Post Section */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              border: '2px solid var(--accent-color)', 
              borderRadius: 'var(--border-radius-lg)', 
              padding: '1.5rem',
              boxShadow: 'var(--glow-shadow)',
              transition: 'var(--transition-smooth)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="var(--accent-color)" />
                  <h4 style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Latest Post</h4>
                </div>
                {userPosts.length > 1 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveTab('posts')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--accent-color)', color: 'var(--accent-color)', borderRadius: 'var(--border-radius-md)' }}
                  >
                    Show All Posts ({userPosts.length})
                  </button>
                )}
              </div>

              {userPosts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {userPosts[0].body}
                  </p>
                  {userPosts[0].media && (
                    <div style={{ 
                      borderRadius: 'var(--border-radius-md)', 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-color)', 
                      maxHeight: '280px', 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      backgroundColor: 'rgba(0, 0, 0, 0.4)'
                    }}>
                      {['mp4', 'mov', 'avi', 'webm'].includes(userPosts[0].fileType) ? (
                        <video src={`${API_BASE_URL}/${userPosts[0].media}`} controls style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }} />
                      ) : (
                        <img src={`${API_BASE_URL}/${userPosts[0].media}`} alt="Latest post media" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }} />
                      )}
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    <span style={{ fontWeight: 500 }}>{new Date(userPosts[0].createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.35rem', 
                      fontWeight: 600,
                      color: 'var(--accent-color)',
                      background: 'var(--accent-glow)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '20px'
                    }}>
                      <Heart size={14} fill="currentColor" /> {userPosts[0].likes || 0} Likes
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>No posts published yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Connections & Network */}
        {activeTab === 'connections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Active Connections */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Active Connections ({activeConnections.length})
              </h3>
              {activeConnections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeConnections.map((conn) => {
                    const avatar = conn.otherUser?.profilePicture && conn.otherUser.profilePicture !== 'default.jpg'
                      ? `${API_BASE_URL}/${conn.otherUser.profilePicture}`
                      : null;

                    return (
                      <div key={conn._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                          onClick={() => onViewProfile && onViewProfile(conn.otherUser?._id)}
                        >
                          {avatar ? (
                            <img src={avatar} alt={conn.otherUser?.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <h5 style={{ fontWeight: 700, fontSize: '0.85rem' }}>{conn.otherUser?.name}</h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{conn.otherUser?.username}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Connected</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active connections yet.</p>
              )}
            </div>

            {/* Received Requests */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Pending Invitations ({pendingReceivedRequests.length})
              </h3>
              {pendingReceivedRequests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingReceivedRequests.map((req) => {
                    const avatar = req.userId?.profilePicture && req.userId.profilePicture !== 'default.jpg'
                      ? `${API_BASE_URL}/${req.userId.profilePicture}`
                      : null;

                    return (
                      <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                          onClick={() => onViewProfile && onViewProfile(req.userId?._id)}
                        >
                          {avatar ? (
                            <img src={avatar} alt={req.userId?.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <h5 style={{ fontWeight: 700, fontSize: '0.85rem' }}>{req.userId?.name}</h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{req.userId?.username}</p>
                          </div>
                        </div>

                        {req.status_accepted === true ? (
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Accepted</span>
                        ) : req.status_accepted === false ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)', fontWeight: 600 }}>Rejected</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => handleConnectionAction(req._id, 'accept')}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '4px' }}
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => handleConnectionAction(req._id, 'reject')}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', color: 'var(--danger-color)' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No pending requests.</p>
              )}
            </div>

            {/* Sent Requests Pending */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sent Invitations (Pending) ({pendingSentRequests.length})
              </h3>
              {pendingSentRequests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingSentRequests.map((req) => {
                    const avatar = req.connectionId?.profilePicture && req.connectionId.profilePicture !== 'default.jpg'
                      ? `${API_BASE_URL}/${req.connectionId.profilePicture}`
                      : null;

                    return (
                      <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                          onClick={() => onViewProfile && onViewProfile(req.connectionId?._id)}
                        >
                          {avatar ? (
                            <img src={avatar} alt={req.connectionId?.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <h5 style={{ fontWeight: 700, fontSize: '0.85rem' }}>{req.connectionId?.name}</h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{req.connectionId?.username}</p>
                          </div>
                        </div>

                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-secondary)', 
                          fontWeight: 600, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          padding: '0.3rem 0.6rem',
                          background: 'var(--input-bg)',
                          borderRadius: 'var(--border-radius-md)'
                        }}>
                          <Clock size={12} /> Pending
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No pending sent invitations.</p>
              )}
            </div>

            {/* suggestions */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>People You May Know</h3>
              {suggestionProfiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {suggestionProfiles.map((p) => {
                    const avatar = p.userId?.profilePicture && p.userId.profilePicture !== 'default.jpg'
                      ? `${API_BASE_URL}/${p.userId.profilePicture}`
                      : null;

                    return (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                          onClick={() => onViewProfile && onViewProfile(p.userId?._id)}
                        >
                          {avatar ? (
                            <img src={avatar} alt={p.userId?.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <h5 style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.userId?.name}</h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.currentPost || 'Panjab University'}</p>
                          </div>
                        </div>

                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleSendConnection(p.userId?._id)}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                        >
                          Connect
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No new suggestions.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Dedicated Posts View */}
        {activeTab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
                {isOwnProfile ? "All My Posts" : `All Posts by ${user?.name}`}
              </h3>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('profile')}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Back to Profile
              </button>
            </div>

            {userPosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {userPosts.map((post) => (
                  <div key={post._id} style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--border-radius-lg)', 
                    padding: '1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {post.body}
                    </p>
                    {post.media && (
                      <div style={{ 
                        borderRadius: 'var(--border-radius-md)', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border-color)', 
                        maxHeight: '280px', 
                        width: '100%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        backgroundColor: 'rgba(0, 0, 0, 0.4)' 
                      }}>
                        {['mp4', 'mov', 'avi', 'webm'].includes(post.fileType) ? (
                          <video src={`${API_BASE_URL}/${post.media}`} controls style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }} />
                        ) : (
                          <img src={`${API_BASE_URL}/${post.media}`} alt="Post media" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }} />
                        )}
                      </div>
                    )}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem',
                      marginTop: '0.25rem'
                    }}>
                      <span style={{ fontWeight: 500 }}>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        fontWeight: 600,
                        color: 'var(--accent-color)',
                        background: 'var(--accent-glow)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '20px'
                      }}>
                        <Heart size={14} fill="currentColor" /> {post.likes || 0} Likes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No posts published yet.</p>
            )}
          </div>
        )}

        {/* TAB 3: Edit Forms */}
        {activeTab === 'edit' && (
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Account Details */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Account Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Name</label>
                  <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Username</label>
                  <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Email</label>
                  <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Professional Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Headline</label>
                  <input type="text" className="input-field" placeholder="e.g. Software Engineer Intern" value={currentPost} onChange={(e) => setCurrentPost(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Bio</label>
                  <textarea className="input-field textarea-field" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Past Work Edit */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Experience</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {pastWork.map((work, idx) => (
                  <div key={idx} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--input-bg)', borderRadius: 'var(--border-radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{work.position} at {work.company} ({work.years})</span>
                    <button type="button" onClick={() => handleDeleteWork(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add experience inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <input type="text" placeholder="Company" className="input-field" style={{ padding: '0.4rem' }} value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
                <input type="text" placeholder="Position" className="input-field" style={{ padding: '0.4rem' }} value={newPosition} onChange={(e) => setNewPosition(e.target.value)} />
                <input type="text" placeholder="Years" className="input-field" style={{ padding: '0.4rem' }} value={newYears} onChange={(e) => setNewYears(e.target.value)} />
              </div>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleAddWork}>
                <Plus size={12} /> Add Experience
              </button>
            </div>

            {/* Education Edit */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Education</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {education.map((edu, idx) => (
                  <div key={idx} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--input-bg)', borderRadius: 'var(--border-radius-md)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{edu.degree} in {edu.fieldOfStudy} at {edu.school}</span>
                    <button type="button" onClick={() => handleDeleteEducation(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Add education inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <input type="text" placeholder="School" className="input-field" style={{ padding: '0.4rem' }} value={newSchool} onChange={(e) => setNewSchool(e.target.value)} />
                <input type="text" placeholder="Degree" className="input-field" style={{ padding: '0.4rem' }} value={newDegree} onChange={(e) => setNewDegree(e.target.value)} />
                <input type="text" placeholder="Field of Study" className="input-field" style={{ padding: '0.4rem' }} value={newFieldOfStudy} onChange={(e) => setNewFieldOfStudy(e.target.value)} />
              </div>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={handleAddEducation}>
                <Plus size={12} /> Add Education
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={updateLoading}>
              {updateLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
