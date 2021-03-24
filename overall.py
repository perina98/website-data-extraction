import os
try:
    file = open('overall','r+')
except:
    print("Run tests first by using ftest.py")
    exit(1)

arr = file.readlines()

precision = 0.0
recall = 0.0

for i in range(0,len(arr)):
    if i%2 == 0:
        precision += float(arr[i].strip())
    else:
        recall += float(arr[i].strip())

print("Overall results:")
print("Precision: ", precision/(len(arr)/2),"%")
print("Recall: ", recall/(len(arr)/2),"%")

file.close()
os.remove('overall')