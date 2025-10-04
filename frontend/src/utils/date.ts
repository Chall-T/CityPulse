
export function formatEventDate(dateString: Date) {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) {
    return `Today at ${timeString}`;
  } else if (diffDays === 1) {
    return `Tomorrow at ${timeString}`;
  } else if (diffDays > 1 && diffDays < 7) {
    return `${date.toLocaleDateString([], { weekday: 'long' })} at ${timeString}`;
  } else if (diffDays >= 7 && diffDays < 30) {
    return `In ${Math.round(diffDays / 7)} week${Math.round(diffDays / 7) > 1 ? 's' : ''}`;
  } else if (diffDays >= 30) {
    return `In ${Math.round(diffDays / 30)} month${Math.round(diffDays / 30) > 1 ? 's' : ''}`;
  } else if (diffDays < 0) {
    return `Happened on ${date.toLocaleDateString()} at ${timeString}`;
  }

  return date.toLocaleString();
}
