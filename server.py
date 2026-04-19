"""
Options Trading Simulator
Paper trading with real (15-min delayed) options data.
Supports naked calls/puts, covered calls, cash-secured puts, spreads, and more.

Run with: python server.py
Access at: http://localhost:5055 (computer) or http://YOUR_IMAC_IP:5055 (iPad/phone)
"""

from flask import Flask, jsonify, request, render_template, send_from_directory
import yfinance as yf
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path
import math
from scipy.stats import norm
import threading
import time

app = Flask(__name__)
DB_PATH = Path(__file__).parent / "simulator.db"
STARTING_BALANCE = 100000.00

# ---------- Database ----------

def init_db():
    """Create tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS account (
            id INTEGER PRIMARY KEY,
            cash REAL NOT NULL,
            buying_power REAL NOT NULL,
            starting_balance REAL NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            type TEXT NOT NULL,  -- 'stock', 'call', 'put'
            direction TEXT NOT NULL,  -- 'long', 'short'
            quantity INTEGER NOT NULL,
            strike REAL,
            expiration TEXT,
            entry_price REAL NOT NULL,
            entry_date TEXT NOT NULL,
            margin_held REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'open',  -- 'open', 'closed', 'expired', 'assigned'
            exit_price REAL,
            exit_date TEXT,
            pnl REAL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position_id INTEGER,
            action TEXT NOT NULL,  -- 'open', 'close'
            symbol TEXT NOT NULL,
            type TEXT NOT NULL,
            direction TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            strike REAL,
            expiration TEXT,
            price REAL NOT NULL,
            timestamp TEXT NOT NULL,
            notes TEXT
        )
    """)
    # Initialize account if empty
    c.execute("SELECT COUNT(*) FROM account")
    if c.fetchone()[0] == 0:
        c.execute(
            "INSERT INTO account (cash, buying_power, starting_balance, created_at) VALUES (?, ?, ?, ?)",
            (STARTING_BALANCE, STARTING_BALANCE, STARTING_BALANCE, datetime.now().isoformat())
        )
    conn.commit()
    conn.close()


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ---------- Greeks / Black-Scholes (for display when data is thin) ----------

def black_scholes_greeks(S, K, T, r, sigma, option_type='call'):
    """Calculate option Greeks. S=spot, K=strike, T=years to expiry, r=risk-free rate, sigma=IV."""
    if T <= 0 or sigma <= 0:
        return {"delta": 0, "gamma": 0, "theta": 0, "vega": 0}
    d1 = (math.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*math.sqrt(T))
    d2 = d1 - sigma*math.sqrt(T)
    if option_type == 'call':
        delta = norm.cdf(d1)
        theta = (-S*norm.pdf(d1)*sigma/(2*math.sqrt(T)) - r*K*math.exp(-r*T)*norm.cdf(d2))/365
    else:
        delta = norm.cdf(d1) - 1
        theta = (-S*norm.pdf(d1)*sigma/(2*math.sqrt(T)) + r*K*math.exp(-r*T)*norm.cdf(-d2))/365
    gamma = norm.pdf(d1)/(S*sigma*math.sqrt(T))
    vega = S*norm.pdf(d1)*math.sqrt(T)/100
    return {
        "delta": round(delta, 4),
        "gamma": round(gamma, 4),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
    }


# ---------- Margin calculations (Reg T) ----------

def calc_margin_requirement(option_type, direction, strike, premium, spot, quantity):
    """
    Real Reg T margin formula for naked options.
    This is the key piece that makes naked options education valuable.
    Per contract = 100 shares.
    """
    contract_value = 100 * quantity
    if direction == 'long':
        # Long options: just pay the premium, no margin
        return premium * contract_value

    # Short options (naked)
    premium_received = premium * contract_value

    if option_type == 'call':
        # Naked call: max(20% of spot - OTM amount, 10% of strike) + premium, per 100 shares
        otm_amount = max(0, strike - spot)
        method1 = (0.20 * spot - otm_amount + premium) * contract_value
        method2 = (0.10 * strike + premium) * contract_value
        return max(method1, method2)
    else:  # put
        # Naked put: max(20% of spot - OTM amount, 10% of strike) + premium, per 100 shares
        otm_amount = max(0, spot - strike)
        method1 = (0.20 * spot - otm_amount + premium) * contract_value
        method2 = (0.10 * strike + premium) * contract_value
        return max(method1, method2)


