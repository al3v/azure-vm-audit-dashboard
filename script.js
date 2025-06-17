

const cpuVMs = {
  "Ghost (<2%)": ["eSUBmgr3-Trial-eSUB-Production-Linux-VM", "Presales-Multi-Linux-VM"],
  "Underutilized (<5%)": ["PreGeneris-eCTD-DC-VM", "PreGeneris-eSUB-Production-Linux-VM"],
  "Healthy (≥5%)": ["eSUBmgr3-Trial-eSUB-Production-VM", "PreGeneris-eCTD-SH-VM", "PreGeneris-eSUB-Production-VM", "Presales-Multi-01-SH-VM", "Presales-Multi-02-SH-VM", "Presales-Multi-03-SH-VM", "Presales-Multi-DC-VM", "BasicSKU-Levy", "CMK-Temp-VM", "RClone-VMLevy"]
};


const ramVMs = {
  "Ghost (<2%)": [],
  "Underutilized (<5%)": [],
  "Healthy (≥5%)": ["eSUBmgr3-Trial-eSUB-Production-Linux-VM", "eSUBmgr3-Trial-eSUB-Production-VM", "PreGeneris-eCTD-DC-VM", "PreGeneris-eCTD-SH-VM", "PreGeneris-eSUB-Production-Linux-VM", "PreGeneris-eSUB-Production-VM", "Presales-Multi-01-SH-VM", "Presales-Multi-02-SH-VM", "Presales-Multi-03-SH-VM", "Presales-Multi-DC-VM", "Presales-Multi-Linux-VM", "BasicSKU-Levy", "CMK-Temp-VM", "RClone-VMLevy"]
};


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
            label: function(context) {
              const label = context.label || '';
              const vms = vmMap[label];
              return `${label}: ${vms.length} VM(s)\n` + vms.join(", ");
            }
          }
        }
      }
    }
  });
}


const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";




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
  renderPie("cpuChart", cpuPie, cpuVMs);
  renderPie("ramChart", ramPie, ramVMs);
  renderLegend("cpu-legend", cpuVMs);
  renderLegend("ram-legend", ramVMs);
});
