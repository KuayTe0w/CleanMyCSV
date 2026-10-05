<?php
session_start();
include "myconn.php";

$_SESSION = [];
session_destroy();

session_start();
session_regenerate_id(true);

echo "OK";
exit;
