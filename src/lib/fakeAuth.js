export function getUsers() {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
}

export function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export function registerUser(newUser) {
  const users = getUsers();

  const exists = users.find(
    (user) => user.email.toLowerCase() === newUser.email.toLowerCase()
  );

  if (exists) {
    return { success: false, message: "Account already exists" };
  }

  users.push(newUser);
  saveUsers(users);

  return { success: true };
}

export function loginUser(email, password) {
  const users = getUsers();

  const user = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );

  if (!user) {
    return { success: false };
  }

  localStorage.setItem("currentUser", JSON.stringify(user));

  return { success: true };
}

export function logoutUser() {
  localStorage.removeItem("currentUser");
}

export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}
