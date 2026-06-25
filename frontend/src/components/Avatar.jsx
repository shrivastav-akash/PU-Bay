import { API_BASE_URL } from '../config';

// Shared avatar: renders the user's uploaded picture, or a butter-coloured
// initial badge when none is set. `style` is merged so callers can tweak
// size, border and outline to match each design context.
export default function Avatar({ user, size = 40, style = {}, className }) {
  const pic = user?.profilePicture;
  const url = pic && pic !== 'default.jpg' ? `${API_BASE_URL}/${pic}` : null;
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: '1.5px solid var(--line)',
    objectFit: 'cover',
    flexShrink: 0,
    ...style,
  };

  if (url) {
    return (
      <img src={url} alt={user?.name || ''} draggable={false} className={className} style={base} />
    );
  }

  return (
    <div
      className={className}
      style={{
        ...base,
        background: 'var(--butter)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink)',
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: Math.round(size * 0.42),
      }}
    >
      {initial}
    </div>
  );
}
