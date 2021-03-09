BIN = extractor.js
DATA = data.json
CONFIG = config.json

all:
	node $(BIN) --data=$(DATA) -v

football:
	node $(BIN) --data=dataset/football/$(DATA) --config=dataset/football/$(CONFIG) -o=dataset/football/output/ --offline -g
	python test.py football
bohemia:
	node $(BIN) --data=dataset/tsbohemia/$(DATA) --config=dataset/tsbohemia/$(CONFIG) -o=dataset/tsbohemia/output/ --offline -p=2 --noundef -d
	python test.py tsbohemia
shops:
	node $(BIN) --data=dataset/shops/$(DATA) --config=dataset/shops/$(CONFIG) -o=dataset/shops/output/ --offline
news:
	node $(BIN) --data=dataset/news/$(DATA) --config=dataset/news/$(CONFIG) -o=dataset/news/output/ --offline
