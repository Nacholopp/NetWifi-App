import json
import re
import subprocess
import unicodedata
from datetime import datetime, timezone


def normalize_key(key):
    normalized = unicodedata.normalize("NFKD", key)
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    return re.sub(r"\s+", " ", without_accents.strip().lower())


def first_number(value):
    match = re.search(r"\d+(?:[.,]\d+)?", value or "")
    if not match:
        return None

    number = match.group().replace(",", ".")
    return float(number) if "." in number else int(number)


def get_field(fields, *keys):
    for key in keys:
        value = fields.get(key)
        if value:
            return value

    return None


def estimate_dbm(signal_percent):
    if signal_percent is None:
        return None
    clamped = max(0, min(100, signal_percent))
    return round((clamped / 2) - 100)


def quality_from_dbm(dbm):
    if dbm is None:
        return "Sin datos"
    if dbm >= -50:
        return "Excelente"
    if dbm >= -60:
        return "Buena"
    if dbm >= -70:
        return "Aceptable"
    return "Debil"


def band_from_channel(channel):
    if channel is None:
        return None
    return "2.4 GHz" if channel <= 14 else "5 GHz"


def read_ping():
    result = subprocess.run(
        ["ping", "-n", "1", "1.1.1.1"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    if result.returncode != 0:
        return None

    match = re.search(r"(?:tiempo|time)[=<]\s*(\d+)\s*ms", result.stdout.lower())
    return int(match.group(1)) if match else None


def read_wifi():
    result = subprocess.run(
        ["netsh", "wlan", "show", "interfaces"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip() or result.stdout.strip() or "No se pudo leer la interfaz WiFi"
        )

    fields = {}

    for line in result.stdout.splitlines():
        if ":" not in line:
            continue

        key, value = line.split(":", 1)
        fields[normalize_key(key)] = value.strip()

    state = get_field(fields, "state", "estado")
    connected = str(state or "").strip().lower() in ("connected", "conectado")
    signal_percent = first_number(get_field(fields, "signal", "senal"))
    channel = first_number(get_field(fields, "channel", "canal"))
    dbm = estimate_dbm(signal_percent)

    return {
        "connected": connected,
        "ssid": get_field(fields, "ssid"),
        "band": band_from_channel(channel),
        "signalPercent": signal_percent,
        "rssiDbm": dbm,
        "dbm": dbm,
        "rssiEstimated": True,
        "rxMbps": first_number(
            get_field(fields, "receive rate (mbps)", "velocidad de recepcion (mbps)")
        ),
        "txMbps": first_number(
            get_field(fields, "transmit rate (mbps)", "velocidad de transmision (mbps)")
        ),
        "pingMs": read_ping(),
        "quality": quality_from_dbm(dbm),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


try:
    print(json.dumps(read_wifi(), ensure_ascii=False))
except Exception as error:
    print(
        json.dumps(
            {
                "connected": False,
                "error": str(error),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            ensure_ascii=False,
        )
    )
