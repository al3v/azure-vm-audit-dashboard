const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";

function renderPieChart(id, dataset, title) {
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
        legend: { position: 'bottom' },
        title: {
          display: false,
          text: title
        }
      }
    }
  });
}

function renderVmSizeBarChart(sizeCounts) {
  const sortedEntries = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1]);
  const labels = sortedEntries.map(([key]) => key);
  const values = sortedEntries.map(([_, val]) => val);

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
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 30,
            minRotation: 30,
            autoSkip: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

function renderSubscriptionBarChart(subscriptionCounts) {
  const sorted = Object.entries(subscriptionCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([_, v]) => v);

  new Chart(document.getElementById("subscriptionChart"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '# of VMs',
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function renderTable(data) {
  const container = document.getElementById("table-container");
  const headers = Object.keys(data[0]);
  const table = document.createElement("table");
  table.className = "table table-bordered table-hover table-sm display";

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
  $(table).DataTable(); // enable search/sort
}

fetch(csvUrl)
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const data = results.data;
        renderTable(data);

        const cpu = { labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'], data: [0, 0, 0], colors: ['#e74c3c', '#f1c40f', '#2ecc71'] };
        const ram = { labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'], data: [0, 0, 0], colors: ['#e74c3c', '#f1c40f', '#2ecc71'] };
        const sizeCounts = {};
        const subscriptionCounts = {};

        data.forEach(row => {
          const cpuVal = parseFloat(row["Avg_CPU_Usage"]);
          const ramVal = parseFloat(row["Avg_RAM_Usage"]);

          if (!isNaN(cpuVal)) {
            if (cpuVal < 2) cpu.data[0]++;
            else if (cpuVal < 5) cpu.data[1]++;
            else cpu.data[2]++;
          }

          if (!isNaN(ramVal)) {
            if (ramVal < 2) ram.data[0]++;
            else if (ramVal < 5) ram.data[1]++;
            else ram.data[2]++;
          }

          const size = row["VM_Size"] || "Unknown";
          sizeCounts[size] = (sizeCounts[size] || 0) + 1;

          const sub = row["Subscription"] || "Unknown";
          subscriptionCounts[sub] = (subscriptionCounts[sub] || 0) + 1;
        });

        renderPieChart("cpuChart", cpu, "CPU Usage");
        renderPieChart("ramChart", ram, "RAM Usage");
        renderVmSizeBarChart(sizeCounts);
        renderSubscriptionBarChart(subscriptionCounts);
      }
    });
  })
  .catch(err => {
    document.getElementById("table-container").innerHTML = "<div class='text-danger'>Failed to load CSV data.</div>";
    console.error(err);
  });
