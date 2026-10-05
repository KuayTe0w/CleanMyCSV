<?php
session_start();
include "myconn.php";

$sessionID = mysqli_real_escape_string($resourceId, session_id());
$json = mysqli_real_escape_string($resourceId, $_POST["json"]);

mysqli_query($resourceId,"UPDATE datasets SET raw_data='$json' WHERE session_id='$sessionID'") or die(mysqli_error($resourceId));

echo "OK";
?>