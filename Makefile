BIN = extractor.js
DATA = data.json
CONFIG = config.json
TEST = ftest.py
OVERALL = overall.py

all:
	node $(BIN) --data=$(DATA) -v

test: football tsbohemia shops news news3 testall

fix:
	node $(BIN) --data=dataset/shops/$(DATA) --config=dataset/shops/$(CONFIG) -o=dataset/shops/output/ --offline -bvdu -p=4 --noundef
	python $(TEST) shops

testall:
	python $(OVERALL)
	python $(TEST) football
	python $(TEST) tsbohemia
	python $(TEST) shops
	python $(TEST) news
	python $(TEST) news3
	python $(OVERALL)
football:
	node $(BIN) --data=dataset/football/$(DATA) --config=dataset/football/$(CONFIG) -o=dataset/football/output/ --offline -bdg --noundef
	python $(TEST) football
tsbohemia:
	node $(BIN) --data=dataset/tsbohemia/$(DATA) --config=dataset/tsbohemia/$(CONFIG) -o=dataset/tsbohemia/output/ --offline --noundef -bd
	python $(TEST) tsbohemia
shops:
	node $(BIN) --data=dataset/shops/$(DATA) --config=dataset/shops/$(CONFIG) -o=dataset/shops/output/ --offline -bdu --noundef
	python $(TEST) shops
news:
	node $(BIN) --data=dataset/news/$(DATA) --config=dataset/news/$(CONFIG) -o=dataset/news/output/ --offline -bdum
	python $(TEST) news
news3:
	node $(BIN) --data=dataset/news3/$(DATA) --config=dataset/news3/$(CONFIG) -o=dataset/news3/output/ --offline -dgm --noundef
	python $(TEST) news3