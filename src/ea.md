Bertindaklah sebagai Senior MQL4/MQL5 Developer dan Expert Algorithmic Trader.

Saya ingin Anda membuatkan kode program Expert Advisor (EA) untuk MetaTrader 4 (MT4) menggunakan bahasa pemrograman MQL4.

EA ini menggunakan konsep Aggressive Layering / Compounding, yaitu menambah posisi searah hanya ketika posisi sebelumnya sedang running profit. Strategi ini bukan martingale, karena EA tidak boleh menambah posisi saat floating minus.

Tujuan utama EA:
- Entry otomatis berdasarkan sinyal RSI.
- Open posisi BUY atau SELL dengan lot kecil.
- Setiap posisi wajib memiliki Take Profit dan Stop Loss.
- Jika posisi profit dan harga bergerak sesuai arah entry, EA boleh menambah layer baru.
- EA harus cocok untuk akun kecil dengan manajemen risiko ketat.

==================================================
1. PARAMETER INPUT
==================================================

Buat parameter input yang bisa diubah oleh pengguna:

- InitialLot = 0.01
  Lot awal dan lot setiap layer. Default wajib 0.01.

- MaxLayers = 5
  Maksimal jumlah posisi terbuka secara bersamaan.

- PipStep = 100
  Jarak minimal dalam points untuk membuka layer berikutnya.

- TakeProfitPips = 100
  Jarak Take Profit dalam points.

  Contoh logika:
  Jika BUY di harga 400.000, maka TP di 401.000.
  Jika SELL di harga 400.000, maka TP di 399.000.

- StopLossPips = 400
  Jarak Stop Loss dalam points.

- MagicNumber = 20260710
  Magic number khusus untuk membedakan order EA ini.

- UseTrailingStop = true
  Aktif/nonaktif trailing stop.

- TrailingStart = 150
  Trailing stop mulai aktif jika profit sudah mencapai 150 points.

- TrailingStep = 50
  Jarak trailing stop mengikuti harga.

- MaxSpread = 50
  EA tidak boleh entry jika spread lebih besar dari batas ini.

- AllowBuy = true
  Izinkan entry BUY.

- AllowSell = true
  Izinkan entry SELL.

==================================================
2. LOGIKA ENTRY UTAMA
==================================================

Gunakan indikator bawaan RSI pada timeframe M15 dengan periode 14.

Kondisi BUY:
- Jika RSI berada di bawah level 30 atau menembus area oversold.
- Jika AllowBuy = true.
- Jika belum ada posisi aktif dari MagicNumber yang sama.
- Maka buka posisi BUY pertama dengan lot 0.01.

Kondisi SELL:
- Jika RSI berada di atas level 70 atau menembus area overbought.
- Jika AllowSell = true.
- Jika belum ada posisi aktif dari MagicNumber yang sama.
- Maka buka posisi SELL pertama dengan lot 0.01.

Setiap posisi yang dibuka wajib langsung memiliki:
- Stop Loss
- Take Profit
- Magic Number
- Comment order yang jelas

==================================================
3. LOGIKA TAKE PROFIT
==================================================

EA wajib memasang Take Profit otomatis berdasarkan arah entry.

Untuk posisi BUY:
- Take Profit = Harga Open + TakeProfitPips.
- Contoh:
  BUY di 400.000
  TakeProfitPips setara 1.000 poin harga
  Maka TP di 401.000.

Untuk posisi SELL:
- Take Profit = Harga Open - TakeProfitPips.
- Contoh:
  SELL di 400.000
  TakeProfitPips setara 1.000 poin harga
  Maka TP di 399.000.

Pastikan perhitungan menggunakan Point / Digits yang sesuai dengan broker agar bisa berjalan di berbagai simbol, termasuk XAUUSD.

==================================================
4. LOGIKA STOP LOSS
==================================================

EA wajib memasang Stop Loss otomatis berdasarkan arah entry.

Untuk posisi BUY:
- Stop Loss = Harga Open - StopLossPips.

Untuk posisi SELL:
- Stop Loss = Harga Open + StopLossPips.

EA tidak boleh membuka posisi tanpa Stop Loss.

==================================================
5. LOGIKA LAYERING / COMPOUNDING
==================================================

EA hanya boleh menambah posisi baru jika posisi terakhir sedang profit.

Aturan penting:
- Jangan pernah menambah posisi jika posisi terakhir masih floating minus.
- Jangan pernah menggunakan martingale.
- Lot setiap layer tetap 0.01.
- Total posisi aktif tidak boleh melebihi MaxLayers.
- Layer harus searah dengan posisi awal.

Kondisi tambah layer BUY:
- Posisi terakhir adalah BUY.
- Posisi terakhir sedang profit.
- Harga Ask saat ini sudah naik minimal PipStep dari harga open posisi BUY terakhir.
- Total posisi BUY aktif masih di bawah MaxLayers.
- Maka buka posisi BUY baru dengan lot 0.01.

