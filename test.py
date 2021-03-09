import json
import sys
from termcolor import colored
from os import walk
from types import SimpleNamespace

testType = sys.argv[1]

_, _, filenames_o = next(walk('dataset/'+testType+'/output/'))
_, _, filenames_e = next(walk('dataset/'+testType+'/expected/'))

output = []
expected = []
for filename in filenames_o:
    with open('dataset/'+testType+'/output/'+filename,encoding="Latin-1") as json_file:
        output.append(json.load(json_file))
for filename in filenames_e:
    with open('dataset/'+testType+'/expected/'+filename,encoding="Latin-1") as json_file:
        expected.append(json.load(json_file))


length = len(output)

for x in range(0,length):
    out = json.dumps(output[x], sort_keys=True)
    exp = json.dumps(expected[x], sort_keys=True)
    if out == exp:
        print(colored('OK', 'green') , filenames_o[x])
    else:
        print(colored('ERROR', 'red') , filenames_o[x])