#!/usr/bin/env python3
"""
server.py
Simple Flask server that exposes:
 - GET /system       -> dynamic system metrics
 - GET /buttons      -> button list loaded from config.yaml (supports placeholders)
 - POST /clear       -> simulate clearing cache (modifies runtime state)
 - POST /maint       -> toggle maintenance mode (writes back to config)
 - POST /log-redirect -> log redirect button usage
"""

import os
import threading
import yaml
from flask import Flask, jsonify, request, abort
import psutil
from pathlib import Path
from datetime import datetime
import subprocess
import platform
import socket
import time
import ipaddress
from urllib.parse import urlparse
import requests

CONFIG_PATH = Path("config.yaml")
AI_SERVER_MAC = "D8:CB:8A:40:15:E5"

app = Flask(__name__)

# Runtime state (cache simulation + maintenance + redirect logs). Kept in memory.
runtime_state = {
    "maintenance": False,  # mirrored to config on startup load
}
config_lock = threading.Lock()


def load_config():
    """Load config.yaml. If missing, return defaults."""
    if not CONFIG_PATH.exists():
        return {"system": {}, "buttons": []}

    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {"system": {}, "buttons": []}


def save_config(config_data):
    """Save config (used to persist maintenance toggle)."""
    with config_lock:
        with CONFIG_PATH.open("w", encoding="utf-8") as f:
            yaml.safe_dump(config_data, f, sort_keys=False)


def bytes_to_gb_str(num_bytes, precision=1):
    gb = num_bytes / (1024 ** 3)
    return f"{gb:.{precision}f}"

def wake_on_lan(mac_address):
    # Remove any separators
    mac_address = mac_address.replace(":", "").replace("-", "")
    
    if len(mac_address) != 12:
        raise ValueError("MAC address should be 12 hexadecimal digits")
    
    # Create the magic packet
    data = bytes.fromhex('FF' * 6 + mac_address * 16)
    
    # Broadcast the packet over UDP
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        s.sendto(data, ('<broadcast>', 9))
    
    print(f"Magic packet sent to {mac_address}")

def get_system_metrics():
    """
    Returns a dict similar to your JS example:
    { cpuUsage: int, ramUsage: int, ramTotal: '16GB', ramUsed: '10.4GB' }
    """
    cpu_percent = int(psutil.cpu_percent(interval=0.1))
    vm = psutil.virtual_memory()
    ram_percent = int(vm.percent)
    ram_total_gb = bytes_to_gb_str(vm.total, precision=0)
    ram_used_gb = bytes_to_gb_str(vm.used, precision=1)

    return {
        "cpuUsage": cpu_percent,
        "ramUsage": ram_percent,
        "ramTotal": f"{ram_total_gb}GB",
        "ramUsed": f"{ram_used_gb}GB",
    }


def render_button_value(value_template: str, system_metrics: dict):
    """
    If the button value is a string with placeholders like "{cpu}",
    substitute with values from system_metrics or derived fields.
    """
    if not isinstance(value_template, str):
        return value_template

    # expose small set of placeholders: cpu, ramUsage, ramTotal, ramUsed, cache_cleared, maintenance
    placeholders = {
        "cpu": system_metrics.get("cpuUsage"),
        "ramUsage": system_metrics.get("ramUsage"),
        "ramTotal": system_metrics.get("ramTotal"),
        "ramUsed": system_metrics.get("ramUsed"),
        "cache_cleared": runtime_state.get("cache_cleared"),
        "maintenance": runtime_state.get("maintenance"),
    }
    try:
        return value_template.format(**placeholders)
    except Exception:
        # if formatting fails, return original template
        return value_template


@app.route("/system", methods=["GET"])
def api_system():
    metrics = get_system_metrics()
    return jsonify(metrics), 200


@app.route("/buttons", methods=["GET"])
def api_buttons():
    config = load_config()
    buttons = config.get("buttons", [])
    sys_metrics = get_system_metrics()

    processed = []
    for btn in buttons:
        # shallow copy
        copy_btn = dict(btn)
        if "value" in copy_btn:
            copy_btn["value"] = render_button_value(copy_btn["value"], sys_metrics)
        # If toggleState is present and we have runtime state for maintenance, prefer runtime state
        if copy_btn.get("endpoint") == "/maint":
            copy_btn["toggleState"] = runtime_state.get(
                "maintenance", copy_btn.get("toggleState", False)
            )
        if copy_btn.get("endpoint") == "/web-ui":
            copy_btn["toggleState"] = is_online("192.168.23.1")
        processed.append(copy_btn)

    return jsonify(processed), 200

