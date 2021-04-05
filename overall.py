import os
try:
    file = open('overall','r+')
except:
    print("Run tests first by using ftest.py")
    exit(0)

arr = file.readlines()

precision = 0.0
recall = 0.0

for i in range(0,len(arr)):
    if i%2 == 0:
        precision += float(arr[i].strip())
    else:
        recall += float(arr[i].strip())

print("============================================================")
print("Overall average result:")
print("Datasets: 5")
print("Precision: ",  round(precision/(len(arr)/2),2),"%")
print("Recall: ",  round(recall/(len(arr)/2),2),"%")

file.close()
os.remove('overall')