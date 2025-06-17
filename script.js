const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";

const cpuPie = {
  labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'],
  colors: ['#e74c3c', '#f1c40f', '#2ecc71']
};

const ramPie = {
  labels: ['Ghost (<2%)', 'Underutilized (<5%)', 'Healthy (≥5%)'],
  colors: ['#e74c3c', '#f1c40f', '#2ecc71']
};

function categorizeVMs(data) {
  const cpu = {
    "Ghost (<2%)": [],
    "Underutilized (<5%)": [],
    "Healthy (≥5%)": []
  };
  const ram = JSON.parse(JSON.stringify(cpu));

  data.forEach(row => {
    const vm = row["VM_Name"];
    if (row["Ghost_VM (CPU < 2%)"] === "Yes") {
      cpu["Ghost (<2%)"].push(vm);
    } else if (row["Underutilized_VM (CPU < 5%)"] === "Yes") {
      cpu["Underutilized (<5%)"].push(vm);
    } else {
      cpu["Healthy (≥5%)"].push(vm);
    }

    if (row["Ghost_VM (RAM < 2%)"] === "Yes") {
      ram["Ghost (<2%)"].push(vm);
    } else if (row["Underutilized_VM (RAM < 5%)"] === "Yes") {
      ram["Underutilized (<5%)"].push(vm);
    } else {
      ram["Healthy (≥5%)"].push(vm);
    }
  });

  return { cpu, ram };
}

function renderLegend(containerId, vmMap) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (const [label, vms] of Object.entries(vmMap)) {
    const block = document.createElement('div');
    block.innerHTML = `<strong>${label}:</strong><br><ul>` + vms.map(vm => `<li>${vm}</li>`).join('') + '</ul>';
    container.appendChild(block);
  }
}

function renderPie(id, dataset, vmMap) {
  const data = dataset.labels.map(label => vmMap[label].length);
  new Chart(document.getElementById(id), {
    type: 'pie',
    data: {
      labels: dataset.labels,
      datasets: [{
        data: data,
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
            label: function(context) {
              const label = context.label || '';
              const vms = vmMap[label] || [];
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
    const rowStyle = row["Ghost_VM (CPU < 2%)"] === "Yes" || row["Ghost_VM (RAM < 2%)"] === "Yes"
      ? "table-danger" : row["Underutilized_VM (CPU < 5%)"] === "Yes" || row["Underutilized_VM (RAM < 5%)"] === "Yes"
      ? "table-warning" : "";
    return `<tr class="${rowStyle}">` + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>";
  }).join("") + "</tbody>";

  table.innerHTML = thead + tbody;
  container.innerHTML = "";
  container.appendChild(table);

  // Enable DataTables filtering
  if (window.jQuery && $.fn.DataTable) {
    $(table).DataTable({
      pageLength: 10,
      dom: 'ftip',
      initComplete: function () {
        this.api().columns().every(function () {
          var column = this;
          if (column.index() < 6) {
            var select = $('<select><option value="">Filter</option></select>')
              .appendTo($(column.header()))
              .on('change', function () {
                var val = $.fn.dataTable.util.escapeRegex($(this).val());
                column.search(val ? '^' + val + '$' : '', true, false).draw();
              });
            column.data().unique().sort().each(function (d) {
              select.append('<option value="' + d + '">' + d + '</option>');
            });
          }
        });
      }
    });
  }
}

// Fetch CSV and trigger everything
fetch(csvUrl)
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const data = results.data;
        renderTable(data);
        const { cpu, ram } = categorizeVMs(data);
        renderPie("cpuChart", cpuPie, cpu);
        renderPie("ramChart", ramPie, ram);
        renderLegend("cpu-legend", cpu);
        renderLegend("ram-legend", ram);
      }
    });
  })
  .catch(err => {
    document.getElementById("table-container").innerHTML = "<div class='text-danger'>Failed to load CSV data.</div>";
    console.error(err);
  });