def _is_ip_address(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def is_online(target: str) -> bool:
    """
    - If `target` is a bare IP address -> use ping, return True on success.
    - Otherwise treat `target` as a URL/hostname -> use HTTP GET, return True if status_code == 200.
    """

    # If it's a plain IP address (v4 or v6), use ping
    if _is_ip_address(target):
        param = "-c"
        command = ["ping", param, "1", "-W", "1", target]
        return subprocess.call(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        ) == 0

    # Otherwise, treat as URL/hostname and use HTTP GET
    parsed = urlparse(target)
    if not parsed.scheme:
        # No scheme given, assume http
        url = "http://" + target
    else:
        url = target

    try:
        resp = requests.get(url, timeout=1)
        return resp.status_code == 200
    except requests.RequestException:
        return False

@app.route("/maint", methods=["POST"])
def api_maint():
    """
    Toggle maintenance mode.
    Accepts optional JSON body: {"set": true} to explicitly set, otherwise toggles.
    Persists the maintenance field in config.yaml so it survives restarts.
    """
    config = load_config()
    body = {}
    if request.is_json:
        try:
            body = request.get_json()
        except Exception:
            body = {}

    current = runtime_state.get("maintenance", False)
    if "set" in body:
        new_state = bool(body["set"])
    else:
        new_state = not current

    runtime_state["maintenance"] = new_state

    # persist back to config if a matching toggle exists in config, otherwise add/ensure system->maintenance
    modified = False
    # if there is a toggle button in config, try to update its toggleState
    if "buttons" in config:
        for btn in config["buttons"]:
            if btn.get("endpoint") == "/maint":
                btn["toggleState"] = new_state
                modified = True

    # also persist under top-level system.maintenance so it's easy to find
    if "system" not in config:
        config["system"] = {}
    config["system"]["maintenance"] = new_state
    modified = True

    if modified:
        try:
            save_config(config)
        except Exception as e:
            # If saving fails, still return success but note that persistence failed
            return jsonify(
                {
                    "status": "ok",
                    "message": "Maintenance updated in memory but failed to persist",
                    "maintenance": new_state,
                    "error": str(e),
                }
            ), 200

    return jsonify({"status": "ok", "maintenance": new_state}), 200


@app.route("/dummy", methods=["POST"])
def api_dummy():
    return jsonify({"status": "ok"}), 200

# ---------- NEW: redirect button logging endpoint ----------

@app.route("/get-webui", methods=["POST"])
def api_log_redirect():

    wake_on_lan(AI_SERVER_MAC)
    
    while not is_online("192.168.23.22"):
        time.sleep(1)
        print("Waiting for AI server to come online...")

    while not is_online("openwebui.illerit.de"):
        time.sleep(1)
        print("Waiting for AI Web UI to come online...")

    return jsonify({"status": "ok", "logged": True}), 200

@app.route("/start-ki-server", methods=["POST"])
def api_start_ki_server():

    wake_on_lan(AI_SERVER_MAC)

    return jsonify({"status": "ok", "logged": True}), 200

# ----------------------------------------------------------

@app.route("/status/<ip>", methods=["GET"])
def api_web_ui_status(ip):

    online = is_online(ip)
    return jsonify({"online": bool(online)}), 200

if __name__ == "__main__":
    # Ensure config exists with defaults if not present
    if not CONFIG_PATH.exists():
        sample = {
            "system": {"ramTotalFormat": "{total_gb}GB", "maintenance": False},
        }
        save_config(sample)
        print("Created default config.yaml")

    # initialize runtime maintenance from config
    cfg = load_config()
    runtime_state["maintenance"] = bool(cfg.get("system", {}).get("maintenance", False))

    # Run Flask dev server. In production use gunicorn/uvicorn etc.
    app.run(host="0.0.0.0", port=5000, debug=True)
