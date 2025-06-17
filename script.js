
const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";

const cpuPie = {
  labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'],
  data: [2, 2, 10],
  colors: ['#e74c3c', '#f1c40f', '#2ecc71']
};

const ramPie = {
  labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'],
  data: [0, 0, 14],
  colors: ['#e74c3c', '#f1c40f', '#2ecc71']
};

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
}

fetch(csvUrl)
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: results => renderTable(results.data)
    });
  })
  .catch(err => {
    document.getElementById("table-container").innerHTML = "<div class='text-danger'>Failed to load CSV data.</div>";
    console.error(err);
  });

window.addEventListener("DOMContentLoaded", () => {
  renderPie("cpuChart", cpuPie);
  renderPie("ramChart", ramPie);
};
