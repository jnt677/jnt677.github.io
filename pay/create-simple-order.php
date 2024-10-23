<?php
require 'tokopay.lib.php';
/*
merchant id dan secret_key bisa di temukan di link ini :
https://dash.tokopay.id/pengaturan/secret-key
*/
$merchant_id = "M240509URZTI530"; //put your merchant id here
$secret_key = "5bc43dda41b1893283f01d3e2c5ba567076fbe7ac80840576a701fdc9dfa23ca"; //put your secret key here
$tokopay = New Tokopay($merchant_id,$secret_key);

/*
 * Create Order
 * Ref ID wajib unik, jika kamu memasukan ref id yg sudah pernah kamu gunakan
 * maka tokopay akan mengembalikan response dari order yang sudah pernah di generate
 * Value Ref id ini nantinya akan di kembalikan tokopay di webhook/callback url kamu
 */
$ref_id = "YOUR_REFERENCE_ID"; //put your referece id here
$channel = "QRIS"; //list channel bisa di cek di https://docs.tokopay.id/persiapan-awal/metode-pembayaran atau https://dash.tokopay.id/metode-pembayaran
$create_order = $tokopay->createOrder(25000,$ref_id,$channel);
echo $create_order.PHP_EOL;
$detail_order = json_decode($create_order, true);
if (isset($detail_order['data'])) {
    echo "<hr>Pay URL : " . $detail_order['data']['pay_url'];
    if (isset($detail_order['data']['nomor_va'])) {
        echo "<hr> Kode Pembayaran : " . $detail_order['data']['nomor_va'];
    } else if (isset($detail_order['data']['qr_link'])) {
        echo "<hr> QRIS Image : " . $detail_order['data']['qr_link'];
    } else if (isset($detail_order['data']['checkout_url'])) {
        echo "<hr> Checkout URL : " . $detail_order['data']['checkout_url'];
    }
}else{
    echo "Gagal Create ORDER!!";
}


/*
 * Setiap Kategori channel memilik response key yg berbeda-beda
 * contoh kategori Virtual Akun, dan Retail akan mengembalikan value tambahan yakni "nomor_va"
 * contoh lagi kategori QRIS akan mengembalikan value tambahan yakni "qr_link" dan "qr_string"
 * contoh lagi kategori E-Wallet dan pulsa akan mengembalikan value tambahan yakni "checkout_url"
 * Detail dari response api https://docs.tokopay.id/order/create-order-simple
 */
