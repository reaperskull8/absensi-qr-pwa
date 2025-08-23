let lastScanTime = 0;
let attendance = JSON.parse(localStorage.getItem("absensi")) || [];

// 🔊 fungsi untuk mainkan audio
function playAudio(type) {
  if (type === "success") document.getElementById("audioSuccess").play();
  if (type === "error") document.getElementById("audioError").play();
  if (type === "info") document.getElementById("audioInfo").play();
}

// 📝 fungsi untuk tambah absensi
function addAttendance(id) {
  const nowTime = new Date().getTime();
  if (nowTime - lastScanTime < 3000) {
    document.getElementById("status").innerText =
      "⚠️ Tunggu 3 detik sebelum scan lagi!";
    playAudio("error");
    return;
  }
  lastScanTime = nowTime;

  const today = new Date().toLocaleDateString();
  const now = new Date().toLocaleTimeString();

  // cari record berdasarkan id + tanggal
  let record = attendance.find(r => r.id === id && r.tanggal === today);

  if (!record) {
    // record baru
    record = {
      id,
      tanggal: today,
      jamMasuk: now,
      jamPulang: "",
      lemburMasuk: "",
      lemburPulang: ""
    };
    attendance.push(record);
    document.getElementById("status").innerText = `✅ ${id} jam masuk tercatat`;
    playAudio("success");
  } else if (!record.jamPulang) {
    record.jamPulang = now;
    document.getElementById("status").innerText = `✅ ${id} jam pulang tercatat`;
    playAudio("success");
  } else if (!record.lemburMasuk) {
    record.lemburMasuk = now;
    document.getElementById("status").innerText = `✅ ${id} lembur masuk tercatat`;
    playAudio("success");
  } else if (!record.lemburPulang) {
    record.lemburPulang = now;
    document.getElementById("status").innerText = `✅ ${id} lembur pulang tercatat`;
    playAudio("success");
  } else {
    document.getElementById("status").innerText = `ℹ️ ${id} sudah lengkap absen hari ini`;
    playAudio("info");
  }

  // simpan dan render tabel
  localStorage.setItem("absensi", JSON.stringify(attendance));
  renderTable();
}

// 📊 render tabel absensi
function renderTable() {
  const tbody = document.getElementById("data-absen");
  tbody.innerHTML = "";
  attendance.forEach((r, i) => {
    let row = `
      <tr>
        <td>${i + 1}</td>
        <td>${r.id}</td>
        <td>${r.tanggal}</td>
        <td>${r.jamMasuk || "-"}</td>
        <td>${r.jamPulang || "-"}</td>
        <td>${r.lemburMasuk || "-"}</td>
        <td>${r.lemburPulang || "-"}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// 🚀 setup QR scanner
function onScanSuccess(decodedText, decodedResult) {
  addAttendance(decodedText); // panggil absensi
}

function onScanFailure(error) {
  // bisa diabaikan, biar ga spam
  // console.warn(`Scan gagal: ${error}`);
}

window.onload = function () {
  renderTable();

  let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    { fps: 10, qrbox: 250 }
  );
  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
};
