<?php
session_start();
include "myconn.php";

$sessionID = session_id();
$rows = [];

if (!isset($_FILES['file'])) {
    echo "no file uploaded";
    exit;
};

// Read CSV file
$file = fopen($_FILES['file']['tmp_name'],'r');
while (($data = fgetcsv($file)) !== false) {
    $rows[] = $data;
}
fclose($file);

$sessionID = mysqli_real_escape_string($resourceId, $sessionID);
$json = mysqli_real_escape_string($resourceId, json_encode($rows));
$actions = mysqli_real_escape_string($resourceId, json_encode([]));

mysqli_query($resourceId,"DELETE FROM datasets WHERE session_id='$sessionID';") or die(mysqli_error($resourceId));

mysqli_query($resourceId, "INSERT INTO datasets (session_id, raw_data, actions) VALUES ('$sessionID', '$json', '$actions');") or die(mysqli_error($resourceId));

echo "OK"
?>