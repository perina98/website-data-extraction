Smart WwW data extractor
Brief:
    Based on simple input variables, extract multiple data from any website provided in the data file.

    Data file must be a proper json file and must contain these objects:
        urls                    - array of url strings to extract
        structure               - strucuture of items to extract
        items                   - how the items should be called in output json
        blacklist (optional)    - array of blacklisted strings

    Config file must be a proper json file and must contain these objects:
        maxFailRatio            - max fail ratio when determining result class
        format{}                - object containing regex format for each datatype defined in structure
        primary                 - primary object to search for

Usage: node extractor.js --data=data.json [--config=config.json] [-o=output/folder/] [-b] [-d] [-g] [-u] [-m] [-p] [-v] [-h] [--offline] [--noundef]
    
Default config is ./config.json
Default output folder is ./output

    Available parameters:
        --data    - specify json data file
        --config  - specify own config file
        --offline - set if scraped urls are saved offline / represented by file
        --noundef - delete undefined parts of object
        -o        - specify output location for extracted results
        -v        - verbose output to console
        -h        - prints help info
        -p        - starting ancestor index
        -d        - check if datatype already defined in current object
        -g        - try to guess item datatype based on previous results
        -b        - should blacklist be considered
        -u        - unify results
        -m        - strict regex matching check

  The number of items in "urls" is unlimited, number of items in "structure" must match number of items in "items"
