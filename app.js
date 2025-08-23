let attendance = JSON.parse(localStorage.getItem("absensi")) || [];
let scanCooldown = false; // flag jeda scan

function renderTable() {
  const tbody = document.getElementById("attendance");
  tbody.innerHTML = "";
  attendance.forEach((row, index) => {
    tbody.innerHTML += `<tr>
      <td>${row.id}</td>
      <td>${row.tanggal}</td>
      <td>${row.jamMasuk || ""}</td>
      <td>${row.jamPulang || ""}</td>
      <td>${row.lemburMasuk || ""}</td>
      <td>${row.lemburPulang || ""}</td>
      <td>
        <button onclick="editRow(${index})">Edit</button>
        <button onclick="deleteRow(${index})">Hapus</button>
      </td>
    </tr>`;
  });
}

function addAttendance(id) {
  const today = new Date().toLocaleDateString();
  let record = attendance.find(r => r.id === id && r.tanggal === today);
  const now = new Date().toLocaleTimeString();

  if (!record) {
    attendance.push({
      id, tanggal: today,
      jamMasuk: now,
      jamPulang: "",
      lemburMasuk: "",
      lemburPulang: ""
    });
    document.getElementById("status").innerText = `✅ ${id} jam masuk tercatat`;
  } else if (!record.jamPulang) {
    record.jamPulang = now;
    document.getElementById("status").innerText = `✅ ${id} jam pulang tercatat`;
  } else {
    document.getElementById("status").innerText = `ℹ️ ${id} sudah absen pulang`;
  }

  localStorage.setItem("absensi", JSON.stringify(attendance));
  renderTable();
}

function editRow(index) {
  const row = attendance[index];
  row.jamMasuk = prompt("Jam Masuk:", row.jamMasuk) || row.jamMasuk;
  row.jamPulang = prompt("Jam Pulang:", row.jamPulang) || row.jamPulang;
  row.lemburMasuk = prompt("Lembur Masuk:", row.lemburMasuk) || row.lemburMasuk;
  row.lemburPulang = prompt("Lembur Pulang:", row.lemburPulang) || row.lemburPulang;
  localStorage.setItem("absensi", JSON.stringify(attendance));
  renderTable();
}

function deleteRow(index) {
  if (confirm("Hapus data ini?")) {
    attendance.splice(index, 1);
    localStorage.setItem("absensi", JSON.stringify(attendance));
    renderTable();
  }
}

function exportCSV() {
  let csv = "ID,Tanggal,Jam Masuk,Jam Pulang,Lembur Masuk,Lembur Pulang\n";
  attendance.forEach(row => {
    csv += `${row.id},${row.tanggal},${row.jamMasuk || ""},${row.jamPulang || ""},${row.lemburMasuk || ""},${row.lemburPulang || ""}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "absensi.csv";
  a.click();
}

function startScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    decodedText => {
      if (scanCooldown) return;
      addAttendance(decodedText);
      scanCooldown = true;
      setTimeout(() => { scanCooldown = false; }, 3000); // jeda 3 detik
    }
  );
}

window.onload = () => {
  renderTable();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
  startScanner();
};
