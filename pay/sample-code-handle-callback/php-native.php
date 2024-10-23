<?php
/*
 * Tokopay mengirim callback menggunakan method POST dengan data di letakan di BODY request
 */
$merchant_id = "YOUR_MERCHANT_ID";
$secret_key = "YOUR_SECRET_ID";
$json = file_get_contents('php://input');
$data = json_decode($json,true);
$simpan_file = file_put_contents("callback-tokopay.txt",$json); //simpan ke file json nya
//echo $json;
if (isset($data['status'],$data['reff_id'],$data['signature'])){
    $status = $data['status'];
    if ($status==="Success") {
        //hanya proses yg status transaksi sudah di bayar, sukses = dibayar
        $ref_id = $data['reff_id'];
        /*
         * Validasi Signature
         */
        $signature_from_tokopay = $data['signature'];
        $signature_validasi = md5("$merchant_id:$secret_key:$ref_id");
        if ($signature_from_tokopay === $signature_validasi) {
            /*
             * Silahkan lakukan action di website kamu, misal memproses orderan, deposit, dll
             * gunakan $ref_id sebagai data referensi di database web kamu
             * data ref_id ini merupakan data yang kamu kirimkan di saat create order
             */
            echo json_encode(['status'=>true]);
        }else{
            echo json_encode(['error'=>"Invalid Signature"]);
        }
    }else{
        echo json_encode(['error'=>"Status payment tidak success"]);
    }
}else{
    echo json_encode(['error'=>"Data json tidak sesuai"]);
}
