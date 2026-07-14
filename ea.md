# EA Quick Scalp — MetaTrader 5 (MQL5)

## Konsep: Entry Cepat, TP Cepat, Entry Lagi

```
  ENTRY LANGSUNG → Profit? → CLOSE! → ENTRY LAGI → Profit? → CLOSE! → ...
      (market)      (cek)    (cepat)   (langsung)    (cek)    (cepat)
```

Tidak pakai pending order. Langsung **market execution** setiap cycle.

---

## Kode EA MQL5 Lengkap

```mql5
//+------------------------------------------------------------------+
//|                                         QuickScalp_v4.mq5        |
//|                   EA Quick Scalp — Entry Cepat, TP Cepat          |
//|                                                                    |
//|  KONSEP:                                                           |
//|  1. Tentukan arah (BUY/SELL) dengan cek cepat                    |
//|  2. LANGSUNG buka posisi market order                             |
//|  3. Pantau profit setiap tick                                     |
//|  4. Profit >= target → CLOSE SEMUA                                |
//|  5. LANGSUNG entry lagi (loop tanpa henti)                        |
//|                                                                    |
//|  PERINGATAN: EA ini untuk edukasi dan pengujian di akun demo.     |
//|  Tidak ada jaminan profit. Trading memiliki risiko tinggi.        |
//+------------------------------------------------------------------+
#property copyright   "Quick Scalp EA v4.0"
#property link        ""
#property version     "4.00"
#property description "Entry CEPAT, TP CEPAT, Entry Lagi — Loop Terus"
#property description "Market Execution — Tanpa Pending Order"

#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>

//+------------------------------------------------------------------+
//| ENUM: Mode penentuan arah entry (HARUS di atas input)             |
//+------------------------------------------------------------------+
enum ENUM_ENTRY_MODE
{
   ENTRY_MODE_CANDLE   = 0,   // Candle Terakhir (paling cepat)
   ENTRY_MODE_EMA      = 1,   // Price vs EMA (trend follow)
   ENTRY_MODE_MOMENTUM = 2,   // Momentum 3 Candle
   ENTRY_MODE_HEDGE    = 3    // BUY+SELL Sekaligus (hedge)
};

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                   |
//+------------------------------------------------------------------+

input group    "══════ LOT & ENTRY ══════"
input double   InpLotSize           = 0.01;              // Lot Size per Posisi
input int      InpMaxPositions      = 5;                  // Jumlah Posisi per Entry (1-10)
input ulong    InpMagicNumber       = 20260711;           // Magic Number

input group    "══════ TARGET PROFIT — CLOSE CEPAT ══════"
input double   InpProfitTarget      = 1.00;               // Target Profit per Cycle ($) — CLOSE semua
input double   InpMaxLossPerCycle   = 10.00;              // Max Loss per Cycle ($) — Cut Loss semua

input group    "══════ STOP LOSS SAFETY ══════"
input int      InpStopLossPips      = 500;                // SL per Posisi (points) — Safety net terakhir

input group    "══════ ARAH ENTRY ══════"
input ENUM_ENTRY_MODE InpEntryMode  = ENTRY_MODE_CANDLE;  // Mode Penentuan Arah
input int      InpEMA_Period        = 5;                  // EMA Period (untuk mode EMA)

input group    "══════ TARGET HARIAN ══════"
input double   InpDailyTarget       = 50.00;              // Target Profit Harian ($) (0=off)
input double   InpDailyMaxLoss      = 30.00;              // Max Loss Harian ($) (0=off)

input group    "══════ FILTER ══════"
input int      InpMaxSpread         = 50;                  // Max Spread (points)
input bool     InpUseTradingHours   = false;               // Filter Jam Trading (false=24jam)
input int      InpTradingStartHour  = 0;                   // Jam Mulai
input int      InpTradingEndHour    = 23;                  // Jam Selesai

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                   |
//+------------------------------------------------------------------+
CTrade         trade;
CSymbolInfo    symInfo;

int            handleEMA;             // Handle EMA (jika pakai mode EMA)
int            totalCycles;           // Total cycles selesai hari ini
double         totalAccumProfit;      // Akumulasi profit hari ini
bool           dailyTargetHit;        // Target harian tercapai
bool           dailyLossHit;          // Max loss harian tercapai
datetime       currentDay;            // Untuk reset harian

//+------------------------------------------------------------------+
//| Expert initialization                                              |
//+------------------------------------------------------------------+
int OnInit()
{
   //--- Validasi
   if(InpLotSize <= 0)
   {
      Print("ERROR: LotSize harus > 0");
      return(INIT_PARAMETERS_INCORRECT);
   }
   if(InpMaxPositions < 1 || InpMaxPositions > 10)
   {
      Print("ERROR: MaxPositions harus 1-10");
      return(INIT_PARAMETERS_INCORRECT);
   }
   if(InpProfitTarget <= 0)
   {
      Print("ERROR: ProfitTarget harus > 0");
      return(INIT_PARAMETERS_INCORRECT);
   }

   //--- Setup trade
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(30);

   //--- Coba set filling mode yang didukung broker
   ENUM_ORDER_TYPE_FILLING filling = ORDER_FILLING_FOK;
   long fillingMode = 0;
   if(SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE, fillingMode))
   {
      if((fillingMode & SYMBOL_FILLING_IOC) != 0)
         filling = ORDER_FILLING_IOC;
      else if((fillingMode & SYMBOL_FILLING_FOK) != 0)
         filling = ORDER_FILLING_FOK;
      else
         filling = ORDER_FILLING_RETURN;
   }
   trade.SetTypeFilling(filling);

   //--- Symbol
   symInfo.Name(_Symbol);
   symInfo.Refresh();

   //--- EMA handle (jika dipakai)
   handleEMA = INVALID_HANDLE;
   if(InpEntryMode == ENTRY_MODE_EMA)
   {
      handleEMA = iMA(_Symbol, PERIOD_M1, InpEMA_Period, 0, MODE_EMA, PRICE_CLOSE);
      if(handleEMA == INVALID_HANDLE)
      {
         Print("ERROR: Gagal buat EMA handle. Error: ", GetLastError());
         return(INIT_FAILED);
      }
   }

   //--- Reset
   totalCycles      = 0;
   totalAccumProfit = 0;
   dailyTargetHit   = false;
   dailyLossHit     = false;
   currentDay       = StringToTime(TimeToString(TimeCurrent(), TIME_DATE));

   Print("==============================================");
   Print("  EA QUICK SCALP v4.0 - AKTIF");
   Print("  Mode: ", GetModeName());
   Print("  Lot: ", InpLotSize, " x ", InpMaxPositions, " posisi");
   Print("  Target/Cycle: $", DoubleToString(InpProfitTarget, 2));
   Print("  Max Loss/Cycle: $", DoubleToString(InpMaxLossPerCycle, 2));
   Print("  SL Safety: ", InpStopLossPips, " points");
   Print("==============================================");

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                            |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(handleEMA != INVALID_HANDLE) IndicatorRelease(handleEMA);
   Comment("");
   Print("=== Quick Scalp OFF | Cycles: ", totalCycles,
         " | Profit: $", DoubleToString(totalAccumProfit, 2), " ===");
}

//+------------------------------------------------------------------+
//| Expert tick function — LOGIKA UTAMA                                |
//+------------------------------------------------------------------+
void OnTick()
{
   symInfo.Refresh();
   symInfo.RefreshRates();

   //--- Reset harian
   datetime today = StringToTime(TimeToString(TimeCurrent(), TIME_DATE));
   if(today != currentDay)
   {
      currentDay       = today;
      totalCycles      = 0;
      totalAccumProfit = 0;
      dailyTargetHit   = false;
      dailyLossHit     = false;
      Print("=== HARI BARU - Reset counter ===");
   }

   //--- Hitung posisi
   int myPositions = CountMyPositions();

   //--- Cek target/loss harian
   double todayPL = GetTodayProfit();

   if(InpDailyTarget > 0 && todayPL >= InpDailyTarget)
   {
      if(!dailyTargetHit)
      {
         dailyTargetHit = true;
         Print("TARGET HARIAN TERCAPAI: $", DoubleToString(todayPL, 2));
         if(myPositions > 0) CloseAllMyPositions();
      }
      ShowHUD();
      return;
   }

   if(InpDailyMaxLoss > 0 && todayPL <= -InpDailyMaxLoss)
   {
      if(!dailyLossHit)
      {
         dailyLossHit = true;
         Print("MAX LOSS HARIAN: $", DoubleToString(todayPL, 2));
         if(myPositions > 0) CloseAllMyPositions();
      }
      ShowHUD();
      return;
   }

   if(dailyTargetHit || dailyLossHit)
   {
      ShowHUD();
      return;
   }

   //=================================================================
   // ADA POSISI → PANTAU PROFIT, CLOSE CEPAT
   //=================================================================
   if(myPositions > 0)
   {
      double floating = GetFloatingPL();

      //--- PROFIT TERCAPAI → CLOSE SEMUA!
      if(floating >= InpProfitTarget)
      {
         Print("PROFIT! $", DoubleToString(floating, 2), " -> CLOSE ALL!");
         CloseAllMyPositions();
         totalCycles++;
         totalAccumProfit += floating;
         ShowHUD();
         return;
      }

      //--- CUT LOSS → CLOSE SEMUA
      if(InpMaxLossPerCycle > 0 && floating <= -InpMaxLossPerCycle)
      {
         Print("CUT LOSS! $", DoubleToString(floating, 2), " -> CLOSE ALL!");
         CloseAllMyPositions();
         totalCycles++;
         totalAccumProfit += floating;
         ShowHUD();
         return;
      }

      ShowHUD();
      return;
   }

   //=================================================================
   // TIDAK ADA POSISI → LANGSUNG ENTRY!
   //=================================================================

   //--- Filter jam trading
   if(InpUseTradingHours && !IsTradingHour())
   {
      ShowHUD();
      return;
   }

   //--- Filter spread
   if(!IsSpreadOK())
   {
      ShowHUD();
      return;
   }

   //--- Filter trading diizinkan
   if(!MQLInfoInteger(MQL_TRADE_ALLOWED))
   {
      ShowHUD();
      return;
   }

   //--- TENTUKAN ARAH & ENTRY LANGSUNG!
   int direction = GetDirection();

   if(direction == 0 && InpEntryMode != ENTRY_MODE_HEDGE)
   {
      ShowHUD();
      return;
   }

   //--- EKSEKUSI ENTRY!
   if(InpEntryMode == ENTRY_MODE_HEDGE)
   {
      //--- Mode hedge: buka BUY + SELL sekaligus
      int halfPos = InpMaxPositions / 2;
      if(halfPos < 1) halfPos = 1;
      int otherHalf = InpMaxPositions - halfPos;

      ExecuteMarketOrders(1, halfPos);      // BUY
      ExecuteMarketOrders(-1, otherHalf);   // SELL
   }
   else
   {
      ExecuteMarketOrders(direction, InpMaxPositions);
   }

   ShowHUD();
}

//+------------------------------------------------------------------+
//| FUNGSI: Tentukan arah entry                                        |
//| Return: 1 = BUY, -1 = SELL, 0 = tidak ada sinyal                 |
//+------------------------------------------------------------------+
int GetDirection()
{
   switch(InpEntryMode)
   {
      case ENTRY_MODE_CANDLE:   return GetDirectionCandle();
      case ENTRY_MODE_EMA:      return GetDirectionEMA();
      case ENTRY_MODE_MOMENTUM: return GetDirectionMomentum();
      case ENTRY_MODE_HEDGE:    return 1;
   }
   return 0;
}

//+------------------------------------------------------------------+
//| ARAH: Candle terakhir M1 (PALING CEPAT)                           |
//| Candle hijau = BUY, Candle merah = SELL                           |
//+------------------------------------------------------------------+
int GetDirectionCandle()
{
   double open1  = iOpen(_Symbol, PERIOD_M1, 1);
   double close1 = iClose(_Symbol, PERIOD_M1, 1);

   if(close1 > open1) return 1;   // Candle bullish = BUY
   if(close1 < open1) return -1;  // Candle bearish = SELL
   return 0;
}

//+------------------------------------------------------------------+
//| ARAH: Price vs EMA (trend follow)                                  |
//| Price > EMA = BUY, Price < EMA = SELL                             |
//+------------------------------------------------------------------+
int GetDirectionEMA()
{
   if(handleEMA == INVALID_HANDLE) return GetDirectionCandle();

   double ema[];
   ArraySetAsSeries(ema, true);
   if(CopyBuffer(handleEMA, 0, 0, 2, ema) < 2) return 0;

   double price = symInfo.Bid();

   if(price > ema[0]) return 1;
   if(price < ema[0]) return -1;
   return 0;
}

//+------------------------------------------------------------------+
//| ARAH: Momentum 3 candle                                           |
//| 2 dari 3 candle bullish = BUY, 2 dari 3 bearish = SELL           |
//+------------------------------------------------------------------+
int GetDirectionMomentum()
{
   int bullCount = 0;
   int bearCount = 0;

   for(int i = 1; i <= 3; i++)
   {
      double o = iOpen(_Symbol, PERIOD_M1, i);
      double c = iClose(_Symbol, PERIOD_M1, i);
      if(c > o) bullCount++;
      else if(c < o) bearCount++;
   }

   if(bullCount >= 2) return 1;
   if(bearCount >= 2) return -1;
   return 0;
}

//+------------------------------------------------------------------+
//| FUNGSI: Eksekusi market order                                      |
//| direction: 1=BUY, -1=SELL | count: jumlah posisi                  |
//+------------------------------------------------------------------+
void ExecuteMarketOrders(int direction, int count)
{
   double lot    = ValidateLot(InpLotSize);
   double point  = symInfo.Point();
   int    digits = (int)symInfo.Digits();

   if(lot <= 0)
   {
      Print("ERROR: Lot invalid");
      return;
   }

   int success = 0;
   string dirStr = (direction == 1) ? "BUY" : "SELL";

   for(int i = 0; i < count; i++)
   {
      symInfo.RefreshRates();

      double price = 0;
      double sl    = 0;
      string comment = "QS_" + dirStr + "_" + IntegerToString(i+1);

      if(direction == 1)
      {
         price = symInfo.Ask();
         sl = NormalizeDouble(price - InpStopLossPips * point, digits);

         if(trade.Buy(lot, _Symbol, price, sl, 0, comment))
            success++;
         else
            Print("X ", comment, " GAGAL | ", trade.ResultRetcode(),
                  " ", trade.ResultRetcodeDescription());
      }
      else
      {
         price = symInfo.Bid();
         sl = NormalizeDouble(price + InpStopLossPips * point, digits);

         if(trade.Sell(lot, _Symbol, price, sl, 0, comment))
            success++;
         else
            Print("X ", comment, " GAGAL | ", trade.ResultRetcode(),
                  " ", trade.ResultRetcodeDescription());
      }
   }

   Print(">> ENTRY ", dirStr, " x", success, "/", count,
         " @ ", DoubleToString(symInfo.Bid(), digits));
}

//+------------------------------------------------------------------+
//| FUNGSI: Close semua posisi milik EA ini                            |
//+------------------------------------------------------------------+
void CloseAllMyPositions()
{
   for(int attempt = 0; attempt < 5; attempt++)
   {
      bool hasRemaining = false;

      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket == 0) continue;
         if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
         if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagicNumber) continue;

         if(!trade.PositionClose(ticket, 30))
         {
            Print("Retry close #", ticket, " | Error: ", trade.ResultRetcode());
            hasRemaining = true;
         }
      }

      if(!hasRemaining) break;
      Sleep(50);
   }
}

//+------------------------------------------------------------------+
//| FUNGSI: Hitung posisi milik EA                                     |
//+------------------------------------------------------------------+
int CountMyPositions()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagicNumber) continue;
      count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| FUNGSI: Hitung floating P/L                                        |
//+------------------------------------------------------------------+
double GetFloatingPL()
{
   double total = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagicNumber) continue;
      total += PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
   }
   return total;
}

//+------------------------------------------------------------------+
//| FUNGSI: Profit hari ini dari history                                |
//+------------------------------------------------------------------+
double GetTodayProfit()
{
   double total = 0;
   datetime dayStart = StringToTime(TimeToString(TimeCurrent(), TIME_DATE));
   HistorySelect(dayStart, TimeCurrent());

   for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;
      if(HistoryDealGetString(dealTicket, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(dealTicket, DEAL_MAGIC) != (long)InpMagicNumber) continue;
      total += HistoryDealGetDouble(dealTicket, DEAL_PROFIT)
             + HistoryDealGetDouble(dealTicket, DEAL_SWAP)
             + HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   }
   return total;
}

//+------------------------------------------------------------------+
//| FUNGSI: Validasi lot                                               |
//+------------------------------------------------------------------+
double ValidateLot(double reqLot)
{
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   if(reqLot < minLot) reqLot = minLot;
   if(reqLot > maxLot) reqLot = maxLot;
   if(lotStep > 0) reqLot = MathFloor(reqLot / lotStep) * lotStep;

   return NormalizeDouble(reqLot, 2);
}

//+------------------------------------------------------------------+
//| FUNGSI: Cek spread                                                 |
//+------------------------------------------------------------------+
bool IsSpreadOK()
{
   return ((int)symInfo.Spread() <= InpMaxSpread);
}

//+------------------------------------------------------------------+
//| FUNGSI: Cek jam trading                                            |
//+------------------------------------------------------------------+
bool IsTradingHour()
{
   MqlDateTime dt;
   TimeCurrent(dt);

   if(InpTradingStartHour < InpTradingEndHour)
      return (dt.hour >= InpTradingStartHour && dt.hour < InpTradingEndHour);

   if(InpTradingStartHour > InpTradingEndHour)
      return (dt.hour >= InpTradingStartHour || dt.hour < InpTradingEndHour);

   return true;
}

//+------------------------------------------------------------------+
//| FUNGSI: Nama mode entry                                            |
//+------------------------------------------------------------------+
string GetModeName()
{
   switch(InpEntryMode)
   {
      case ENTRY_MODE_CANDLE:    return "CANDLE (Cepat)";
      case ENTRY_MODE_EMA:       return "EMA Trend";
      case ENTRY_MODE_MOMENTUM:  return "MOMENTUM 3 Candle";
      case ENTRY_MODE_HEDGE:     return "HEDGE (BUY+SELL)";
   }
   return "Unknown";
}

//+------------------------------------------------------------------+
//| FUNGSI: HUD — Info di chart                                        |
//+------------------------------------------------------------------+
void ShowHUD()
{
   int    myPos    = CountMyPositions();
   double floating = GetFloatingPL();
   double todayPL  = GetTodayProfit();
   int    spread   = (int)symInfo.Spread();
   int    digits   = (int)symInfo.Digits();

   string sep = "--------------------------------------\n";
   string info = "\n";

   info += "=== EA QUICK SCALP v4.0 ===\n";
   info += sep;

   //--- Status
   string status = "";
   if(dailyTargetHit)       status = "TARGET HARIAN TERCAPAI!";
   else if(dailyLossHit)    status = "MAX LOSS HARIAN!";
   else if(myPos > 0)       status = "DALAM POSISI - Pantau profit...";
   else                     status = "SIAP ENTRY...";
   info += "STATUS  : " + status + "\n";

   //--- Mode
   info += "MODE    : " + GetModeName() + "\n";

   //--- Arah saat ini
   if(myPos == 0 && InpEntryMode != ENTRY_MODE_HEDGE)
   {
      int dir = GetDirection();
      string dirStr = "NETRAL";
      if(dir == 1)       dirStr = ">> BUY";
      else if(dir == -1) dirStr = ">> SELL";
      info += "SINYAL  : " + dirStr + "\n";
   }

   //--- Harga & Spread
   info += "BID/ASK : " + DoubleToString(symInfo.Bid(), digits) + " / " +
           DoubleToString(symInfo.Ask(), digits) + "\n";
   info += "SPREAD  : " + IntegerToString(spread) + " pts ";
   if(spread <= InpMaxSpread)
      info += "(OK)\n";
   else
      info += "(TINGGI!)\n";

   info += sep;

   //--- FLOATING P/L
   if(myPos > 0)
   {
      info += "POSISI AKTIF: " + IntegerToString(myPos) + "\n";

      // Detail posisi
      int idx = 0;
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         ulong ticket = PositionGetTicket(i);
         if(ticket == 0) continue;
         if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
         if(PositionGetInteger(POSITION_MAGIC) != (long)InpMagicNumber) continue;

         idx++;
         long   type = PositionGetInteger(POSITION_TYPE);
         double op   = PositionGetDouble(POSITION_PRICE_OPEN);
         double pl   = PositionGetDouble(POSITION_PROFIT);
         string t    = (type == POSITION_TYPE_BUY) ? "BUY " : "SELL";
         string s    = (pl >= 0) ? "+" : "";

         info += "  " + IntegerToString(idx) + "." + t + " @ " +
                 DoubleToString(op, digits) + " = " + s + "$" +
                 DoubleToString(pl, 2) + "\n";
      }

      info += sep;

      //--- Total floating + progress bar
      string plSign = (floating >= 0) ? "+" : "";
      info += "  FLOATING: " + plSign + "$" + DoubleToString(floating, 2) +
              " / $" + DoubleToString(InpProfitTarget, 2) + "\n";

      // Progress bar
      double pct = 0;
      if(InpProfitTarget > 0)
         pct = MathMax(0, MathMin(floating / InpProfitTarget * 100.0, 100.0));
      int bars = (int)(pct / 5.0);
      string bar = "  [";
      for(int b = 0; b < 20; b++)
      {
         if(b < bars)
            bar += "#";
         else
            bar += ".";
      }
      bar += "] " + DoubleToString(pct, 0) + "%\n";
      info += bar;
   }
   else
   {
      info += "POSISI: Tidak ada (siap entry)\n";
   }

   info += sep;

   //--- Statistik
   info += "HARI INI:\n";
   info += "  Cycles  : " + IntegerToString(totalCycles) + "\n";
   info += "  Akumulasi: $" + DoubleToString(totalAccumProfit, 2) + "\n";
   info += "  Total P/L: $" + DoubleToString(todayPL, 2);
   if(InpDailyTarget > 0)
      info += " / $" + DoubleToString(InpDailyTarget, 2);
   info += "\n";

   info += sep;
   info += "EA ini untuk EDUKASI & DEMO saja.\n";

   Comment(info);
}
//+------------------------------------------------------------------+
```

