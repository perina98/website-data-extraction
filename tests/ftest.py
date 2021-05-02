#
# File: ftest.py
# Brief: Calculate precision and recall of given dataset
# Author: Lukáš Perina
# xlogin: xperin11
# Year: 2021
#

import json
import sys
from os import walk
from types import SimpleNamespace

# set testType as dataset_dir name and get filenames of output and expected
try:
    testType = sys.argv[1]
except:
    print("Usage: python ftest.py [dataset_dir]")
    exit()
try:
    _, _, filenames_o = next(walk('tests/dataset/'+testType+'/output/'))
    _, _, filenames_e = next(walk('tests/dataset/'+testType+'/expected/'))
    filenames_o.sort()
    filenames_e.sort()
except:
    print("Dataset_dir has to contain two folders: output and expected")
    exit(1)


# Initialize json arrays of outputed and expected data
# Returns initialized output and expected arrays
def init():
    output = []
    expected = []
    try:
        for filename in filenames_o:
            with open('tests/dataset/'+testType+'/output/'+filename,encoding="Latin-1") as json_file:
                output.append(json.load(json_file))
        for filename in filenames_e:
            with open('tests/dataset/'+testType+'/expected/'+filename,encoding="Latin-1") as json_file:
                expected.append(json.load(json_file))
    except:
        print("Exception occured while initializing json arrays")
        exit(1)
    
    if len(output) != len(expected):
        print("Inconsistent file count in dataset subfolders")
        exit(1)
    
    return output,expected


# Print result of test
def printResult(precision,recall,file,ttype):
    typeinfo = ''
    if ttype == 3:
        typeinfo = '(Failed)'
        print('Fail',str(precision)+"%",str(recall)+"%",filenames_o[file],typeinfo, sep='\t')
        return
    if ttype == 2:
        typeinfo = '(No match in number of objects)'
    if precision > 10 and recall > 10:
        print('OK',str(precision)+"%",str(recall)+"%",filenames_o[file],typeinfo, sep='\t')
    else:
        print('Fail',str(precision)+"%",str(recall)+"%",filenames_o[file],typeinfo, sep='\t')
    return


# Check json key-by-key, calculate precision and recall
# Returns precision and recall values
def keyCheck(js1,js2,length,file):
    relevant_size = 0
    retrieved_size = 0
    irrelevant = 0
    for i in range(0,length):
        relevant_size += len(js1[i].keys())
        retrieved_size += len(js2[i].keys())
        for key in js2[i]:
            if key not in js1[i]:
                irrelevant += 1
                continue
            if js1[i][key] != js2[i][key]:
                irrelevant += 1
    
    if retrieved_size == 0 or relevant_size == 0:
        precision = recall = 0
        printResult(precision,recall,file,3)
        return {'precision':precision,'recall':recall}

    relevant = retrieved_size - irrelevant
    precision = round(((relevant / retrieved_size) * 100),2)
    recall = round(((relevant / relevant_size) * 100),2)

    printResult(precision,recall,file,1)
    return {'precision':precision,'recall':recall}


# Check json object-by-object, calculate precision and recall
# Less accurate than key-by-key but only viable option
# Returns precision and recall values
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
        if obj not in js1:
            if pos >= expsize:
                irrelevant += len(obj.keys())
                pos += 1
                continue 
            for key in obj:
                if key not in js1[pos]:
                    irrelevant += 1
                    continue
                if js1[pos][key] != js2[pos][key]:
                    irrelevant += 1
        pos += 1
    
    if retrieved_size == 0 or relevant_size == 0:
        precision = recall = 0
        printResult(precision,recall,file,3)
        return {'precision':precision,'recall':recall}

    relevant = retrieved_size - irrelevant
    precision = round(((relevant / retrieved_size) * 100),2)
    recall = round(((relevant / relevant_size) * 100),2)
    printResult(precision,recall,file,2)
    return {'precision':precision,'recall':recall}


# Print average results
def averageResults(average_precision,average_recall,length):
    average_precision = round(average_precision / length,2)
    average_recall = round(average_recall / length,2)

    print("Overall results")
    print("Precision: ",str(average_precision)+"%")
    print("Recall: ",str(average_recall)+"%")
    if '-o' in sys.argv:
        overall = open("overall","a")
        overall.write(str(average_precision)+' '+str(average_recall)+' '+str(length)+'\n')


# main function, print header and loop test
def main():
    output,expected = init()
    print('Status','Precision','Recall','Domain')

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

    averageResults(average_precision,average_recall,length)


main()
