<?php
require_once 'HTTP/Request2.php';
$request = new HTTP_Request2();
$request->setUrl('https://api.tokopay.id/v1/order?merchant_id=M240509URZTI530');
$request->setMethod(HTTP_Request2::METHOD_POST);
$request->setConfig(array(
  'follow_redirects' => TRUE
));
$request->setHeader(array(
  'Content-Type' => 'application/x-www-form-urlencoded'
));
$request->addPostParameter(array(
  'merchant_id' => 'M240509URZTI530',
  'kode_channel' => 'BRIVA',
  'reff_id' => '545t',
  'amount' => '12450',
  'customer_name' => 'menre',
  'customer_email' => '',
  'customer_phone' => '',
  'redirect_url' => 'pay_url',
  'expired_ts' => '0',
  'signature' => '',
  'items' => ''
));
try {
  $response = $request->send();
  if ($response->getStatus() == 200) {
    echo $response->getBody();
  }
  else {
    echo 'Unexpected HTTP status: ' . $response->getStatus() . ' ' .
    $response->getReasonPhrase();
  }
}
catch(HTTP_Request2_Exception $e) {
  echo 'Error: ' . $e->getMessage();
}
