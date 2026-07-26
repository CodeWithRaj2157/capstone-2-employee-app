// The frontend calls "/api/..." — nginx (see nginx.conf) proxies this
// to the backend container, so the browser never needs to know the
// backend's internal Docker network address.

const API_URL = "/api/employees";
const form = document.getElementById("employee-form");
const list = document.getElementById("employee-list");
const status = document.getElementById("status");
const message = document.getElementById("form-message");

async function loadEmployees() {
  try {
    const res = await fetch(API_URL);
    const employees = await res.json();
    render(employees);
    status.textContent = `Connected • ${employees.length} employee(s) registered`;
  } catch (err) {
    status.textContent = "Could not reach backend API";
  }
}

function render(employees) {
  list.innerHTML = "";
  employees.forEach((emp) => {
    const tr = document.createElement("tr");

    const joined = new Date(emp.dateOfJoining).toLocaleDateString();

    tr.innerHTML = `
      <td>${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(emp.email)}</td>
      <td>${escapeHtml(emp.department)}</td>
      <td>${escapeHtml(emp.designation)}</td>
      <td>${joined}</td>
      <td></td>
    `;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Remove";
    delBtn.className = "delete-btn";
    delBtn.onclick = () => deleteEmployee(emp._id);
    tr.lastElementChild.appendChild(delBtn);

    list.appendChild(tr);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function deleteEmployee(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadEmployees();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    department: document.getElementById("department").value,
    designation: document.getElementById("designation").value.trim(),
    dateOfJoining: document.getElementById("dateOfJoining").value,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.error || "Registration failed";
      message.className = "error";
      return;
    }

    message.textContent = "Employee registered successfully!";
    message.className = "success";
    form.reset();
    loadEmployees();
  } catch (err) {
    message.textContent = "Could not reach backend API";
    message.className = "error";
  }
});

loadEmployees();
