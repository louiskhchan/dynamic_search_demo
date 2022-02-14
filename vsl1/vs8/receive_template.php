<?php
$post_data = json_decode(file_get_contents('php://input'), true);

$name = "data/" . $post_data['filename'] . ".csv";
$data = $post_data['filedata'];

$fp = fopen($name, 'w');
fputcsv($fp, array_keys($data));

fputcsv($fp, $data);
fclose($fp);

echo "Upload successful.";

?>
