const attendance = JSON.parse(localStorage.getItem("absensi")) || [];

function renderTable() {
  const tbody = document.getElementById("attendance");
  tbody.innerHTML = "";
  attendance.forEach(row => {
    tbody.innerHTML += `<tr><td>${row.id}</td><td>${row.time}</td></tr>`;
  });
}

function addAttendance(id) {
  if (attendance.find(x => x.id === id)) {
    document.getElementById("status").innerText = `❌ ${id} sudah absen`;
    return;
  }
  const now = new Date().toLocaleString();
  attendance.push({ id, time: now });
  localStorage.setItem("absensi", JSON.stringify(attendance));
  renderTable();
  document.getElementById("status").innerText = `✅ ${id} berhasil absen`;
}

function exportCSV() {
  let csv = "ID,Waktu\n";
  attendance.forEach(row => {
    csv += `${row.id},${row.time}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "absensi.csv";
  a.click();
}

// setup scanner
function startScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => { addAttendance(decodedText); }
  );
}

window.onload = () => {
  renderTable();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
  startScanner();
};
