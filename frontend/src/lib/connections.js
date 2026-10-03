// Connection requests are directional documents: `sent` holds mine
// (connectionId populated), `received` holds theirs (userId populated).
// status_accepted is null while pending, true when accepted, false when ignored.

export function connectionStatus(targetId, { meId, sent = [], received = [] }) {
  if (!targetId) return { state: 'none' };
  if (meId && targetId === meId) return { state: 'self' };
  const out = sent.find((r) => r.connectionId?._id === targetId);
  const inc = received.find((r) => r.userId?._id === targetId);
  if (out?.status_accepted === true || inc?.status_accepted === true) return { state: 'connected' };
  if (inc && inc.status_accepted === null) return { state: 'incoming', requestId: inc._id };
  // An ignored outgoing request still reads as pending: the sender is never
  // told they were declined, and the server refuses a duplicate anyway.
  if (out) return { state: 'pending' };
  return { state: 'none' };
}

export function acceptedConnections(sent = [], received = []) {
  return [
    ...sent.filter((r) => r.status_accepted === true).map((r) => r.connectionId),
    ...received.filter((r) => r.status_accepted === true).map((r) => r.userId),
  ].filter(Boolean);
}

export function pendingInvitations(received = []) {
  return received.filter((r) => r.status_accepted === null && r.userId);
}

export function pendingSent(sent = []) {
  return sent.filter((r) => r.status_accepted === null && r.connectionId);
}

// Everyone I have no request with in either direction.
export function suggestions(profiles = [], { meId, sent = [], received = [] }) {
  return profiles.filter((p) => {
    const id = p.userId?._id;
    if (!id || id === meId) return false;
    return connectionStatus(id, { meId, sent, received }).state === 'none';
  });
}