---

## Error yang Diperbaiki

| No | Error | Penyebab | Perbaikan |
|----|-------|----------|-----------|
| 1 | `ENUM_ENTRY_MODE` tidak dikenali | Enum dideklarasikan SETELAH input yang menggunakannya | Pindahkan enum ke ATAS sebelum semua input |
| 2 | `#property strict` | Hanya valid di MQL4, tidak ada di MQL5 | Dihapus |
| 3 | `MODE_CANDLE`, `MODE_EMA` bentrok | Nama `MODE_EMA` sudah dipakai MQL5 sebagai konstanta bawaan (=1) | Ganti nama jadi `ENTRY_MODE_CANDLE`, `ENTRY_MODE_EMA`, dll |
| 4 | `SetMarginMode()` | Method ini tidak ada di CTrade MQL5 | Dihapus |
| 5 | Karakter Unicode emoji (🎯🛑⚡) | Beberapa MetaEditor tidak support Unicode | Diganti dengan teks ASCII biasa |
| 6 | `ORDER_FILLING_FOK` tidak didukung semua broker | Filling mode berbeda per broker | Tambah auto-detect filling mode dari `SYMBOL_FILLING_MODE` |
| 7 | Progress bar Unicode (`█░`) | Bisa error di beberapa terminal | Diganti `#` dan `.` |

