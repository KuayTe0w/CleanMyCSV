<?php
session_start();
include "myconn.php";

$sessionID = session_id();

$query = mysqli_query($resourceId, "SELECT raw_data, actions FROM datasets WHERE session_id='$sessionID';");

$row = mysqli_fetch_array($query);

echo json_encode([
    "rawData" => json_decode($row['raw_data']),
    "actions" => json_decode($row['actions'])
])
?>