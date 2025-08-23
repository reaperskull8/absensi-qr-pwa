// === CONFIG ===
// whitelist ID (opsional)
const validIds = null; // atau new Set(["K001","K002"]);

// state
let attendance = JSON.parse(localStorage.getItem("absensi")) || [];
let scanCooldown = false;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function timeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}
function save() {
  localStorage.setItem("absensi", JSON.stringify(attendance));
}
function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}
function playAudio(type) {
  const el = document.getElementById(type === "success" ? "audioSuccess" : type === "info" ? "audioInfo" : "audioError");
  if (el) el.play().catch(()=>{});
}
function isValidId(id) {
  if (!id || typeof id !== "string") return false;
  return validIds ? validIds.has(id.trim()) : true;
}

function renderTable() {
  const tbody = document.getElementById("attendance");
  tbody.innerHTML = "";
  attendance.forEach((r, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${r.id}</td><td>${r.tanggal}</td><td>${r.jamMasuk}</td><td>${r.jamPulang}</td>
        <td>${r.lemburMasuk}</td><td>${r.lemburPulang}</td>
        <td>
          <button onclick="editRow(${i})">Edit</button>
          <button onclick="deleteRow(${i})">Hapus</button>
        </td>
      </tr>`;
  });
}

function addAttendance(id) {
  if (!isValidId(id)) {
    setStatus(`❌ ID tidak valid: ${id}`);
    playAudio("error");
    return;
  }
  const tgl = todayStr(), now = timeStr();
  let rec = attendance.find(r => r.id === id && r.tanggal === tgl);
  if (!rec) {
    rec = { id, tanggal:tgl, jamMasuk: now, jamPulang:"", lemburMasuk:"", lemburPulang:"" };
    attendance.push(rec);
    setStatus(`✅ ${id} masuk ${now}`);
    playAudio("success");
  } else if (!rec.jamPulang) {
    rec.jamPulang = now;
    setStatus(`✅ ${id} pulang ${now}`);
    playAudio("success");
  } else if (!rec.lemburMasuk) {
    rec.lemburMasuk = now;
    setStatus(`✅ ${id} lembur masuk ${now}`);
    playAudio("success");
  } else if (!rec.lemburPulang) {
    rec.lemburPulang = now;
    setStatus(`✅ ${id} lembur pulang ${now}`);
    playAudio("success");
  } else {
    setStatus(`ℹ️ ${id} sudah lengkap hari ini`);
    playAudio("info");
  }
  save(); renderTable();
}

function editRow(i) {
  const r = attendance[i];
  r.jamMasuk = prompt("Masuk:", r.jamMasuk) || r.jamMasuk;
  r.jamPulang = prompt("Pulang:", r.jamPulang) || r.jamPulang;
  r.lemburMasuk = prompt("Lembur Masuk:", r.lemburMasuk) || r.lemburMasuk;
  r.lemburPulang = prompt("Lembur Pulang:", r.lemburPulang) || r.lemburPulang;
  save(); renderTable();
}
function deleteRow(i) {
  if (confirm("Hapus baris ini?")) {
    attendance.splice(i,1);
    save(); renderTable();
  }
}
function clearToday() {
  const tgl = todayStr();
  if (confirm(`Hapus semua data tanggal ${tgl}?`)) {
    attendance = attendance.filter(r=>r.tanggal !== tgl);
    save(); renderTable();
  }
}
function exportCSV() {
  let csv = "ID,Tanggal,Masuk,Pulang,Lembur Masuk,Lembur Pulang\n";
  attendance.forEach(r => {
    csv += `${r.id},${r.tanggal},${r.jamMasuk},${r.jamPulang},${r.lemburMasuk},${r.lemburPulang}\n`;
  });
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "absensi.csv";
  a.click();
}

function startScanner() {
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode:"environment" },
    { fps:10, qrbox:250 },
    txt => {
      if (scanCooldown) return;
      scanCooldown = true;
      addAttendance(txt.trim());
      setTimeout(() => scanCooldown = false, 3000);
    },
    _err => {}
  ).catch(e => console.error(e));
}

window.onload = () => {
  renderTable();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
  startScanner();
};
