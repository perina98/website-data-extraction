BIN = extractor.js
DATA = data.json
CONFIG = config.json

all:
	node $(BIN) --data=$(DATA) -v

test: football bohemia

fix:
	node $(BIN) --data=dataset/football/$(DATA) --config=dataset/football/$(CONFIG) -o=dataset/football/output/ --offline -bdgv --noundef

football:
	node $(BIN) --data=dataset/football/$(DATA) --config=dataset/football/$(CONFIG) -o=dataset/football/output/ --offline -bdg --noundef
	python test.py football
bohemia:
	node $(BIN) --data=dataset/tsbohemia/$(DATA) --config=dataset/tsbohemia/$(CONFIG) -o=dataset/tsbohemia/output/ --offline -p=2 --noundef -bd
	python test.py tsbohemia
shops:
	node $(BIN) --data=dataset/shops/$(DATA) --config=dataset/shops/$(CONFIG) -o=dataset/shops/output/ --offline -bd -p=4 --noundef
	python test.py shops
shops2:
	node $(BIN) --data=dataset/shops2/$(DATA) --config=dataset/shops2/$(CONFIG) -o=dataset/shops2/output/ --offline -bd -p=2 --noundef
	python test.py shops2
news:
	node $(BIN) --data=dataset/news/$(DATA) --config=dataset/news/$(CONFIG) -o=dataset/news/output/ --offline -dvu -p=2
news3:
	node $(BIN) --data=dataset/news3/$(DATA) --config=dataset/news3/$(CONFIG) -o=dataset/news3/output/ --offline -dgvu -p=3 --noundef
