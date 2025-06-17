
const csvUrl = "https://malwarestorage123levy.blob.core.windows.net/vmaudit-reports/latest.csv?sp=r&st=2025-06-17T10:10:35Z&se=2027-06-01T18:13:35Z&spr=https&sv=2024-11-04&sr=b&sig=v6qehSQY%2B9wS9vZipmhTCVDnnVvWBdKz9le%2BnszLXc0%3D";

fetch(csvUrl)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        renderTable(results.data);
      }
    });
  })
  .catch(err => {
    document.getElementById("table-container").textContent = "Failed to load data.";
    console.error("Error fetching CSV:", err);
  });

function renderTable(data) {
  const container = document.getElementById("table-container");
  const table = document.createElement("table");

  const headers = Object.keys(data[0]);
  const thead = "<thead><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr></thead>";
  const tbody = "<tbody>" + data.map(row =>
    "<tr>" + headers.map(h => `<td>${row[h] || ""}</td>`).join("") + "</tr>"
  ).join("") + "</tbody>";

  table.innerHTML = thead + tbody;
  container.innerHTML = "";
  container.appendChild(table);
}
