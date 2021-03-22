BIN = extractor.js
DATA = data.json
CONFIG = config.json

all:
	node $(BIN) --data=$(DATA) -v

test: football bohemia shops shops2 testall

fix:
	node $(BIN) --data=dataset/shops/$(DATA) --config=dataset/shops/$(CONFIG) -o=dataset/shops/output/ --offline -bvdu -p=4 --noundef
	python ftest.py shops

testall:
	python ftest.py football
	python ftest.py tsbohemia
	python ftest.py shops
	python ftest.py shops2
football:
	node $(BIN) --data=dataset/football/$(DATA) --config=dataset/football/$(CONFIG) -o=dataset/football/output/ --offline -bdg --noundef
	python ftest.py football
bohemia:
	node $(BIN) --data=dataset/tsbohemia/$(DATA) --config=dataset/tsbohemia/$(CONFIG) -o=dataset/tsbohemia/output/ --offline -p=2 --noundef -bd
	python ftest.py tsbohemia
shops:
	node $(BIN) --data=dataset/shops/$(DATA) --config=dataset/shops/$(CONFIG) -o=dataset/shops/output/ --offline -bdu -p=4 --noundef
	python ftest.py shops
shops2:
	node $(BIN) --data=dataset/shops2/$(DATA) --config=dataset/shops2/$(CONFIG) -o=dataset/shops2/output/ --offline -bd -p=2 --noundef
	python ftest.py shops2
news:
	node $(BIN) --data=dataset/news/$(DATA) --config=dataset/news/$(CONFIG) -o=dataset/news/output/ --offline -bdu -p=2
	python ftest.py news
news3:
	node $(BIN) --data=dataset/news3/$(DATA) --config=dataset/news3/$(CONFIG) -o=dataset/news3/output/ --offline -dgu -p=3 --noundef
	python ftest.py news3
