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

