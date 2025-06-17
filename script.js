const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";

function categorizeVMs(data) {
  const cpu = {
    "Ghost (<2%)": [],
    "Underutilized (<5%)": [],
    "Healthy (≥5%)": []
  };
  const ram = {
    "Ghost (<2%)": [],
    "Underutilized (<5%)": [],
    "Healthy (≥5%)": []
  };

  data.forEach(row => {
    const vm = row["VM_Name"];

    // CPU
    if (row["Ghost_VM (CPU < 2%)"] === "Yes") cpu["Ghost (<2%)"].push(vm);
    else if (row["Underutilized_VM (CPU < 5%)"] === "Yes") cpu["Underutilized (<5%)"].push(vm);
    else cpu["Healthy (≥5%)"].push(vm);

    // RAM
    if (row["Ghost_VM (RAM < 2%)"] === "Yes") ram["Ghost (<2%)"].push(vm);
    else if (row["Underutilized_VM (RAM < 5%)"] === "Yes") ram["Underutilized (<5%)"].push(vm);
    else ram["Healthy (≥5%)"].push(vm);
  });

  return { cpu, ram };
}

function renderPieChart(canvasId, dataMap, title) {
  const labels = Object.keys(dataMap);
  const data = labels.map(label => dataMap[label].length);
  const colors = {
    "Ghost (<2%)": "#e74c3c",
    "Underutilized (<5%)": "#f1c40f",
    "Healthy (≥5%)": "#2ecc71"
  };

  new Chart(document.getElementById(canvasId), {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: labels.map(label => colors[label])
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title
        },
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const vms = dataMap[label] || [];
              return `${label}: ${vms.length} VM(s)\n` + vms.map(vm => `• ${vm}`).join("\n");
            }
          }
        }
      }
    }
  });
}

function renderTable(data) {
  const container = document.getElementById("table-container");
  const headers = Object.keys(data[0]);
  const table = document.createElement("table");
  table.className = "table table-bordered table-hover table-sm";

  const thead = "<thead class='table-light'><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr></thead>";
  const tbody = "<tbody>" + data.map(row => {
    const isGhost = row["Ghost_VM (CPU < 2%)"] === "Yes" || row["Ghost_VM (RAM < 2%)"] === "Yes";
    const isUnder = row["Underutilized_VM (CPU < 5%)"] === "Yes" || row["Underutilized_VM (RAM < 5%)"] === "Yes";
    const rowClass = isGhost ? "table-danger" : isUnder ? "table-warning" : "";

    return `<tr class="${rowClass}">` + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>";
  }).join("") + "</tbody>";

  table.innerHTML = thead + tbody;
  container.innerHTML = "";
  container.appendChild(table);
}

// ✅ Parse with PapaParse (optional backup path)
Papa.parse(csvUrl, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    const data = results.data;
    const { cpu, ram } = categorizeVMs(data);

    renderPieChart("cpuChart", cpu, "CPU Usage Breakdown");
    renderPieChart("ramChart", ram, "RAM Usage Breakdown");
  }
});

// ✅ Fetch again for table rendering (needed for full content access)
fetch(csvUrl)
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const data = results.data;
        renderTable(data);
      }
    });
  })
  .catch(err => {
    document.getElementById("table-container").innerHTML = "<div class='text-danger'>Failed to load CSV data.</div>";
    console.error(err);
  });