Contoh:
- BUY pertama di 400.000.
- Jika harga naik ke 401.000 dan posisi pertama profit, EA boleh membuka BUY layer berikutnya.
- Layer baru juga memiliki TP dan SL masing-masing.

Kondisi tambah layer SELL:
- Posisi terakhir adalah SELL.
- Posisi terakhir sedang profit.
- Harga Bid saat ini sudah turun minimal PipStep dari harga open posisi SELL terakhir.
- Total posisi SELL aktif masih di bawah MaxLayers.
- Maka buka posisi SELL baru dengan lot 0.01.

Contoh:
- SELL pertama di 400.000.
- Jika harga turun ke 399.000 dan posisi pertama profit, EA boleh membuka SELL layer berikutnya.
- Layer baru juga memiliki TP dan SL masing-masing.

==================================================
6. LOGIKA TRAILING STOP
==================================================

Jika UseTrailingStop = true, EA harus menjalankan trailing stop otomatis.

Untuk posisi BUY:
- Jika profit sudah lebih besar dari TrailingStart, geser Stop Loss ke atas mengikuti harga.
- Stop Loss baru = Bid - TrailingStep.
- Stop Loss hanya boleh digeser jika lebih baik dari Stop Loss sebelumnya.

Untuk posisi SELL:
- Jika profit sudah lebih besar dari TrailingStart, geser Stop Loss ke bawah mengikuti harga.
- Stop Loss baru = Ask + TrailingStep.
- Stop Loss hanya boleh digeser jika lebih baik dari Stop Loss sebelumnya.

Trailing stop bertujuan untuk mengunci profit, bukan memperbesar risiko.

==================================================
7. FILTER KEAMANAN
==================================================

Tambahkan filter keamanan berikut:

- EA tidak boleh entry jika spread lebih besar dari MaxSpread.
- EA tidak boleh membuka order jika trading tidak diizinkan.
- EA hanya mengelola order dengan MagicNumber yang sama.
- EA tidak boleh membuka BUY dan SELL bersamaan.
- EA tidak boleh membuka posisi baru jika jumlah layer sudah mencapai MaxLayers.
- EA harus mengecek hasil OrderSend.
- Jika OrderSend gagal, tampilkan pesan error menggunakan GetLastError().
- Gunakan RefreshRates() sebelum membuka order.
- Gunakan NormalizeDouble() untuk harga SL dan TP.

==================================================
8. STRUKTUR FUNGSI KODE
==================================================

Buat kode yang clean, rapi, dan mudah dipahami.

Gunakan #property strict.

Pisahkan logika ke dalam fungsi-fungsi berikut:

- CountPositions()
  Untuk menghitung jumlah posisi aktif berdasarkan symbol dan MagicNumber.

- CountBuyPositions()
  Untuk menghitung jumlah posisi BUY aktif.

- CountSellPositions()
  Untuk menghitung jumlah posisi SELL aktif.

- GetLastPositionType()
  Untuk mengetahui tipe posisi terakhir, BUY atau SELL.

- GetLastOpenPrice()
  Untuk mengambil harga open posisi terakhir.

- GetLastPositionProfit()
  Untuk mengecek apakah posisi terakhir sedang profit.

- CheckEntrySignal()
  Untuk membaca sinyal RSI dan membuka posisi pertama.

- CheckAndAddLayer()
  Untuk mengecek apakah EA boleh menambah layer baru saat profit.

- OpenBuy()
  Untuk membuka order BUY lengkap dengan SL dan TP.

- OpenSell()
  Untuk membuka order SELL lengkap dengan SL dan TP.

- ApplyTrailingStop()
  Untuk menjalankan trailing stop.

- IsSpreadAllowed()
  Untuk mengecek apakah spread masih aman.

==================================================
9. STANDAR KODE
==================================================

Wajib:
- Gunakan bahasa MQL4.
- Gunakan #property strict.
- Kode harus utuh dan siap compile di MetaEditor MT4.
- Tidak boleh ada bagian kode yang terpotong.
- Berikan komentar singkat pada bagian penting.
- Gunakan OrderSend dengan pengecekan return value.
- Gunakan OrderModify untuk trailing stop.
- Gunakan OrderSelect dengan benar.
- Gunakan MagicNumber agar EA tidak mengganggu posisi manual.
- Pastikan EA bisa berjalan di XAUUSD atau pair forex lain.

==================================================
10. OUTPUT YANG SAYA INGINKAN
==================================================

Berikan:

1. Kode EA MQL4 lengkap dari awal sampai akhir.
2. Penjelasan singkat cara kerja EA.
3. Penjelasan parameter input.
4. Catatan risiko penggunaan EA layering.
5. Saran setting awal untuk akun kecil:
   - InitialLot: 0.01
   - MaxLayers: 1 sampai 3 dulu
   - TakeProfitPips: kecil
   - StopLossPips: wajib aktif
   - UseTrailingStop: true
   - MaxSpread: aktif

Jangan menjanjikan profit. Fokus pada kode yang aman, rapi, dan siap diuji di akun demo terlebih dahulu.
