"""Проверка установки и импорта библиотек для ИИ-бэкенда."""

import importlib
import importlib.metadata
import subprocess
import sys


LIBRARIES = [
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("pydantic", "pydantic"),
    ("pydantic-settings", "pydantic_settings"),
    ("httpx", "httpx"),
    ("pytest", "pytest"),
    ("pytest-asyncio", "pytest_asyncio"),
    ("ruff", None),
]


def main():
    print(f"Python: {sys.version.split()[0]}")
    print(f"Интерпретатор: {sys.executable}\n")
    working = 0
    missing = []
    broken = []

    for package, module in LIBRARIES:
        try:
            version = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            print(f"[НЕТ] {package}: не установлен")
            missing.append(package)
            continue

        try:
            if module is not None:
                importlib.import_module(module)
            else:
                # Ruff проверяем как CLI-инструмент, а не только как модуль.
                subprocess.run(
                    [sys.executable, "-m", "ruff", "--version"],
                    capture_output=True,
                    text=True,
                    timeout=15,
                    check=True,
                )
            print(f"[OK] {package} {version}")
            working += 1
        except Exception as error:
            print(f"[ОШИБКА] {package} {version}: {type(error).__name__}: {error}")
            if isinstance(error, subprocess.CalledProcessError) and error.stderr:
                print(error.stderr.strip())
            broken.append(package)

    print(f"\nПроверку прошли: {working}/{len(LIBRARIES)}")
    print(f"Не установлены: {len(missing)}. С ошибками: {len(broken)}.")
    print("Проверяется импорт библиотек и запуск Ruff, а не работа всего сервиса.")
    
    if missing:
        packages = " ".join(missing)
        print("\nУстановить недостающие в этот Python (PowerShell):")
        print(f'& "{sys.executable}" -m pip install {packages}')
    return 1 if missing or broken else 0


if __name__ == "__main__":
    sys.exit(main())
