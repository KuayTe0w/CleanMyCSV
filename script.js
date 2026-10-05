var rawData = [];
var cleanedData = [];
var actions = [];

var previewOffset = 1;

$(document).ready(function () {
    // On page load
    LoadDataset();

    // Upload CSV
    $("#upload-form").on("submit", function(e) {
        e.preventDefault();

        //let formData = new FormData($(this)[0]);
        let formData = new FormData(this);

        $.ajax({
            url: "import_dataset.php",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(status) {
                if (status == "OK") {
                    LoadDataset();
                }
                else(status)
            }
        })
    });

    // Page scrolling
    const previewWrapper = $("#preview-wrapper")

    $("#page-down").click(function() {
        if (previewOffset + 10 < cleanedData.length) {
            previewOffset += 10;
            RenderTable(cleanedData)
        }
    });
    $("#page-up").click(function() {
        previewOffset = Math.max(1, previewOffset - 10);
        RenderTable(cleanedData);
    });

    // Change option dropdown according to selected action
    $(document).on("change", ".action-select", function() {
        const action = $(this).val();
        const optionsDiv = $(this).closest(".action-row").find(".option-params");

        optionsDiv.empty();

        if (action == "remove-value") {
        optionsDiv.append(`
                <select class="option-select">
                    <option value="empty">Select option</option>
                    <option value="empty">Remove empty values</option>
                    <option value="value">Remove specific value</option>
                </select>
                <input type="text" class="remove-value" placeholder="Value to remove">
            `);
        }
        if (action == "fill-value") {
            optionsDiv.append(`
                <select class="option-select">
                    <option value="empty">Select option</option>
                    <option value="mean">Mean</option>
                    <option value="median">Median</option>
                    <option value="mode">Mode</option>
                </select>
            `);
        }
    });

    // Show input value field according to selected option
    $(document).on("change", ".option-select", function() {
        const option = $(this).val();
        const input = $(this).closest(".option-params").find(".remove-value");

        if (option == "value") {
            input.show();
        }
        else {
            input.hide().val("");
        }
    });

    // Add Action button
    $("#add-action").click(function() {
        let newRow = $(".action-row:first").clone(true);

        newRow.find("select").val("");
        newRow.find(".action-params").empty();

        $("#actions-container").append(newRow);
    });

    // Refresh button
    $("#refresh-preview").click(function() {
        actions = CollectActions();
        ApplyCleaning();
        RenderTable(cleanedData);

        $.ajax({
            url: "save_actions.php",
            type: "POST",
            data: { actions: JSON.stringify(actions) },
            success: function(status) {
                if (status == "OK") { console.log("save action: success"); }
                else { console.log("save action: fail"); }
            }
        })
    });

    // Remove Action button
    $(document).on("click", ".remove-button", function() {
        $(this).closest(".action-row").remove();
    });

    // Export cleaned data
    // (does not actually make file available for download, only update database with cleaned dataset)
    $("#export-button").click(function() {
        actions = CollectActions();
        ApplyCleaning();

        $.ajax({
            url: "save_dataset.php",
            type: "POST",
            data: { json: JSON.stringify(cleanedData) },
            success: function(status) {
                if (status == "OK") { console.log("export: sucess"); }
                else { console.log("export: fail"); }
            }
        })

        alert("File available for download")
    });

    // Reset Session button
    $("#reset-session").click(function() {
        $.ajax({
            url: "reset_session.php",
            type: "POST",
            dataType: "json",
            success: function(status) {
                if (status == "OK") { 
                    console.log("session reset: success");
                    location.reload();
                }
                else { console.log("session reset: fail"); }
            },
        });
    });
});

function LoadDataset() {
    $.getJSON("load_dataset.php", function(key) {
        rawData = key.rawData || [];
        actions = key.actions || [];
        cleanedData = JSON.parse(JSON.stringify(rawData));

        PopulateColumns();
        //RestoreActions(); BROKEN
        RenderTable(cleanedData);
    })
}

