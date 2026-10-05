<?php
$server_name = "localhost";
$username = "root";
$password = "";
$database_name = "cleanmycsv";

$resourceId = mysqli_connect($server_name, $username, $password, $database_name)
    or die("Cannot connect to server: " . mysqli_connect_error());
?>