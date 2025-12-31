let data = {
    received: 0,
    spent: 0,
    lent: 0,
    withMe: 0,
    logs: []
};

let currentMode = '';

function updateUI() {
    document.getElementById("receivedAmount").textContent = `₹${data.received}`;
    document.getElementById("spentAmount").textContent = `₹${data.spent}`;
    document.getElementById("lentAmount").textContent = `₹${data.lent}`;
    document.getElementById("withMeAmount").textContent = `₹${data.withMe}`;
    renderLogs();
    localStorage.setItem("budgetData", JSON.stringify(data));
}

function toggleFab() {
    const fab = document.getElementById("fabOptions");
    fab.style.display = fab.style.display === "flex" ? "none" : "flex";
}

function showModal(type) {
    currentMode = type;
    document.getElementById("modalTitle").textContent = `Add ${capitalize(type)}`;
    document.getElementById("modalCategory").style.display =
        type === "spent" ? "block" : "none";
    document.getElementById("entryModal").style.display = "flex";
    document.getElementById("modalAmount").value = "";
    document.getElementById("modalName").value = "";
    document.getElementById("modalDate").valueAsDate = new Date();
}

function hideModal() {
    document.getElementById("entryModal").style.display = "none";
}

window.onclick = function (e) {
    if (e.target.classList.contains("modal")) hideModal();
};

function submitEntry() {
    const amount = parseFloat(document.getElementById("modalAmount").value);
    const name = document.getElementById("modalName").value;
    const date = document.getElementById("modalDate").value;
    const category =
        currentMode === "spent"
            ? document.getElementById("modalCategory").value
            : currentMode;

    if (!amount || !date) return alert("Enter valid data");

    const month = date.slice(0, 7);
    const log = { type: category, amount, name, date, month };

    switch (currentMode) {
        case "received":
            data.received += amount;
            data.withMe += amount;
            break;

        case "spent":
            data.spent += amount;
            data.withMe -= amount;
            break;

        case "borrowed":
            data.lent += amount;
            data.withMe -= amount;
            break;

        case "repayment":
            data.lent -= amount;
            data.withMe += amount;
            break;

        case "withMe":
            data.withMe = amount;
            break;
    }

    if (currentMode !== "withMe") data.logs.push(log);

    updateUI();
    hideModal();
}

function renderLogs() {
    const container = document.getElementById("logList");
    const month = document.getElementById("filterMonth").value;
    const category = document.getElementById("filterCategory").value;
    container.innerHTML = "";

    const filteredLogs = data.logs.filter((l) => {
        const monthMatch = month === "all" || l.month === month;
        const catMatch = category === "all" || l.type === category;
        return monthMatch && catMatch;
    });

    const months = [...new Set(data.logs.map((l) => l.month))];
    const monthDropdown = document.getElementById("filterMonth");
    monthDropdown.innerHTML = '<option value="all">All Months</option>';

    months.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        monthDropdown.appendChild(opt);
    });

    filteredLogs
        .slice()
        .reverse()
        .forEach((log, i) => {
            const div = document.createElement("div");
            div.className = "log-item";
            div.innerHTML = `
                <div>
                    <strong>${capitalize(log.type)}</strong>
                    ₹${log.amount}
                    ${log.name ? `to/from ${log.name}` : ""}
                    on ${log.date}
                </div>
                <button onclick="deleteLog(${i})">X</button>
            `;
            container.appendChild(div);
        });
}

function recalculateTotals() {
    data.received = 0;
    data.spent = 0;
    data.lent = 0;
    data.withMe = 0;

    data.logs.forEach((log) => {
        switch (log.type) {
            case "received":
                data.received += log.amount;
                data.withMe += log.amount;
                break;

            case "spent":
                data.spent += log.amount;
                data.withMe -= log.amount;
                break;

            case "borrowed":
                data.lent += log.amount;
                data.withMe -= log.amount;
                break;

            case "repayment":
                data.lent -= log.amount;
                data.withMe += log.amount;
                break;
        }
    });
}

function deleteLog(indexFromTop) {
    const reversed = [...data.logs].reverse();
    const toDelete = reversed[indexFromTop];

    data.logs = data.logs.filter((l) => l !== toDelete);

    recalculateTotals();
    updateUI();
}

function capitalize(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function manualUpdate(type) {
    const amt = prompt(`Enter new value for ${capitalize(type)}:`);
    if (!amt || isNaN(amt)) return;
    data[type] = parseFloat(amt);
    updateUI();
}

function resetAmount(type) {
    if (confirm(`Reset ${capitalize(type)} to 0?`)) {
        data[type] = 0;
        updateUI();
    }
}

function toggleTheme() {
    const current = document.body.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
}

function clearAllLogs() {
    if (confirm("Clear all logs?")) {
        data.logs = [];
        recalculateTotals();
        updateUI();
    }
}

function exportLogs() {
    let csv = "Type,Amount,Name,Date,Month\n";
    data.logs.forEach((l) => {
        csv += `${l.type},${l.amount},${l.name || ""},${l.date},${l.month}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "budget_logs.csv";
    a.click();
}

function importLogs(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        const lines = evt.target.result.split("\n").slice(1);

        lines.forEach((line) => {
            const [type, amount, name, date, month] = line.split(",");

            if (type && amount && date && month) {
                data.logs.push({
                    type: type.trim(),
                    amount: parseFloat(amount),
                    name: name?.trim() || "",
                    date: date.trim(),
                    month: month.trim()
                });
            }
        });

        recalculateTotals();
        updateUI();
    };

    reader.readAsText(file);
}

function filterLogs() {
    renderLogs();
}

function init() {
    const stored = localStorage.getItem("budgetData");
    if (stored) data = JSON.parse(stored);
    updateUI();
}

init();
