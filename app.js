let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
const statusEl = document.getElementById("status");

// Audio
function playAudio(type) {
  document.getElementById("audio-" + type).play();
}
function setStatus(msg) {
  statusEl.textContent = msg;
}

// Util waktu
function minutesDiff(t1, t2) {
  const d1 = new Date("2000-01-01T" + t1 + ":00");
  const d2 = new Date("2000-01-01T" + t2 + ":00");
  return (d2 - d1) / 60000;
}
function isWithinTimeRange(start, end) {
  const now = new Date();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startTime = new Date(now); startTime.setHours(sh, sm, 0);
  const endTime = new Date(now); endTime.setHours(eh, em, 0);
  return now >= startTime && now <= endTime;
}

// Simpan & render tabel
function saveAttendance() {
  localStorage.setItem("attendance", JSON.stringify(attendance));
}
function renderTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";
  attendance.forEach((rec, i) => {
    const row = `<tr>
      <td>${rec.id}</td>
      <td>${rec.tanggal}</td>
      <td>${rec.jamMasuk || "-"}</td>
      <td>${rec.jamPulang || "-"}</td>
      <td>${rec.lemburMasuk || "-"}</td>
      <td>${rec.lemburPulang || "-"}</td>
      <td><button onclick="hapus(${i})">Hapus</button></td>
    </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}
function hapus(i) {
  attendance.splice(i, 1);
  saveAttendance();
  renderTable();
}

// Aturan absensi
function addAttendance(id) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);

  let record = attendance.find(r => r.id === id && r.tanggal === today);

  if (!record) {
    if (!isWithinTimeRange("07:30", "09:00")) {
      setStatus(`❌ ${id} hanya bisa absen masuk 07:30–09:00`);
      playAudio("error");
      return;
    }
    attendance.push({ id, tanggal: today, jamMasuk: now, jamPulang: "", lemburMasuk: "", lemburPulang: "" });
    setStatus(`✅ ${id} masuk ${now} tercatat`);
    playAudio("success");

  } else if (!record.jamPulang) {
    if (!isWithinTimeRange("17:00", "20:00")) {
      setStatus(`❌ ${id} hanya bisa absen pulang 17:00–20:00`);
      playAudio("error");
      return;
    }
    record.jamPulang = now;
    setStatus(`✅ ${id} pulang ${now} tercatat`);
    playAudio("success");

  } else if (!record.lemburMasuk) {
    if (minutesDiff(record.jamPulang, now) < 60) {
      setStatus(`❌ ${id} lembur masuk minimal 60 menit setelah jam pulang`);
      playAudio("error");
      return;
    }
    record.lemburMasuk = now;
    setStatus(`✅ ${id} lembur masuk ${now} tercatat`);
    playAudio("success");

  } else if (!record.lemburPulang) {
    if (minutesDiff(record.lemburMasuk, now) < 120) {
      setStatus(`❌ ${id} lembur pulang minimal 2 jam setelah lembur masuk`);
      playAudio("error");
      return;
    }
    record.lemburPulang = now;
    setStatus(`✅ ${id} lembur pulang ${now} tercatat`);
    playAudio("success");

  } else {
    setStatus(`ℹ️ ${id} absensi hari ini sudah lengkap`);
    playAudio("info");
  }

  saveAttendance();
  renderTable();
}

// QR Scanner
function onScanSuccess(decodedText) {
  addAttendance(decodedText.trim());
}
const html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);

// Init
renderTable();
