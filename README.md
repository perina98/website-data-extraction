# website-data-extraction
Methods of data extraction from websites
Smart WwW data extractor
Brief:
Based on simple input variables, extract multiple data from any website provided in the data file.
Data file must be proper json file and must contain these objects:
* urls
* structure
* items

Usage: node extractor.js --data=data.json [--config=config.json] [-v] [-h] [-o=output/folder/] [--offline] [--dataset_in=dataset/football] 
                        [--dataset_out=dataset/football_out] [--nowrite]
    Default config is config.json

    Available parameters:
        --data = Specify json data file
        --config = specify own config file, Default is config.json
        -v   - verbose output to console
        -h   - prints help info
        -o= output location, default ./output
        --offline   - set if scraped urls are saved offline / represented by file
        --nowrite  - if set, script will not output any file


  The number of items in "urls" is unlimited, number of items in "structure" must match number of items in "items"
