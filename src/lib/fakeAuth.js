const DEFAULT_USERS = [
  {
    name: "System Admin",
    email: "admin@ums.edu",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Prof. Ahmed Hassan",
    email: "ahmed.hassan@ums.edu",
    password: "prof123",
    role: "professor",
  },
  {
    name: "Prof. Mona Adel",
    email: "mona.adel@ums.edu",
    password: "prof123",
    role: "professor",
  },
  {
    name: "Prof. Karim Samir",
    email: "karim.samir@ums.edu",
    password: "prof123",
    role: "professor",
  },
];

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function mergeDefaultUsers(users) {
  const normalized = users.map((user) => normalizeEmail(user.email));
  const missingDefaults = DEFAULT_USERS.filter(
    (defaultUser) => !normalized.includes(normalizeEmail(defaultUser.email))
  );

  return [...missingDefaults, ...users];
}

export function getUsers() {
  if (typeof window === "undefined") return [];

  const storedUsers = localStorage.getItem("users");
  const users = storedUsers ? JSON.parse(storedUsers) : [];
  const mergedUsers = mergeDefaultUsers(users);

  if (!storedUsers || mergedUsers.length !== users.length) {
    localStorage.setItem("users", JSON.stringify(mergedUsers));
  }

  return mergedUsers;
}

export function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export function getStudents() {
  return getUsers().filter((user) => (user.role || "student") === "student");
}

export function getProfessors() {
  return getUsers().filter((user) => user.role === "professor");
}

export function registerUser(newUser) {
  const users = getUsers();
  const exists = users.find(
    (user) => normalizeEmail(user.email) === normalizeEmail(newUser.email)
  );

  if (exists) {
    return { success: false, message: "Account already exists" };
  }

  users.push({
    ...newUser,
    email: newUser.email.trim(),
    role: newUser.role || "student",
  });

  saveUsers(users);

  return { success: true };
}

export function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(
    (item) =>
      normalizeEmail(item.email) === normalizeEmail(email) &&
      item.password === password
  );

  if (!user) {
    return { success: false };
  }

  localStorage.setItem("currentUser", JSON.stringify(user));

  return { success: true, user };
}

export function logoutUser() {
  localStorage.removeItem("currentUser");
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}