function PopulateColumns() {
    const select = $(".action-row:first .column-select");

    select.empty();
    select.append(`<option value="">Select column</option>`);

    rawData[0].forEach((columnName, index) => {
        select.append(`<option value="${index}">${columnName}</option>`);
    });
};

function RenderTable(data) {
    const table = $('#preview-table');
    let header = "";
    let row = "";

    table.empty();

    header = '<tr>';
    data[0].forEach(col => {
        header += `<th>${col}</th>`
    });
    header += '</tr>';
    table.append(header);

    const start = previewOffset;
    const end = Math.min(start + 10, data.length);

    for (let i = start; i < end; i++) {
        row += "<tr>";
        data[i].forEach(cell => {
            row += `<td>${cell}</td>`;
        });
        row += "</tr>";
    };
    table.append(row);
};

//BROKEN
function RestoreActions() {
    if (!actions || actions.length == 0) {
        return;
    };

    $("#actions-container").empty();

    actions.forEach(step => {
        let row = $(".action-row:first").clone(true);

        row.find(".column-select").val(step.column);
        row.find(".action-select").val(step.action).trigger("change");
        row.find(".option-select").val(step.option).trigger("change");

        if(row.find(".option-select").val() == "value") {
            row.find(".remove-value").val(step.value);
        }

        $("#actions-container").append(row);
    });

    ApplyCleaning();
    RenderTable(cleanedData);
};

function CollectActions() {
    actions = [];

    $(".action-row").each(function(index) {
        let actionsObj = {
            order: index,
            column: $(this).find(".column-select").val(),
            action: $(this).find(".action-select").val(),
            option: $(this).find(".option-select").val(),
        };

        if (actionsObj.option == "value") {
            actionsObj.value = $(this).find(".remove-value").val();
        }

        actions.push(actionsObj);
    });
    return actions;
};

function ApplyCleaning() {
    cleanedData = JSON.parse(JSON.stringify(rawData));

    actions.forEach(step => {
        const col = parseInt(step.column);

        if (step.action == "remove-value") {
            const col = step.column;

            cleanedData = cleanedData.filter((row, index) => {
                if (index == 0) {
                    return true;
                };

                const cell = row[col];

                if (step.option == "empty") {
                    return cell != null && cell != undefined && cell != "";
                }
                if (step.option == "value") {
                    return cell != step.value;
                }

                return true;
            });
        }

        if (step.action == "fill-value") {
            const col = step.column;

            const values = cleanedData
                            .slice(1) //ignore 1st row
                            .map(row => parseFloat(row[col]))
                            .filter(v => !isNaN(v));
            
            if (values.length == 0) {return;}

            let fillVal;
            if (step.option == "mean") {fillVal = Mean(values);}
            if (step.option == "median") {fillVal = Median(values);}
            if (step.option == "mode") {fillVal = Mode(values);}

            cleanedData.forEach((row, index) => {
                if (index == 0) {return;}

                const cellValue = row[col];
                if (cellValue == "" || cellValue == null || cellValue == undefined || cellValue == "ERROR" || cellValue == "UNKNOWN") {row[col] = fillVal;}
            });
        }
        
        if (step.action == "remove-duplicates") {}
    });
};

function Mean(array) {
    let mean = array.reduce((total, current) => total + current, 0) / array.length;
    return Math.round(mean * 100) / 100;
};
function Median(array) {
    let sorted = array.sort((a, b) => {return a - b;});
    let middle = Math.floor(sorted.length / 2);

    if ((sorted.length % 2) != 0) {
        // if index is odd, return the average of the two values
        return (sorted[middle] + sorted[middle + 1]) / 2;
    }
    else {
        return sorted[middle];
    }
};
function Mode(array) {
    let freq = {};
    let maxCount = 0;
    let mode = null;

    array.forEach(i => {
        if (freq[i] == undefined) {
            freq[i] = 1;
        }
        else {
            freq[i] += 1;
        }
    });

    for (let key in freq) {
        if (freq[key] > maxCount) {
            maxCount = freq[key];
            mode = Number(key);
        }
    }

    return mode;
};