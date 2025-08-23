// ====== OPSIONAL: daftar ID valid ======
// Jika ingin validasi ketat, isi Set berikut:
// const validIds = new Set(["K001","K002","K003"]);
// Jika tidak ingin validasi (semua QR diterima), set ke null:
const validIds = null;

// ====== state ======
let attendance = JSON.parse(localStorage.getItem("absensi")) || [];
let scanCooldown = false; // jeda anti double-scan

function save() {
  localStorage.setItem("absensi", JSON.stringify(attendance));
}

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
        <button onclick="toggleLembur(${index})">Lembur ⏱️</button>
      </td>
    </tr>`;
  });
}

function playAudio(kind) {
  const map = {
    success: document.getElementById("audioSuccess"),
    info:    document.getElementById("audioInfo"),
    error:   document.getElementById("audioError"),
  };
  const el = map[kind];
  if (!el) return;
  // tangani promise play() yang mungkin ditolak jika device mute
  const p = el.play();
  if (p && typeof p.catch === "function") p.catch(()=>{});
}

function todayStr() {
  // Format tanggal lokal agar konsisten (YYYY-MM-DD lebih aman untuk ekspor)
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function timeStr() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  return `${hh}:${mm}:${ss}`;
}

function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

function isValidId(id) {
  if (typeof id !== "string" || !id.trim()) return false;
  if (validIds === null) return true;         // tidak pakai whitelist
  return validIds.has(id.trim());             // pakai whitelist
}

function addAttendance(id) {
  // validasi dasar
  if (!isValidId(id)) {
    setStatus(`❌ QR tidak dikenali / ID tidak valid: ${id}`);
    playAudio("error");
    return;
  }

  const today = todayStr();
  let record = attendance.find(r => r.id === id && r.tanggal === today);
  const now = timeStr();

  if (!record) {
    // scan pertama hari ini -> jam masuk
    attendance.push({
      id, tanggal: today,
      jamMasuk: now,
      jamPulang: "",
      lemburMasuk: "",
      lemburPulang: ""
    });
    setStatus(`✅ ${id} jam masuk ${now} tercatat`);
    playAudio("success");
  } else if (!record.jamPulang) {
    // scan kedua -> jam pulang
    record.jamPulang = now;
    setStatus(`✅ ${id} jam pulang ${now} tercatat`);
    playAudio("success");
  } else {
    // sudah absen pulang – anggap info
    setStatus(`ℹ️ ${id} sudah absen pulang (${record.jamPulang})`);
    playAudio("info");
  }

  save();
  renderTable();
}

function editRow(index) {
  const row = attendance[index];
  row.jamMasuk     = prompt("Jam Masuk (HH:MM:SS):", row.jamMasuk) || row.jamMasuk;
  row.jamPulang    = prompt("Jam Pulang (HH:MM:SS):", row.jamPulang) || row.jamPulang;
  row.lemburMasuk  = prompt("Lembur Masuk (HH:MM:SS):", row.lemburMasuk) || row.lemburMasuk;
  row.lemburPulang = prompt("Lembur Pulang (HH:MM:SS):", row.lemburPulang) || row.lemburPulang;
  save();
  renderTable();
}

function deleteRow(index) {
  if (confirm("Hapus data ini?")) {
    attendance.splice(index, 1);
    save();
    renderTable();
  }
}

// tombol cepat untuk lembur: isi masuk/pulang berurutan
function toggleLembur(index) {
  const row = attendance[index];
  const now = timeStr();
  if (!row.lemburMasuk) {
    row.lemburMasuk = now;
    setStatus(`🟢 ${row.id} lembur masuk ${now}`);
  } else if (!row.lemburPulang) {
    row.lemburPulang = now;
    setStatus(`🔵 ${row.id} lembur pulang ${now}`);
  } else {
    setStatus(`ℹ️ ${row.id} lembur sudah lengkap (${row.lemburMasuk}–${row.lemburPulang})`);
  }
  playAudio("success");
  save();
  renderTable();
}

function clearToday() {
  const t = todayStr();
  if (!confirm(`Hapus semua data tanggal ${t}?`)) return;
  attendance = attendance.filter(r => r.tanggal !== t);
  save();
  renderTable();
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
    { fps: 10, qrbox: 300 },
    decodedText => {
      if (scanCooldown) return;
      addAttendance(decodedText.trim());

      // aktifkan cooldown 3 detik
      scanCooldown = true;
      setTimeout(() => { scanCooldown = false; }, 3000);
    },
    // optional error callback (bisa pakai untuk bunyi error decode jika mau)
    // (errorMsg) => { /* console.warn(errorMsg); */ }
  );
}

window.onload = () => {
  renderTable();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
  startScanner();
};
