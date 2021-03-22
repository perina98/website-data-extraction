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


def printResult(precision,recall,file,ttype):
    typeinfo = ''
    if ttype == 2:
        typeinfo = '(No match in number of objects)'

    if precision > 90 and recall > 90:
        print(colored('OK','green'),str(precision)+"%",str(recall)+"%",filenames_o[file],colored(typeinfo,'red'), sep='\t')
    elif precision > 50 and recall > 50:
        print(colored('Fail','yellow'),str(precision)+"%",str(recall)+"%",filenames_o[file],colored(typeinfo,'red'), sep='\t')
    else:
        print(colored('Fail','red'),str(precision)+"%",str(recall)+"%",filenames_o[file],colored(typeinfo,'red'), sep='\t')
    return



def keyCheck(js1,js2,length,file):
    relevant_size = 0
    retrieved_size = 0
    irrelevant = 0
    for i in range(0,length):
        relevant_size += len(js1[i].keys())
        retrieved_size += len(js2[i].keys())
        for key in js2[i]:
            if key not in js1[i]:
                if file == 7:
                    print(key)
                    print(js1[i])
                irrelevant += 1
                continue
            if js1[i][key] != js2[i][key]:
                irrelevant += 1
    
    relevant = retrieved_size - irrelevant
    precision = round(((relevant / retrieved_size) * 100),2)
    recall = round(((relevant / relevant_size) * 100),2)

    printResult(precision,recall,file,1)
    return {'precision':precision,'recall':recall}



def objCheck(js1,js2,file):
    expsize = len(js1)
    outsize = len(js2)
    relevant_size = 0
    retrieved_size = 0
    irrelevant = 0
    for i in range(0,expsize):
        relevant_size += len(js1[i].keys())
    for i in range(0,outsize):
        retrieved_size += len(js2[i].keys())
    pos = 0
    for obj in js2:
        if pos >= expsize:
            irrelevant += len(obj.keys())
            pos += 1
            continue
        if obj not in js1:
            for key in obj:
                if key not in js1[pos]:
                    irrelevant += 1
                    continue
                if js1[pos][key] != js2[pos][key]:
                    irrelevant += 1
        pos += 1

    relevant = retrieved_size - irrelevant
    precision = round(((relevant / retrieved_size) * 100),2)
    recall = round(((relevant / relevant_size) * 100),2)
    printResult(precision,recall,file,2)
    return {'precision':precision,'recall':recall}




print('Status','Precision','Recall','File')

length = len(output)
average_precision = 0
average_recall = 0
for i in range(0,length):
    js1 = expected[i]
    js2 = output[i]
    if len(js1) == len(js2):
        obj = keyCheck(js1,js2,len(js1),i)
        average_precision += obj['precision']
        average_recall += obj['recall']
    else:
        obj = objCheck(js1,js2,i)
        average_precision += obj['precision']
        average_recall += obj['recall']

average_precision = round(average_precision / length,2)
average_recall = round(average_recall / length,2)

print("Overall results")
print("Precision: ",str(average_precision)+"%")
print("Recall: ",str(average_recall)+"%")