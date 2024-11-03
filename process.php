<?php
// Ganti dengan API Key dan Merchant ID Anda
$apiKey = 'YOUR_API_KEY';
$merchantId = 'YOUR_MERCHANT_ID';

// Ambil data dari form
$nama = $_POST['nama'];
$email = $_POST['email'];
$orderId = $_POST['order_id'];
$amount = $_POST['amount'];

// Data yang akan dikirim ke API TokoPay
$data = [
    'merchant_id' => $merchantId,
    'ref_id' => $orderId,
    'nominal' => $amount,
    // ... parameter lainnya sesuai dokumentasi TokoPay
];

// Buat request ke API TokoPay
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.tokopay.co/v1/order',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$responseData = json_decode($response, true);

// Ekstrak pay_url dari respons
$payUrl = $responseData['data']['pay_url'];

// Redirect pengguna ke halaman pembayaran
header("Location: $payUrl");
