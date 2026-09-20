VENV_BIN := .venv/bin
.PHONY: setup dev check smoke e2e
setup:
	python3.12 -m venv .venv
	$(VENV_BIN)/pip install -e '.[dev]'
	cd web && npm ci && npx playwright install chromium

dev:
	./scripts/dev.sh

check:
	$(VENV_BIN)/ruff check .
	$(VENV_BIN)/pyright
	$(VENV_BIN)/pytest
	./scripts/verify_e2e_db_guard.sh
	cd web && npm run check

smoke:
	./scripts/smoke_test.sh

e2e:
	./scripts/e2e.sh
