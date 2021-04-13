import os
try:
    file = open('overall','r+')
except:
    print("Run tests first by using ftest.py")
    exit(0)

arr = file.readlines()

precision = 0.0
recall = 0.0
length = 0

for i in range(0,len(arr)):
    current = arr[i].strip().split(' ')
    length += int(current[2])

for i in range(0,len(arr)):
    current = arr[i].strip().split(' ')
    precision += float(current[0]) * (int(current[2])/length)
    recall += float(current[1]) * (int(current[2])/length)
    

print("============================================================")
print("Overall average result:")
print("Datasets: 5")
print("Webpages: ",  length)
print("Weighted results: ")
print("Precision: ",  round(precision,2),"%")
print("Recall: ",  round(recall,2),"%")

file.close()
os.remove('overall')