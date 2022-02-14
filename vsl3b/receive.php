<?php
$post_data = file_get_contents('php://input');
$json = json_decode($post_data, true);
$responses = $json['responses'];
$summary = $json['summary'];

//save responses table
if (count($responses)){
    $fn = "data/" . implode("_",array($json['exptcode'],$json['datetimestr'],$json['id'],"responses.csv"));

    $fp = fopen($fn, 'w');
    fputcsv($fp, array_keys($responses[0]));
    foreach($responses as $trial){
        fputcsv($fp, $trial);
    }
    fclose($fp);
}

//save summary
$summary_files = array_keys($summary);
foreach ($summary_files as $summary_file) {
    $fn = "data/".implode("_",array($json['exptcode'],$summary_file)).".csv";
    $firsttime=!file_exists($fn);
    $fp = fopen($fn, 'a');
    if ($firsttime){
        fputcsv($fp, array_keys($summary[$summary_file]));
    }
    fputcsv($fp, $summary[$summary_file]);
    fclose($fp);
}


