Bertindaklah sebagai Senior MQL4/MQL5 Developer dan Expert Algorithmic Trader.

Saya ingin Anda membuatkan kode program Expert Advisor (EA) untuk MetaTrader 4 (MT4) menggunakan bahasa pemrograman MQL4.

EA ini menggunakan konsep Scalping Cepat dengan Multi-Indikator Konfirmasi. Strategi scalping ini fokus pada entry dan exit cepat di timeframe rendah, mengambil profit kecil tapi sering, dengan manajemen risiko yang sangat ketat. EA ini BUKAN martingale dan BUKAN grid — setiap posisi berdiri sendiri dengan SL dan TP yang jelas.

Tujuan utama EA:
- Entry otomatis berdasarkan konfirmasi multi-indikator (EMA Crossover + RSI + Stochastic).
- Open posisi BUY atau SELL dengan lot kecil dan target profit pendek.
- Setiap posisi wajib memiliki Take Profit dan Stop Loss yang ketat.
- EA harus sangat cepat dalam membuka dan menutup posisi.
- EA harus cocok untuk akun kecil dengan manajemen risiko ultra-ketat.
- EA hanya membuka SATU posisi aktif pada satu waktu (no layering, pure scalping).

==================================================
1. PARAMETER INPUT
==================================================

Buat parameter input yang bisa diubah oleh pengguna:

- LotSize = 0.01
  Lot untuk setiap posisi scalping. Default wajib 0.01.

- TakeProfitPips = 50
  Jarak Take Profit dalam points. Target kecil untuk scalping cepat.

  Contoh logika:
  Jika BUY di harga 400.000, maka TP di 400.500.
  Jika SELL di harga 400.000, maka TP di 399.500.

- StopLossPips = 100
  Jarak Stop Loss dalam points. SL ketat untuk membatasi kerugian.

  Contoh logika:
  Jika BUY di harga 400.000, maka SL di 399.000.
  Jika SELL di harga 400.000, maka SL di 401.000.

- MagicNumber = 20260711
  Magic number khusus untuk membedakan order EA scalping ini dari EA lain.

- EMA_Fast_Period = 5
  Periode EMA cepat untuk crossover signal.

- EMA_Slow_Period = 20
  Periode EMA lambat untuk crossover signal.

- RSI_Period = 14
  Periode RSI untuk filter momentum.

- RSI_BuyLevel = 40
  Entry BUY diizinkan jika RSI di atas level ini (menunjukkan momentum bullish yang cukup).

- RSI_SellLevel = 60
  Entry SELL diizinkan jika RSI di bawah level ini (menunjukkan momentum bearish yang cukup).

- Stochastic_KPeriod = 5
  Periode %K Stochastic Oscillator.

- Stochastic_DPeriod = 3
  Periode %D Stochastic Oscillator.

- Stochastic_Slowing = 3
  Slowing untuk Stochastic Oscillator.

- Stochastic_BuyLevel = 30
  Entry BUY diizinkan jika Stochastic %K di bawah level ini (oversold area, potensi reversal naik).

- Stochastic_SellLevel = 70
  Entry SELL diizinkan jika Stochastic %K di atas level ini (overbought area, potensi reversal turun).

- UseTrailingStop = true
  Aktif/nonaktif trailing stop.

- TrailingStart = 30
  Trailing stop mulai aktif jika profit sudah mencapai 30 points.

- TrailingStep = 20
  Jarak trailing stop mengikuti harga.

- UseBreakEven = true
  Aktif/nonaktif fitur break-even (pindahkan SL ke entry price setelah profit tertentu).

- BreakEvenTrigger = 30
  Break-even aktif jika profit sudah mencapai 30 points.

- BreakEvenOffset = 5
  SL dipindahkan ke entry price + offset ini (agar masih sedikit profit jika terkena SL).

- MaxSpread = 30
  EA tidak boleh entry jika spread lebih besar dari batas ini. Scalping sangat sensitif terhadap spread.

- MaxSlippage = 10
  Maksimal slippage yang diizinkan saat membuka order.

- AllowBuy = true
  Izinkan entry BUY.

- AllowSell = true
  Izinkan entry SELL.

- TradingStartHour = 8
  Jam mulai trading (waktu server). Scalping optimal pada jam market aktif.

- TradingEndHour = 20
  Jam akhir trading (waktu server). Hindari scalping di jam market sepi.

- CooldownSeconds = 60
  Waktu tunggu minimum (dalam detik) setelah posisi ditutup sebelum membuka posisi baru.
  Mencegah over-trading dan entry impulsif setelah loss.

==================================================
2. LOGIKA ENTRY UTAMA (MULTI-INDIKATOR KONFIRMASI)
==================================================

EA menggunakan kombinasi 3 indikator bawaan MT4 pada timeframe M5 untuk konfirmasi entry.
Semua indikator harus memberikan sinyal searah sebelum EA membuka posisi.

