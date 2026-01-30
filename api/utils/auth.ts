export function getUserFromRequest(req) {
  // Implement JWT/session extraction logic here
  // Example: return { email: req.headers['x-user-email'] };
  return { email: req.headers['x-user-email'] };
}

export function requireAdmin(user) {
  return user && user.email === 'abdulsist23@gmail.com';
}
