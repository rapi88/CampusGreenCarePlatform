# CampusGreenCarePlatform
A sustainability-focused mobile platform for digital tracking, adoption, and GPS-verified maintenance of campus trees.

## Frontend development

This app uses a custom Expo development build because it includes native modules
such as Mapbox. Expo Go cannot run it.

Install the development build once on your target device/simulator:

```bash
make front-ios
# or
make front-android
```

The iOS command targets the `iPhone 17` simulator by default through Expo's
`--device` option. If your available simulator has a different name, update the
`ios` and `ios:dev-build` scripts in `app/package.json`.

For Android simulator development, start the local emulator first:

```bash
make front-android-emulator
```

When the emulator is open and visible in ADB, install the Android development
build:

```bash
make front-android
```

After the development build is installed, start Metro with:

```bash
make front
```

Run `make front-ios` or `make front-android` again whenever native dependencies,
Expo plugins, bundle identifiers, or native app config change.

## Yapay zekâ bitki asistanı

Asistan, giriş yapan kullanıcının aktif sahiplendiği ağaç türlerini ve puanını
backend üzerinden okuyup Gemini yanıtına yalnızca ilgili bağlam olarak ekler.
“Yakınımdaki hangi ağacı sahiplenebilirim?” gibi sorularda uygulama konum izni
ister; backend aktif ağaçları, boş gönüllü kontenjanını ve kullanıcının sahiplenme
limitini kontrol ederek en yakın beş ağacı hesaplar. Konum yalnızca bu sorguda
kullanılır, veritabanına kaydedilmez. “Yurt Alanı yakınında hangi ağaç var?”
gibi sabit kampüs konumu belirten sorular ağaç kayıtlarındaki konum açıklamalarıyla
eşleştirilir ve cihaz konumu izni istemez. Tekil “en yakın ağaç” sorusu bir sonuç,
çoğul “en yakınımdaki ağaçlar” sorusu ise en fazla beş sonuç döndürür. Sohbet
geçmişi de şu an saklanmaz. “Sahiplenebileceğim tüm ağaçları listele” isteği,
kullanıcının sahiplenme limitini ve her ağacın boş kontenjanını kontrol ederek
uygun ağaçları doğrudan veritabanından listeler. “Hangi ağaçlar sahipli?”
sorusu da okul genelinde en az bir gönüllüsü olan aktif ağaçları ve gönüllü
kontenjanlarını gösterir; sahiplenen kişilerin kimlikleri paylaşılmaz. “Doğal
anıt olarak işaretlenmiş ağaç var mı?” sorusu kayıtlı ağaçların doğal anıt
işaretini veritabanından kontrol eder. Kullanıcı
başına ağaç sahiplenme sınırı 10'dur; ağaç başına gönüllü kapasitesi kayıttaki
değere göre belirlenir ve varsayılanı 4'tür. Asistan bu iki sınırla ilgili
soruları doğrudan uygulama kurallarından ve aktif ağaç kayıtlarından yanıtlar.
“Benim adım ne?” ve “bu hesap kime ait?” gibi sorular oturum açmış kullanıcının
profil adını kullanarak yanıtlanır; e-posta gibi ek hesap bilgileri paylaşılmaz.
“Puanım kaç?” sorusu oturumdaki güncel puanını gösterir. Puan kazanmak için,
gönüllüsü olduğun ağacın yanında uygulamadan sulama kaydı göndermen gerekir;
konumu doğrulanan her başarılı sulama 10 puan kazandırır.

Gemini anahtarı mobil uygulamaya değil `server/.env` dosyasına
`GEMINI_API_KEY` olarak eklenmelidir. Veritabanı bağlantısı aynı dosyadaki
`DATABASE_URL` ile yapılandırılır. Ardından backend'i başlatın:

```powershell
cd server
npm install
npm run dev
```

Kullanıcının mevcut konumuna göre arama yaparken uygulamanın konum iznini kabul
edin. Sabit kampüs konumları için izin gerekmez.

## CMS Web Yönetim Portalı

Yöneticilerin ağaçları, öğrenci önerilerini, gönüllüleri ve sulama raporlarını web üzerinden yönetebileceği modern React + Vite yönetim paneli:

```bash
make cms
# veya
npm run cms
```

Tarayıcınızda **http://localhost:5173** adresini açarak:
- **Yönetici Girişi:** `admin@gtu.edu.tr` / `Admin123!`
- **Özellikler:** Ağaç CRUD & fotoğraf yükleme, öğrenci önerilerini onaylama/reddetme, gönüllü puan takibi, CSV sulama raporu ve interaktif GTÜ kampüs haritası.

