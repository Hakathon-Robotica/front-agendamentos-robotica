"""Sign into the Robotics School web app with PyAutoGUI."""

from pathlib import Path
import os
import subprocess
import sys
import tempfile
import time
import traceback
import tkinter as tk
from tkinter import messagebox

import pyautogui


APP_URL = "https://front-agendamentos-robotica.vercel.app/"
URL = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith(("http://", "https://")) else APP_URL
EMAIL = "admin@robotica.edu.br"
PASSWORD = "admin123"
APP_DIR = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
LOG_PATH = APP_DIR / "rpa_run.log"

pyautogui.PAUSE = 0.25
pyautogui.FAILSAFE = True


def log(message: str) -> None:
    with LOG_PATH.open("a", encoding="utf-8") as stream:
        stream.write(message + "\n")


def find_browser() -> Path:
    candidates = [
        Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")) / "Microsoft/Edge/Application/msedge.exe",
        Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Microsoft/Edge/Application/msedge.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("Google Chrome or Microsoft Edge was not found.")


def run_login(email: str, password: str) -> None:
    browser = find_browser()
    profile = Path(tempfile.mkdtemp(prefix="robotica-rpa-"))
    subprocess.Popen([
        str(browser), f"--user-data-dir={profile}", "--no-first-run",
        "--no-default-browser-check", "--disable-sync", f"--app={URL}",
    ])
    log(f"Opened {URL}")

    window = None
    for _ in range(20):
        matches = [
            item for item in pyautogui.getAllWindows()
            if "Rob\u00f3tica Escolar" in item.title and "Google Chrome" in item.title
        ]
        if matches:
            window = matches[-1]
            break
        time.sleep(0.5)
    if window is None:
        raise RuntimeError("The Robotics School page did not open; login was not attempted.")

    window.activate()
    pyautogui.hotkey("win", "up")
    time.sleep(0.5)
    screen = pyautogui.size()
    pyautogui.click(screen.width // 2, screen.height // 2)
    time.sleep(0.5)

    # The login screen starts with the brand link, then the email field.
    pyautogui.press("tab", presses=2, interval=0.1)
    pyautogui.write(email, interval=0.02)
    pyautogui.press("tab")
    pyautogui.write(password, interval=0.04)
    pyautogui.press("tab")
    pyautogui.press("enter")
    time.sleep(3)
    log("Login submitted; browser left open on the system.")


def main() -> None:
    LOG_PATH.write_text("RPA started\n", encoding="utf-8")
    try:
        run_login(EMAIL, PASSWORD)
    except Exception as error:
        log(traceback.format_exc())
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("RPA login failed", str(error), parent=root)
        root.destroy()


if __name__ == "__main__":
    main()
