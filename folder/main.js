function kirimPesan() {

    var nama = document.getElementById('nama');
    var select = document.getElementById('select');

    var gabungan = '%0ANama%3A%0A' + nama.value + '%0ASelect%3A%0A' + select.value;

    var token = '7735969787:AAF_HqQQBI88oTL7PEWMKHGPU8XA6t3zY2s'; // Ganti dengan token bot yang kamu buat
    var grup = '6731968814'; // Ganti dengan chat id dari bot yang kamu buat

    $.ajax({
        url: `https://api.telegram.org/bot${token}/sendMessage?chat_id=${grup}&text=${gabungan}&parse_mode=html`,
        method: `POST`,
    })
}