--- INDIKATOR 1: EMA CROSSOVER ---

Gunakan 2 Exponential Moving Average (EMA):
- EMA Cepat (periode EMA_Fast_Period, default 5)
- EMA Lambat (periode EMA_Slow_Period, default 20)

Sinyal BUY: EMA Cepat memotong EMA Lambat dari bawah ke atas (crossover bullish).
  - Candle sebelumnya (shift 2): EMA Cepat < EMA Lambat
  - Candle terakhir (shift 1): EMA Cepat >= EMA Lambat

Sinyal SELL: EMA Cepat memotong EMA Lambat dari atas ke bawah (crossover bearish).
  - Candle sebelumnya (shift 2): EMA Cepat > EMA Lambat
  - Candle terakhir (shift 1): EMA Cepat <= EMA Lambat

--- INDIKATOR 2: RSI FILTER ---

Gunakan RSI (periode RSI_Period, default 14) pada timeframe M5.

Konfirmasi BUY: RSI pada candle terakhir (shift 1) > RSI_BuyLevel (default 40).
  Artinya momentum sudah cukup bullish, bukan entry di kondisi lemah.

Konfirmasi SELL: RSI pada candle terakhir (shift 1) < RSI_SellLevel (default 60).
  Artinya momentum sudah cukup bearish, bukan entry di kondisi lemah.

--- INDIKATOR 3: STOCHASTIC FILTER ---

Gunakan Stochastic Oscillator (%K dan %D) pada timeframe M5.
- Periode K: Stochastic_KPeriod (default 5)
- Periode D: Stochastic_DPeriod (default 3)
- Slowing: Stochastic_Slowing (default 3)

Konfirmasi BUY: Stochastic %K pada candle terakhir (shift 1) < Stochastic_BuyLevel (default 30).
  Artinya harga sedang di area oversold, potensi reversal naik.

Konfirmasi SELL: Stochastic %K pada candle terakhir (shift 1) > Stochastic_SellLevel (default 70).
  Artinya harga sedang di area overbought, potensi reversal turun.

--- KONDISI ENTRY FINAL ---

Kondisi BUY (semua harus terpenuhi):
1. EMA Crossover bullish terdeteksi.
2. RSI > RSI_BuyLevel.
3. Stochastic %K < Stochastic_BuyLevel.
4. AllowBuy = true.
5. Tidak ada posisi aktif dari MagicNumber yang sama.
6. Spread <= MaxSpread.
7. Waktu server dalam rentang TradingStartHour - TradingEndHour.
8. Cooldown time sudah terpenuhi sejak posisi terakhir ditutup.
9. Maka buka posisi BUY dengan lot LotSize (0.01).

Kondisi SELL (semua harus terpenuhi):
1. EMA Crossover bearish terdeteksi.
2. RSI < RSI_SellLevel.
3. Stochastic %K > Stochastic_SellLevel.
4. AllowSell = true.
5. Tidak ada posisi aktif dari MagicNumber yang sama.
6. Spread <= MaxSpread.
7. Waktu server dalam rentang TradingStartHour - TradingEndHour.
8. Cooldown time sudah terpenuhi sejak posisi terakhir ditutup.
9. Maka buka posisi SELL dengan lot LotSize (0.01).

Setiap posisi yang dibuka wajib langsung memiliki:
- Stop Loss
- Take Profit
- Magic Number
- Comment order yang jelas (contoh: "Scalp_BUY_v1" atau "Scalp_SELL_v1")

==================================================
3. LOGIKA TAKE PROFIT
==================================================

EA wajib memasang Take Profit otomatis berdasarkan arah entry.

Untuk posisi BUY:
- Take Profit = Harga Open + TakeProfitPips * Point.
- Contoh:
  BUY di 400.000
  TakeProfitPips = 50
  Maka TP di 400.500.

Untuk posisi SELL:
- Take Profit = Harga Open - TakeProfitPips * Point.
- Contoh:
  SELL di 400.000
  TakeProfitPips = 50
  Maka TP di 399.500.

Pastikan perhitungan menggunakan Point / Digits yang sesuai dengan broker agar bisa berjalan di berbagai simbol, termasuk XAUUSD.

==================================================
4. LOGIKA STOP LOSS
==================================================

EA wajib memasang Stop Loss otomatis berdasarkan arah entry.

Untuk posisi BUY:
- Stop Loss = Harga Open - StopLossPips * Point.

Untuk posisi SELL:
- Stop Loss = Harga Open + StopLossPips * Point.

EA tidak boleh membuka posisi tanpa Stop Loss.
Ratio TP:SL default = 1:2 (TP 50 points, SL 100 points). 
Ini bisa disesuaikan oleh pengguna via parameter input.