# ---------- Market data (yfinance) ----------

_quote_cache = {}
CACHE_SECONDS = 60

def get_quote(symbol):
    """Get current stock price, cached for 60s to avoid rate limits."""
    now = time.time()
    if symbol in _quote_cache:
        cached_time, cached_data = _quote_cache[symbol]
        if now - cached_time < CACHE_SECONDS:
            return cached_data
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1d", interval="1m")
        if hist.empty:
            hist = ticker.history(period="5d")
        price = float(hist['Close'].iloc[-1])
        data = {"symbol": symbol, "price": price, "timestamp": datetime.now().isoformat()}
        _quote_cache[symbol] = (now, data)
        return data
    except Exception as e:
        return {"error": str(e), "symbol": symbol}


def get_options_chain(symbol, expiration=None):
    """Get options chain for a symbol. If expiration is None, returns list of available expirations."""
    try:
        ticker = yf.Ticker(symbol)
        expirations = ticker.options
        if not expirations:
            return {"error": f"No options available for {symbol}"}
        if expiration is None:
            return {"symbol": symbol, "expirations": list(expirations)}
        if expiration not in expirations:
            return {"error": f"Expiration {expiration} not available"}
        chain = ticker.option_chain(expiration)
        spot = get_quote(symbol).get("price", 0)
        calls = chain.calls.to_dict('records')
        puts = chain.puts.to_dict('records')
        # Clean up NaN values
        def clean(records):
            cleaned = []
            for r in records:
                row = {}
                for k, v in r.items():
                    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                        row[k] = None
                    else:
                        row[k] = v
                cleaned.append(row)
            return cleaned
        return {
            "symbol": symbol,
            "spot": spot,
            "expiration": expiration,
            "calls": clean(calls),
            "puts": clean(puts),
        }
    except Exception as e:
        return {"error": str(e)}


# ---------- API endpoints ----------

@app.route("/")
def index():
    return send_from_directory(Path(__file__).parent, "index.html")


@app.route("/api/account")
def api_account():
    conn = db()
    acc = conn.execute("SELECT * FROM account LIMIT 1").fetchone()
    positions = conn.execute("SELECT * FROM positions WHERE status='open'").fetchall()

    # Calculate current portfolio value
    total_margin = sum(p['margin_held'] for p in positions)
    position_value = 0
    position_list = []

    for p in positions:
        pos = dict(p)
        if pos['type'] == 'stock':
            quote = get_quote(pos['symbol'])
            current_price = quote.get('price', pos['entry_price'])
            value = current_price * pos['quantity']
            pnl = (current_price - pos['entry_price']) * pos['quantity']
            if pos['direction'] == 'short':
                pnl = -pnl
            pos['current_price'] = current_price
            pos['current_value'] = value
            pos['unrealized_pnl'] = pnl
            position_value += value
        else:
            # Option position - get current premium from chain
            chain = get_options_chain(pos['symbol'], pos['expiration'])
            current_premium = pos['entry_price']  # fallback
            if 'calls' in chain:
                options_list = chain['calls'] if pos['type'] == 'call' else chain['puts']
                for opt in options_list:
                    if abs(opt.get('strike', 0) - pos['strike']) < 0.01:
                        current_premium = opt.get('lastPrice') or opt.get('ask') or pos['entry_price']
                        break
            multiplier = 100 * pos['quantity']
            if pos['direction'] == 'long':
                pnl = (current_premium - pos['entry_price']) * multiplier
            else:
                pnl = (pos['entry_price'] - current_premium) * multiplier
            pos['current_price'] = current_premium
            pos['unrealized_pnl'] = pnl
        position_list.append(pos)

    conn.close()
    return jsonify({
        "cash": acc['cash'],
        "buying_power": acc['cash'] - total_margin,
        "margin_used": total_margin,
        "starting_balance": acc['starting_balance'],
        "positions": position_list,
        "total_unrealized_pnl": sum(p.get('unrealized_pnl', 0) for p in position_list),
    })


