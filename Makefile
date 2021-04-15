BIN = src/extractor.js
DATA = data.json
CONFIG = config.json

TEST = tests/ftest.py
OVERALL = tests/overall.py

FOOTBALL = tests/dataset/football
TSBOHEMIA = tests/dataset/tsbohemia
SHOPS = tests/dataset/shops
NEWS = tests/dataset/news
NEWS3 = tests/dataset/news3

ZIP = xperin11.zip

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

windows-install:
	Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
	cinst nodejs.install
	npm i puppeteer
	npm i css.escape
	npm i minimist
linux-install:
	sudo apt install nodejs | sudo snap install node --classic
	npm i puppeteer
	npm i css.escape
	npm i minimist
clean:
	rm -rf $(ZIP)
	rm -rf ./$(FOOTBALL)/output ./$(FOOTBALL)/metadata.json
	rm -rf ./$(TSBOHEMIA)/output ./$(TSBOHEMIA)/metadata.json
	rm -rf ./$(SHOPS)/output ./$(SHOPS)/metadata.json
	rm -rf ./$(NEWS)/output ./$(NEWS)/metadata.json
	rm -rf ./$(NEWS3)/output ./$(NEWS3)/metadata.json
pack: clean
	zip -r $(ZIP) ./src/* ./tests/* ./INSTALLATION ./Makefile ./PREREQUISITES ./README.md