==================================================
5. LOGIKA BREAK-EVEN
==================================================

Jika UseBreakEven = true, EA harus menjalankan fitur break-even otomatis.

Tujuan: Memindahkan Stop Loss ke harga entry (+ sedikit offset) setelah posisi 
sudah profit sejumlah tertentu. Ini mengunci posisi agar minimal tidak loss.

Untuk posisi BUY:
- Jika (Bid - OrderOpenPrice) >= BreakEvenTrigger * Point:
  - Pindahkan SL ke OrderOpenPrice + BreakEvenOffset * Point.
  - Hanya pindahkan jika SL saat ini belum di level break-even atau lebih baik.

Untuk posisi SELL:
- Jika (OrderOpenPrice - Ask) >= BreakEvenTrigger * Point:
  - Pindahkan SL ke OrderOpenPrice - BreakEvenOffset * Point.
  - Hanya pindahkan jika SL saat ini belum di level break-even atau lebih baik.

==================================================
6. LOGIKA TRAILING STOP
==================================================

Jika UseTrailingStop = true, EA harus menjalankan trailing stop otomatis.
Trailing stop berjalan SETELAH break-even sudah aktif (jika UseBreakEven juga true).

Untuk posisi BUY:
- Jika profit sudah lebih besar dari TrailingStart * Point, geser Stop Loss ke atas mengikuti harga.
- Stop Loss baru = Bid - TrailingStep * Point.
- Stop Loss hanya boleh digeser jika lebih baik (lebih tinggi) dari Stop Loss sebelumnya.

Untuk posisi SELL:
- Jika profit sudah lebih besar dari TrailingStart * Point, geser Stop Loss ke bawah mengikuti harga.
- Stop Loss baru = Ask + TrailingStep * Point.
- Stop Loss hanya boleh digeser jika lebih baik (lebih rendah) dari Stop Loss sebelumnya.

Trailing stop bertujuan untuk mengunci profit yang sudah berjalan, bukan memperbesar risiko.

==================================================
7. LOGIKA COOLDOWN (ANTI OVER-TRADING)
==================================================

Setelah posisi ditutup (baik karena TP, SL, trailing stop, atau break-even), EA harus menunggu 
selama CooldownSeconds detik sebelum membuka posisi baru.

Implementasi:
- Simpan waktu penutupan posisi terakhir di variabel global.
- Sebelum membuka posisi baru, cek:
  TimeCurrent() - LastCloseTime >= CooldownSeconds
- Jika belum cukup, jangan buka posisi baru.

Tujuan: Mencegah over-trading, terutama setelah loss yang bisa memicu revenge trading.

==================================================
8. FILTER KEAMANAN
==================================================

Tambahkan filter keamanan berikut:

- EA tidak boleh entry jika spread lebih besar dari MaxSpread.
  Scalping sangat sensitif terhadap spread, spread besar bisa menghapus profit.

- EA tidak boleh membuka order jika trading tidak diizinkan (IsTradeAllowed() == false).

- EA hanya mengelola order dengan MagicNumber yang sama.
  Tidak mengganggu posisi manual atau EA lain.

- EA hanya boleh memiliki SATU posisi aktif pada satu waktu.
  Ini adalah pure scalping, bukan layering atau grid.

- EA tidak boleh membuka BUY dan SELL bersamaan.

- EA harus mengecek hasil OrderSend.
  Jika OrderSend gagal, tampilkan pesan error menggunakan GetLastError().

- Gunakan RefreshRates() sebelum membuka order.

- Gunakan NormalizeDouble() untuk harga SL dan TP.

- EA tidak boleh trading di luar jam TradingStartHour - TradingEndHour.
  Scalping optimal saat volatilitas tinggi (London + New York session).

- EA harus mengecek minimum lot dan lot step dari broker.

- EA harus cek apakah SL dan TP memenuhi minimum stop level broker.

==================================================
9. STRUKTUR FUNGSI KODE
==================================================

Buat kode yang clean, rapi, dan mudah dipahami.

Gunakan #property strict.

Pisahkan logika ke dalam fungsi-fungsi berikut:

- CountActivePositions()
  Untuk menghitung jumlah posisi aktif berdasarkan symbol dan MagicNumber.

- HasActivePosition()
  Untuk mengecek apakah ada posisi aktif. Return true/false.

- CheckEMACrossover()
  Untuk mendeteksi EMA crossover bullish atau bearish.
  Return: 1 = bullish, -1 = bearish, 0 = tidak ada crossover.

- CheckRSIFilter(int direction)
  Untuk mengecek apakah RSI mengkonfirmasi arah entry.
  Return: true jika RSI cocok dengan arah, false jika tidak.

- CheckStochasticFilter(int direction)
  Untuk mengecek apakah Stochastic mengkonfirmasi arah entry.
  Return: true jika Stochastic cocok dengan arah, false jika tidak.

