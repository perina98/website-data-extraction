BIN = extractor.js
DATA = data.json
CONFIG = config.json

TEST = ftest.py
OVERALL = overall.py

FOOTBALL = dataset/football
TSBOHEMIA = dataset/tsbohemia
SHOPS = dataset/shops
NEWS = dataset/news
NEWS3 = dataset/news3

all:
	node $(BIN) --data=$(DATA) --offline -bdg --noundef
test: datatest testall
datatest:
	node $(BIN) --data=$(FOOTBALL)/$(DATA) --config=$(FOOTBALL)/$(CONFIG) -o=$(FOOTBALL)/output/ --offline -bdg --noundef
	node $(BIN) --data=$(TSBOHEMIA)/$(DATA) --config=$(TSBOHEMIA)/$(CONFIG) -o=$(TSBOHEMIA)/output/ --offline --noundef -bd
	node $(BIN) --data=$(SHOPS)/$(DATA) --config=$(SHOPS)/$(CONFIG) -o=$(SHOPS)/output/ --offline -bdu --noundef
	node $(BIN) --data=$(NEWS)/$(DATA) --config=$(NEWS)/$(CONFIG) -o=$(NEWS)/output/ --offline -bdum
	node $(BIN) --data=$(NEWS3)/$(DATA) --config=$(NEWS3)/$(CONFIG) -o=$(NEWS3)/output/ --offline -dgm --noundef
testall:
	python $(TEST) football -o
	python $(TEST) tsbohemia -o
	python $(TEST) shops -o
	python $(TEST) news -o
	python $(TEST) news3 -o
	python $(OVERALL)
football:
	node $(BIN) --data=$(FOOTBALL)/$(DATA) --config=$(FOOTBALL)/$(CONFIG) -o=$(FOOTBALL)/output/ --offline -bdg --noundef
	python $(TEST) football
tsbohemia:
	node $(BIN) --data=$(TSBOHEMIA)/$(DATA) --config=$(TSBOHEMIA)/$(CONFIG) -o=$(TSBOHEMIA)/output/ --offline --noundef -bd
	python $(TEST) tsbohemia
shops:
	node $(BIN) --data=$(SHOPS)/$(DATA) --config=$(SHOPS)/$(CONFIG) -o=$(SHOPS)/output/ --offline -bdu --noundef
	python $(TEST) shops
news:
	node $(BIN) --data=$(NEWS)/$(DATA) --config=$(NEWS)/$(CONFIG) -o=$(NEWS)/output/ --offline -bdum
	python $(TEST) news
news3:
	node $(BIN) --data=$(NEWS3)/$(DATA) --config=$(NEWS3)/$(CONFIG) -o=$(NEWS3)/output/ --offline -dgm --noundef
	python $(TEST) news3