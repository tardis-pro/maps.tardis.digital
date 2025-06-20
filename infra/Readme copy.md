
kubectl apply -f standard-storage-class.yaml 
kubectl delete services postgres-service
kubectl create secret generic postgres-secrets --from-literal=POSTGRES_USER=default --from-literal=POSTGRES_PASSWORD=default --from-literal=POSTGRES_DBNAME=core
   kubectl apply -f postgres-statefulset.yaml 
