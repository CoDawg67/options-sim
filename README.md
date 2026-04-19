# Options Trading Simulator

Paper trading options with real market data. Supports naked calls/puts, covered calls, cash-secured puts, and everything in between.

## What it does

- Pulls real options chains from Yahoo Finance (free, 15-min delayed)
- $100,000 starting paper balance
- Place any options trade: long/short calls, long/short puts, covered calls, cash-secured puts
- **Real Reg T margin calculations** for naked options — you'll see exactly what buying power a naked call eats
- Live P&L tracking as prices move
- Complete trade history
- Accessible from computer AND iPad/phone (same network)

## Setup on your iMac

Open Terminal and run these commands one at a time:

```bash
# 1. Put the files somewhere permanent (Desktop is fine)
cd ~/Desktop
mkdir options_sim
# (Copy server.py, index.html, requirements.txt into this folder)

cd ~/Desktop/options_sim

# 2. Install the Python packages
pip3 install -r requirements.txt --break-system-packages

# 3. Run the server
python3 server.py
```

If `pip3` isn't found, try `pip install -r requirements.txt --break-system-packages`.

## Using it

**On your computer (same iMac):**
Open Safari/Chrome and go to: `http://localhost:5055`

**On your iPad or iPhone (same WiFi network):**

1. Find your iMac's IP address. In Terminal run: `ipconfig getifaddr en0`
2. On your iPad/iPhone, open Safari and go to: `http://[that IP]:5055`
   Example: `http://192.168.1.69:5055`
3. Tap the Share button in Safari → "Add to Home Screen" → now it opens like an app

## How to place trades

**Buy/sell options (any strategy):**
1. Go to the Trade tab
2. Type a symbol (SPY, AAPL, TSLA, etc.) and tap Load
3. Pick an expiration from the dropdown
4. The options chain appears — calls on the left, puts on the right, strike price in the middle
5. Tap any bid or ask price to open a trade ticket
6. Toggle Buy-to-Open (long) or Sell-to-Open (short/naked)
7. Enter contracts and price, review details (including margin for naked trades), place the order

**Covered calls:**
1. First buy 100 shares in the Stock panel
2. Then sell-to-open a call at your chosen strike
3. The system knows you own the shares (covered) so no naked margin applies

**Cash-secured puts:**
1. Just sell-to-open a put
2. Margin is held equal to the assignment cost

**Spreads:**
Place each leg as a separate trade with the same expiration. Manage each leg individually.

## Key things this simulator teaches you

- **Strike selection** — which strikes have the best premium vs. risk
- **IV impact** — high IV = fatter premiums but more movement
- **Time decay (theta)** — short options gain from it, long options bleed
- **Assignment risk** — what happens when short options go in-the-money
- **Margin reality** — naked calls tie up huge buying power, covered calls don't
- **Max loss scenarios** — naked calls have unlimited risk (the simulator reminds you)

## Accuracy notes

- Quotes are 15-min delayed from Yahoo. For learning strategy, this is fine.
- Fills happen at the price you specify (no bid/ask slippage simulated).
- Assignment at expiration is not auto-simulated yet — close positions manually before expiration to lock in P&L.
- Margin formula is Reg T standard. Brokers sometimes use portfolio margin which is more complex.

## Reset

Settings tab → Reset Account. Clears everything, fresh $100k.
