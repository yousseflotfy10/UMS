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
    return { success: false, message: "An account with this email already exists." };
  }

  users.push(newUser);
  saveUsers(users);

  return { success: true, message: "Account created successfully." };
}

export function loginUser(email, password) {
  const users = getUsers();

  const user = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  );

  if (!user) {
    return { success: false, message: "Invalid email or password." };
  }

  localStorage.setItem("currentUser", JSON.stringify(user));

  return { success: true, user };
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

export function isProfessor() {
  const user = getCurrentUser();
  return user && user.role === "professor";
}

export function isStudent() {
  const user = getCurrentUser();
  return user && user.role === "student";
}

export function logoutUser() {
  localStorage.removeItem("currentUser");
}

export function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}
