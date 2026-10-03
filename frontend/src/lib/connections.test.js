import { describe, expect, it } from 'vitest';
import { acceptedConnections, connectionStatus, pendingInvitations, suggestions } from './connections';

const me = 'me';
const user = (id) => ({ _id: id, name: id });
const out = (to, status) => ({ _id: `out-${to}`, userId: me, connectionId: user(to), status_accepted: status });
const inc = (from, status) => ({ _id: `in-${from}`, userId: user(from), connectionId: me, status_accepted: status });

describe('connectionStatus', () => {
  it('recognises self and strangers', () => {
    expect(connectionStatus(me, { meId: me })).toEqual({ state: 'self' });
    expect(connectionStatus('a', { meId: me })).toEqual({ state: 'none' });
    expect(connectionStatus(undefined, { meId: me })).toEqual({ state: 'none' });
  });

  it('is connected when either direction was accepted', () => {
    expect(connectionStatus('a', { meId: me, sent: [out('a', true)] }).state).toBe('connected');
    expect(connectionStatus('b', { meId: me, received: [inc('b', true)] }).state).toBe('connected');
  });

  it('offers a response for a pending incoming request', () => {
    expect(connectionStatus('a', { meId: me, received: [inc('a', null)] })).toEqual({ state: 'incoming', requestId: 'in-a' });
  });

  it('treats pending and ignored outgoing requests as pending', () => {
    expect(connectionStatus('a', { meId: me, sent: [out('a', null)] }).state).toBe('pending');
    expect(connectionStatus('a', { meId: me, sent: [out('a', false)] }).state).toBe('pending');
  });

  it('lets someone whose request I ignored be asked again', () => {
    expect(connectionStatus('a', { meId: me, received: [inc('a', false)] }).state).toBe('none');
  });
});

describe('list helpers', () => {
  const sent = [out('a', true), out('b', null)];
  const received = [inc('c', true), inc('d', null), inc('e', false)];

  it('collects accepted connections from both directions', () => {
    expect(acceptedConnections(sent, received).map((u) => u._id)).toEqual(['a', 'c']);
  });

  it('lists only pending invitations', () => {
    expect(pendingInvitations(received).map((r) => r.userId._id)).toEqual(['d']);
  });

  it('suggests people with no request either way, excluding me', () => {
    const profiles = ['me', 'a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ _id: `p-${id}`, userId: user(id) }));
    expect(suggestions(profiles, { meId: me, sent, received }).map((p) => p.userId._id)).toEqual(['e', 'f']);
  });
});
