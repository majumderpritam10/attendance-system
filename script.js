// Simple Attendance Manager using localStorage
// Data structures:
// students -> array of {id, name}
// attendanceData -> object keyed by date (YYYY-MM-DD) mapping to { studentId: "Present"/"Absent" }

const studentsKey = 'ams_students_v1';
const attendanceKey = 'ams_attendance_v1';

const studentNameInput = document.getElementById('studentNameInput');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentsTableBody = document.querySelector('#studentsTable tbody');

const dateInput = document.getElementById('dateInput');
const loadDateBtn = document.getElementById('loadDateBtn');
const todayBtn = document.getElementById('todayBtn');

const attendanceTableBody = document.querySelector('#attendanceTable tbody');
const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
const markAllPresentBtn = document.getElementById('markAllPresentBtn');
const markAllAbsentBtn = document.getElementById('markAllAbsentBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearDataBtn = document.getElementById('clearDataBtn');

const reportDiv = document.getElementById('report');

let students = loadStudents();
let attendanceData = loadAttendanceData();

// init
renderStudents();
setTodayIfEmpty();
loadAttendanceForDate(dateInput.value);

// helpers
function uid() {
  return 's' + Math.random().toString(36).slice(2, 9);
}

function saveStudents() {
  localStorage.setItem(studentsKey, JSON.stringify(students));
}

function loadStudents() {
  const raw = localStorage.getItem(studentsKey);
  return raw ? JSON.parse(raw) : [
    // starter sample students (you can remove these later)
    {id: uid(), name: 'Alice'},
    {id: uid(), name: 'Bob'},
    {id: uid(), name: 'Charlie'}
  ];
}

function saveAttendanceData() {
  localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
}

function loadAttendanceData() {
  const raw = localStorage.getItem(attendanceKey);
  return raw ? JSON.parse(raw) : {};
}

function formatDateISO(d) {
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2,'0');
  const day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function setTodayIfEmpty(){
  if (!dateInput.value) {
    dateInput.value = formatDateISO(new Date());
  }
}

// Students UI
addStudentBtn.addEventListener('click', () => {
  const name = studentNameInput.value.trim();
  if (!name) {
    alert('Enter a student name');
    return;
  }
  students.push({id: uid(), name});
  saveStudents();
  studentNameInput.value = '';
  renderStudents();
  loadAttendanceForDate(dateInput.value); // refresh attendance area
});

function renderStudents(){
  studentsTableBody.innerHTML = '';
  students.forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td>
      <td>${escapeHtml(s.name)}</td>
      <td><button class="btn-small" data-id="${s.id}">Remove</button></td>`;
    studentsTableBody.appendChild(tr);
  });
  // attach remove handlers
  document.querySelectorAll('#studentsTable button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      if (!confirm('Remove student?')) return;
      students = students.filter(x => x.id !== id);
      saveStudents();
      renderStudents();
      loadAttendanceForDate(dateInput.value);
    });
  });
}

// Attendance UI
loadDateBtn.addEventListener('click', () => {
  loadAttendanceForDate(dateInput.value);
});

todayBtn.addEventListener('click', () => {
  dateInput.value = formatDateISO(new Date());
  loadAttendanceForDate(dateInput.value);
});

function loadAttendanceForDate(dateStr) {
  const dateKey = formatDateISO(dateStr || new Date());
  dateInput.value = dateKey;
  if (!attendanceData[dateKey]) {
    // initialize empty for that date
    attendanceData[dateKey] = {};
  }
  renderAttendanceTable(dateKey);
  renderReport(dateKey);
}

function renderAttendanceTable(dateKey) {
  attendanceTableBody.innerHTML = '';
  students.forEach((s, idx) => {
    const status = attendanceData[dateKey] && attendanceData[dateKey][s.id] ? attendanceData[dateKey][s.id] : 'Absent';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx+1}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>
        <select class="status-select" data-id="${s.id}">
          <option ${status === 'Present' ? 'selected' : ''}>Present</option>
          <option ${status === 'Absent' ? 'selected' : ''}>Absent</option>
        </select>
      </td>`;
    attendanceTableBody.appendChild(tr);
  });

  // attach change handlers
  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = sel.dataset.id;
      const val = sel.value;
      const d = dateKey;
      attendanceData[d] = attendanceData[d] || {};
      attendanceData[d][id] = val;
      // we do not auto-save to localStorage here to let user press Save
      renderReport(d);
    });
  });
}

markAllPresentBtn.addEventListener('click', () => {
  const d = dateInput.value;
  attendanceData[d] = attendanceData[d] || {};
  students.forEach(s => attendanceData[d][s.id] = 'Present');
  renderAttendanceTable(d);
  renderReport(d);
});

markAllAbsentBtn.addEventListener('click', () => {
  const d = dateInput.value;
  attendanceData[d] = attendanceData[d] || {};
  students.forEach(s => attendanceData[d][s.id] = 'Absent');
  renderAttendanceTable(d);
  renderReport(d);
});

saveAttendanceBtn.addEventListener('click', () => {
  const d = dateInput.value;
  // read current select values
  document.querySelectorAll('.status-select').forEach(sel => {
    const id = sel.dataset.id;
    const val = sel.value;
    attendanceData[d] = attendanceData[d] || {};
    attendanceData[d][id] = val;
  });
  saveAttendanceData();
  alert('Attendance saved for ' + d);
});

// Report
function renderReport(dateKey) {
  const d = dateKey;
  const data = attendanceData[d] || {};
  const total = students.length;
  const present = students.filter(s => data[s.id] === 'Present').length;
  const absent = total - present;
  reportDiv.innerHTML = `<strong>Date:</strong> ${d} <br>
    <strong>Total:</strong> ${total} &nbsp; <strong>Present:</strong> ${present} &nbsp; <strong>Absent:</strong> ${absent}`;
}

// CSV export
exportCsvBtn.addEventListener('click', () => {
  const d = dateInput.value;
  const data = attendanceData[d] || {};
  let csv = 'Name,Status,Date\n';
  students.forEach(s => {
    csv += `"${s.name.replace(/"/g,'""')}",${data[s.id] || 'Absent'},${d}\n`;
  });
  downloadFile(`attendance_${d}.csv`, csv, 'text/csv');
});

function downloadFile(filename, content, type='text/plain') {
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Clear all data (students + attendance)
clearDataBtn.addEventListener('click', () => {
  if (!confirm('This will remove all students and attendance from your browser. Continue?')) return;
  localStorage.removeItem(studentsKey);
  localStorage.removeItem(attendanceKey);
  students = loadStudents();
  attendanceData = {};
  saveStudents();
  saveAttendanceData();
  renderStudents();
  loadAttendanceForDate(formatDateISO(new Date()));
});

// small utility
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
