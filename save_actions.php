<?php
session_start();
include "myconn.php";

$sessionID = mysqli_real_escape_string($resourceId, session_id());
$actions = mysqli_real_escape_string($resourceId, $_POST["actions"]);

mysqli_query($resourceId,"UPDATE datasets SET actions='$actions' WHERE session_id='$sessionID';") or die(mysqli_error($resourceId));

echo "OK";
?>