@app.route("/api/quote/<symbol>")
def api_quote(symbol):
    return jsonify(get_quote(symbol.upper()))


@app.route("/api/chain/<symbol>")
def api_chain(symbol):
    exp = request.args.get('expiration')
    return jsonify(get_options_chain(symbol.upper(), exp))


@app.route("/api/trade", methods=['POST'])
def api_trade():
    """
    Place a trade. Body:
    {
        "symbol": "AAPL",
        "type": "call" | "put" | "stock",
        "direction": "long" | "short",
        "quantity": 1,
        "strike": 150.0,       # options only
        "expiration": "2026-05-16",  # options only
        "price": 2.35,         # premium per share for options, price per share for stock
    }
    """
    data = request.json
    symbol = data['symbol'].upper()
    opt_type = data['type']
    direction = data['direction']
    quantity = int(data['quantity'])
    strike = data.get('strike')
    expiration = data.get('expiration')
    price = float(data['price'])

    conn = db()
    acc = conn.execute("SELECT * FROM account LIMIT 1").fetchone()
    cash = acc['cash']

    # Calculate cost/margin
    if opt_type == 'stock':
        cost = price * quantity
        margin_req = cost if direction == 'long' else cost * 1.5  # short stock margin
    else:
        spot = get_quote(symbol).get('price', strike)
        margin_req = calc_margin_requirement(opt_type, direction, strike, price, spot, quantity)
        if direction == 'long':
            cost = price * 100 * quantity
        else:
            cost = -price * 100 * quantity  # credit received

    # Check buying power
    open_positions = conn.execute("SELECT SUM(margin_held) as m FROM positions WHERE status='open'").fetchone()
    current_margin = open_positions['m'] or 0
    available = cash - current_margin

    if direction == 'long' and cost > available:
        conn.close()
        return jsonify({"error": f"Insufficient buying power. Need ${cost:,.2f}, have ${available:,.2f}"}), 400
    if direction == 'short' and margin_req > available:
        conn.close()
        return jsonify({"error": f"Insufficient margin. Need ${margin_req:,.2f}, have ${available:,.2f}"}), 400

    # Adjust cash
    if direction == 'long':
        new_cash = cash - cost
    else:
        new_cash = cash - cost  # cost is negative (credit), so this adds

    # Insert position
    now = datetime.now().isoformat()
    cur = conn.execute("""
        INSERT INTO positions (symbol, type, direction, quantity, strike, expiration, entry_price, entry_date, margin_held, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    """, (symbol, opt_type, direction, quantity, strike, expiration, price, now, margin_req))
    pos_id = cur.lastrowid

    conn.execute("""
        INSERT INTO trades (position_id, action, symbol, type, direction, quantity, strike, expiration, price, timestamp)
        VALUES (?, 'open', ?, ?, ?, ?, ?, ?, ?, ?)
    """, (pos_id, symbol, opt_type, direction, quantity, strike, expiration, price, now))

    conn.execute("UPDATE account SET cash=? WHERE id=?", (new_cash, acc['id']))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "position_id": pos_id,
        "margin_held": margin_req,
        "cash_change": -cost,
        "new_cash": new_cash,
    })


