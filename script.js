const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";

function renderPie(id, dataset) {
  new Chart(document.getElementById(id), {
    type: 'pie',
    data: {
      labels: dataset.labels,
      datasets: [{
        data: dataset.data,
        backgroundColor: dataset.colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const count = context.parsed;
              const vms = dataset.vmMap[label] || [];
              return [`${label}: ${count} VM(s)`].concat(vms.map(v => `• ${v}`));
            }
          }
        }
      }
    }
  });
}

function renderVmSizeBarChart(sizeCounts) {
  const labels = Object.keys(sizeCounts);
  const values = Object.values(sizeCounts);

  new Chart(document.getElementById("vmSizeChart"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '# of VMs',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
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
    const rowStyle = row["Ghost_VM (CPU < 2%)"] === "Yes" || row["Ghost_VM (RAM < 2%)"] === "Yes"
      ? "table-danger" : row["Underutilized_VM (CPU < 5%)"] === "Yes" || row["Underutilized_VM (RAM < 5%)"] === "Yes"
      ? "table-warning" : "";
    return `<tr class="${rowStyle}">` + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>";
  }).join("") + "</tbody>";

  table.innerHTML = thead + tbody;
  container.innerHTML = "";
  container.appendChild(table);
  $(table).DataTable(); // Enable sorting/search
}

window.addEventListener("DOMContentLoaded", () => {
  fetch(csvUrl)
    .then(res => res.text())
    .then(text => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          const data = results.data;
          renderTable(data);

          const cpuPie = {
            labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'],
            data: [0, 0, 0],
            colors: ['#e74c3c', '#f1c40f', '#2ecc71'],
            vmMap: { 'Ghost (<2%)': [], 'Underutilized (<5%)': [], 'Healthy (≥5%)': [] }
          };

          const ramPie = {
            labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'],
            data: [0, 0, 0],
            colors: ['#e74c3c', '#f1c40f', '#2ecc71'],
            vmMap: { 'Ghost (<2%)': [], 'Underutilized (<5%)': [], 'Healthy (≥5%)': [] }
          };

          const vmSizeCounts = {};

          data.forEach(row => {
            const name = row["VM_Name"] || "Unknown";

            // CPU
            if (row["Ghost_VM (CPU < 2%)"] === "Yes") {
              cpuPie.data[0]++;
              cpuPie.vmMap["Ghost (<2%)"].push(name);
            } else if (row["Underutilized_VM (CPU < 5%)"] === "Yes") {
              cpuPie.data[1]++;
              cpuPie.vmMap["Underutilized (<5%)"].push(name);
            } else {
              cpuPie.data[2]++;
              cpuPie.vmMap["Healthy (≥5%)"].push(name);
            }

            // RAM
            if (row["Ghost_VM (RAM < 2%)"] === "Yes") {
              ramPie.data[0]++;
              ramPie.vmMap["Ghost (<2%)"].push(name);
            } else if (row["Underutilized_VM (RAM < 5%)"] === "Yes") {
              ramPie.data[1]++;
              ramPie.vmMap["Underutilized (<5%)"].push(name);
            } else {
              ramPie.data[2]++;
              ramPie.vmMap["Healthy (≥5%)"].push(name);
            }

            // VM Size
            const size = row["VM_Size"] || "Unknown";
            if (!vmSizeCounts[size]) vmSizeCounts[size] = 0;
            vmSizeCounts[size]++;
          });

          renderPie("cpuChart", cpuPie);
          renderPie("ramChart", ramPie);
          renderVmSizeBarChart(vmSizeCounts);
        }
      });
    })
    .catch(err => {
      document.getElementById("table-container").innerHTML = "<div class='text-danger'>Failed to load CSV data.</div>";
      console.error(err);
    });
});