---

## Cara Kerja Per Tick

```
OnTick():
|
+- Ada posisi?
|   +- YA -> Cek floating P/L
|   |        +- Profit >= target -> CLOSE SEMUA! -> (tick selanjutnya entry lagi)
|   |        +- Loss >= max -> CUT LOSS! -> (tick selanjutnya entry lagi)
|   |
|   +- TIDAK -> Cek arah -> LANGSUNG ENTRY!
|                +- Mode Candle: candle hijau=BUY, merah=SELL
|                +- Mode EMA: price>EMA=BUY, price<EMA=SELL
|                +- Mode Momentum: mayoritas 3 candle
|                +- Mode Hedge: BUY + SELL sekaligus
```

---

## Setting Rekomendasi Modal $200

| Parameter | Nilai | Alasan |
|-----------|-------|--------|
| **LotSize** | 0.01 | Lot terkecil |
| **MaxPositions** | 3 | Hemat margin |
| **ProfitTarget** | $0.50 - $1.00 | Target kecil = close cepat |
| **MaxLossPerCycle** | $5.00 | Cut loss ketat |
| **StopLossPips** | 500 | Safety net lebar |
| **EntryMode** | CANDLE | Paling cepat |
| **MaxSpread** | 30-50 | Sesuai broker |
| **DailyTarget** | $10 - $20 | Target realistis |
| **DailyMaxLoss** | $20 | Batas loss harian |

---

## PERINGATAN

1. **Spread bisa lebih besar dari profit** — pastikan profit target > total spread cost.
2. **Kecepatan eksekusi bergantung broker** — gunakan broker ECN/STP.
3. **Gunakan VPS** untuk koneksi stabil.
4. **TEST DI DEMO DULU** minimal 1 bulan.

**DISCLAIMER**: EA ini untuk edukasi. Tidak ada jaminan profit.