@app.route("/api/close/<int:pos_id>", methods=['POST'])
def api_close(pos_id):
    """Close a position at the given price."""
    data = request.json or {}
    close_price = data.get('price')

    conn = db()
    pos = conn.execute("SELECT * FROM positions WHERE id=? AND status='open'", (pos_id,)).fetchone()
    if not pos:
        conn.close()
        return jsonify({"error": "Position not found"}), 404

    # Get current price if not provided
    if close_price is None:
        if pos['type'] == 'stock':
            close_price = get_quote(pos['symbol']).get('price', pos['entry_price'])
        else:
            chain = get_options_chain(pos['symbol'], pos['expiration'])
            close_price = pos['entry_price']  # fallback
            if 'calls' in chain:
                options_list = chain['calls'] if pos['type'] == 'call' else chain['puts']
                for opt in options_list:
                    if abs(opt.get('strike', 0) - pos['strike']) < 0.01:
                        close_price = opt.get('lastPrice') or opt.get('ask') or pos['entry_price']
                        break

    # Calculate P&L
    if pos['type'] == 'stock':
        multiplier = pos['quantity']
    else:
        multiplier = 100 * pos['quantity']

    if pos['direction'] == 'long':
        pnl = (close_price - pos['entry_price']) * multiplier
        cash_return = close_price * multiplier
    else:
        pnl = (pos['entry_price'] - close_price) * multiplier
        cash_return = -close_price * multiplier  # pay to close short

    # Update account
    acc = conn.execute("SELECT * FROM account LIMIT 1").fetchone()
    # Release margin and add pnl
    new_cash = acc['cash'] + cash_return
    if pos['direction'] == 'short':
        # We had received credit at open; margin was held but cash wasn't reduced by margin
        # Actually, we need to handle this: short options received credit, so closing costs cash
        pass

    now = datetime.now().isoformat()
    conn.execute("""
        UPDATE positions SET status='closed', exit_price=?, exit_date=?, pnl=? WHERE id=?
    """, (close_price, now, pnl, pos_id))
    conn.execute("""
        INSERT INTO trades (position_id, action, symbol, type, direction, quantity, strike, expiration, price, timestamp)
        VALUES (?, 'close', ?, ?, ?, ?, ?, ?, ?, ?)
    """, (pos_id, pos['symbol'], pos['type'], pos['direction'], pos['quantity'], pos['strike'], pos['expiration'], close_price, now))
    conn.execute("UPDATE account SET cash=? WHERE id=?", (new_cash, acc['id']))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "pnl": pnl, "close_price": close_price})


@app.route("/api/history")
def api_history():
    conn = db()
    trades = conn.execute("SELECT * FROM trades ORDER BY timestamp DESC LIMIT 200").fetchall()
    closed = conn.execute("SELECT * FROM positions WHERE status!='open' ORDER BY exit_date DESC LIMIT 100").fetchall()
    conn.close()
    return jsonify({
        "trades": [dict(t) for t in trades],
        "closed_positions": [dict(p) for p in closed],
    })


@app.route("/api/reset", methods=['POST'])
def api_reset():
    """Reset account to starting balance and clear all positions/trades."""
    conn = db()
    conn.execute("DELETE FROM positions")
    conn.execute("DELETE FROM trades")
    conn.execute("UPDATE account SET cash=?, buying_power=?", (STARTING_BALANCE, STARTING_BALANCE))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "new_balance": STARTING_BALANCE})


@app.route("/api/greeks", methods=['POST'])
def api_greeks():
    """Calculate Greeks for a given option."""
    data = request.json
    spot = float(data['spot'])
    strike = float(data['strike'])
    days_to_exp = float(data['days_to_exp'])
    iv = float(data['iv'])
    opt_type = data['type']
    T = days_to_exp / 365
    greeks = black_scholes_greeks(spot, strike, T, 0.045, iv, opt_type)
    return jsonify(greeks)


if __name__ == "__main__":
    init_db()
    import os
    port = int(os.environ.get("PORT", 5055))
    print("=" * 60)
    print("Options Trading Simulator")
    print("=" * 60)
    print(f"Starting balance: ${STARTING_BALANCE:,.2f}")
    print(f"Running on port {port}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=False)
else:
    # Running under gunicorn (Railway) — initialize DB on import
    init_db()
