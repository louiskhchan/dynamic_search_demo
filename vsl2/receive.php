<?php
$post_data = file_get_contents('php://input');
$json = json_decode($post_data, true);
$responses = $json['responses'];
$summary = $json['summary'];

//save responses table
if (count($responses)){
    $fn = "data/" . implode("_",array($json['expt'],$json['datetimestr'],$json['id'],"responses.csv"));

    $fp = fopen($fn, 'w');
    fputcsv($fp, array_keys($responses[0]));
    foreach($responses as $trial){
        fputcsv($fp, $trial);
    }
    fclose($fp);
}

//save summary
$dvs = array("results");
foreach ($dvs as $dv) {
    $fn = "data/".implode("_",array($json['expt'],$dv)).".csv";
    $firsttime=!file_exists($fn);
    $fp = fopen($fn, 'a');
    if ($firsttime){
        fputcsv($fp, array_keys($summary[$dv]));
    }
    fputcsv($fp, $summary[$dv]);
    fclose($fp);
}


