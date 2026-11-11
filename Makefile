check:
	python3 tools/channel.py validate
	python3 tools/check_catalog.py
	python3 -m unittest discover -s tests

.PHONY: check