- CheckEntrySignal()
  Untuk menggabungkan semua sinyal indikator dan memutuskan entry.
  Memanggil CheckEMACrossover(), CheckRSIFilter(), CheckStochasticFilter().

- OpenBuy()
  Untuk membuka order BUY lengkap dengan SL, TP, MagicNumber, dan Comment.

- OpenSell()
  Untuk membuka order SELL lengkap dengan SL, TP, MagicNumber, dan Comment.

- ApplyBreakEven()
  Untuk menjalankan logika break-even pada posisi aktif.

- ApplyTrailingStop()
  Untuk menjalankan trailing stop pada posisi aktif.

- IsSpreadAllowed()
  Untuk mengecek apakah spread saat ini masih dalam batas aman.
  Return: true jika spread <= MaxSpread.

- IsTradingHour()
  Untuk mengecek apakah waktu server dalam rentang jam trading.
  Return: true jika dalam jam trading.

- IsCooldownComplete()
  Untuk mengecek apakah cooldown setelah close posisi sudah selesai.
  Return: true jika sudah boleh entry lagi.

- UpdateLastCloseTime()
  Untuk menyimpan waktu penutupan posisi terakhir.
  Dipanggil ketika EA mendeteksi posisi sudah tertutup.

- OnScreenInfo()
  Untuk menampilkan informasi di chart: status EA, spread saat ini, 
  sinyal indikator, jam trading, cooldown status, dll.

==================================================
10. DISPLAY ON-CHART (HEAD-UP DISPLAY)
==================================================

Tampilkan informasi penting di chart menggunakan Comment() atau ObjectCreate():

- Status EA: "AKTIF" atau "STANDBY"
- Spread saat ini dan status: "OK" atau "TERLALU TINGGI"
- Jam trading: "DALAM JAM TRADING" atau "DI LUAR JAM TRADING"
- Sinyal EMA: "BULLISH CROSSOVER" / "BEARISH CROSSOVER" / "TIDAK ADA"
- Sinyal RSI: nilai RSI saat ini dan status konfirmasi
- Sinyal Stochastic: nilai %K saat ini dan status konfirmasi
- Status Cooldown: "SIAP" atau "MENUNGGU (XX detik lagi)"
- Posisi aktif: detail order jika ada
- Total profit hari ini

==================================================
11. STANDAR KODE
==================================================

Wajib:
- Gunakan bahasa MQL4.
- Gunakan #property strict.
- Kode harus utuh dan siap compile di MetaEditor MT4.
- Tidak boleh ada bagian kode yang terpotong.
- Berikan komentar singkat pada bagian penting.
- Gunakan OrderSend dengan pengecekan return value.
- Gunakan OrderModify untuk trailing stop dan break-even.
- Gunakan OrderSelect dengan benar (loop dari OrdersTotal()-1 ke 0).
- Gunakan MagicNumber agar EA tidak mengganggu posisi manual.
- Pastikan EA bisa berjalan di XAUUSD atau pair forex lain.
- Semua perhitungan harga menggunakan Point dan NormalizeDouble().
- Gunakan slippage parameter pada OrderSend.
- Handle error code 130 (invalid stops) dengan retry atau skip.

==================================================
12. OUTPUT YANG SAYA INGINKAN
==================================================

Berikan:

1. Kode EA MQL4 lengkap dari awal sampai akhir (siap compile).
2. Penjelasan singkat cara kerja EA scalping ini.
3. Penjelasan setiap parameter input dan rekomendasi nilainya.
4. Catatan risiko penggunaan EA scalping:
   - Risiko spread membesar saat news.
   - Risiko slippage pada broker dengan eksekusi lambat.
   - Risiko over-trading jika cooldown terlalu pendek.
   - Pentingnya VPS untuk latensi rendah.
5. Saran setting awal untuk akun kecil (balance $100 - $500):
   - LotSize: 0.01
   - TakeProfitPips: 30-50
   - StopLossPips: 60-100
   - UseBreakEven: true
   - UseTrailingStop: true
   - MaxSpread: 20-30
   - TradingStartHour: 8 (sesuai sesi London)
   - TradingEndHour: 20
   - CooldownSeconds: 60-120
6. Saran pair/simbol terbaik untuk EA scalping ini:
   - XAUUSD (Gold) - volatilitas tinggi
   - EURUSD - spread rendah
   - GBPUSD - volatilitas menengah
7. Saran timeframe optimal:
   - M5 untuk scalping agresif
   - M15 untuk scalping konservatif

Jangan menjanjikan profit. Fokus pada kode yang aman, rapi, dan siap diuji di akun demo terlebih dahulu.
Selalu gunakan akun demo sebelum akun real.
EA ini dirancang untuk edukasi dan pengujian, bukan jaminan keuntungan.
