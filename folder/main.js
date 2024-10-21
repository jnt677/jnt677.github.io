function kirimPesan() {

    var nama = document.getElementById('nama');
    var email = document.getElementById('email');
    var options = document.getElementById('options');
    var pesan = document.getElementById('pesan');

    var gabungan = 'Nama%3A%0A' + nama.value + '%0AEmail%3A%0A' + email.value + '%0AOptions%3A%0A' + options.value;+ '%0APesan%3A%0A' + pesan.value;

    var token = '7735969787:AAF_HqQQBI88oTL7PEWMKHGPU8XA6t3zY2s'; // Ganti dengan token bot yang kamu buat
    var grup = '6731968814'; // Ganti dengan chat id dari bot yang kamu buat

    $.ajax({
        url: `https://api.telegram.org/bot${token}/sendMessage?chat_id=${grup}&text=${gabungan}&parse_mode=html`,
        method: `POST`,
    })
}
