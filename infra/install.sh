#!/bin/bash

# Geo Dashboard - Turnkey Kubernetes Installer
# This script will install Kubernetes and deploy the Geo Dashboard on any server
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/geo-dashboard/main/infra/install.sh | bash
# Or: ./install.sh [--cluster-type=k3s|minikube|kubeadm] [--domain=your-domain.com] [--skip-cluster]

set -e

# Default configuration
CLUSTER_TYPE="k3s"  # k3s, minikube, or kubeadm
DOMAIN=""
SKIP_CLUSTER=false
NAMESPACE="geo-dashboard"
INSTALL_DIR="/opt/geo-dashboard"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

show_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
   ____             ____            _     _                         _ 
  / ___| ___  ___  |  _ \  __ _ ___| |__ | |__   ___   __ _ _ __ __| |
 | |  _ / _ \/ _ \ | | | |/ _` / __| '_ \| '_ \ / _ \ / _` | '__/ _` |
 | |_| |  __/ (_) || |_| | (_| \__ \ | | | |_) | (_) | (_| | | | (_| |
  \____|\___|\___/ |____/ \__,_|___/_| |_|_.__/ \___/ \__,_|_|  \__,_|
                                                                      
         Turnkey Kubernetes Deployment - Ready in Minutes!
EOF
    echo -e "${NC}"
}

parse_args() {
    for arg in "$@"; do
        case $arg in
            --cluster-type=*)
                CLUSTER_TYPE="${arg#*=}"
                shift
                ;;
            --domain=*)
                DOMAIN="${arg#*=}"
                shift
                ;;
            --skip-cluster)
                SKIP_CLUSTER=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                warn "Unknown argument: $arg"
                ;;
        esac
    done
}

show_help() {
    echo "Geo Dashboard - Turnkey Kubernetes Installer"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --cluster-type=TYPE    Kubernetes cluster type (k3s|minikube|kubeadm) [default: k3s]"
    echo "  --domain=DOMAIN        Domain name for ingress (optional)"
    echo "  --skip-cluster         Skip cluster installation (use existing cluster)"
    echo "  --help, -h             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Install with k3s"
    echo "  $0 --cluster-type=minikube           # Install with minikube"
    echo "  $0 --domain=geo.example.com          # Install with custom domain"
    echo "  $0 --skip-cluster                    # Use existing cluster"
    echo ""
    echo "Quick Install:"
    echo "  curl -sSL https://raw.githubusercontent.com/your-repo/geo-dashboard/main/infra/install.sh | bash"
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS="ubuntu"
        elif command -v yum &> /dev/null; then
            OS="centos"
        elif command -v dnf &> /dev/null; then
            OS="fedora"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        error "Unsupported operating system: $OSTYPE"
    fi
    
    log "Detected OS: $OS"
}

install_dependencies() {
    log "Installing dependencies..."
    
    case $OS in
        ubuntu)
            sudo apt-get update
            sudo apt-get install -y curl wget git jq
            ;;
        centos|fedora)
            if command -v dnf &> /dev/null; then
                sudo dnf install -y curl wget git jq
            else
                sudo yum install -y curl wget git jq
            fi
            ;;
        macos)
            if ! command -v brew &> /dev/null; then
                error "Homebrew is required on macOS. Please install it first."
            fi
            brew install curl wget git jq
            ;;
        *)
            warn "Please ensure curl, wget, git, and jq are installed"
            ;;
    esac
}

install_docker() {
    if command -v docker &> /dev/null; then
        log "Docker already installed"
        return
    fi
    
    log "Installing Docker..."
    
    case $OS in
        ubuntu)
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
            ;;
        centos|fedora)
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            sudo systemctl enable docker
            sudo systemctl start docker
            rm get-docker.sh
            ;;
        macos)
            warn "Please install Docker Desktop for Mac manually"
            ;;
    esac
}

install_kubectl() {
    if command -v kubectl &> /dev/null; then
        log "kubectl already installed"
        return
    fi
    
    log "Installing kubectl..."
    
    case $OS in
        ubuntu|linux)
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
            sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
            rm kubectl
            ;;
        macos)
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
            ;;
        centos|fedora)
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
            sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
            rm kubectl
            ;;
    esac
}

install_helm() {
    if command -v helm &> /dev/null; then
        log "Helm already installed"
        return
    fi
    
    log "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
}

install_k3s() {
    log "Installing k3s..."
    curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
    
    # Wait for k3s to be ready
    sleep 10
    
    # Set up kubeconfig
    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
    echo "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" >> ~/.bashrc
    
    # Verify installation
    kubectl get nodes
}

install_minikube() {
    log "Installing minikube..."
    
    case $OS in
        ubuntu|linux)
            curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
            sudo install minikube-linux-amd64 /usr/local/bin/minikube
            rm minikube-linux-amd64
            ;;
        macos)
            curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
            sudo install minikube-darwin-amd64 /usr/local/bin/minikube
            rm minikube-darwin-amd64
            ;;
    esac
    
    # Start minikube
    minikube start --driver=docker --cpus=4 --memory=8192
    
    # Enable addons
    minikube addons enable ingress
    minikube addons enable metrics-server
}

install_kubeadm() {
    log "Installing kubeadm cluster..."
    
    case $OS in
        ubuntu)
            # Install kubeadm, kubelet, kubectl
            sudo apt-get update
            sudo apt-get install -y apt-transport-https ca-certificates curl
            curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg
            echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
            sudo apt-get update
            sudo apt-get install -y kubelet kubeadm kubectl
            sudo apt-mark hold kubelet kubeadm kubectl
            
            # Initialize cluster
            sudo kubeadm init --pod-network-cidr=10.244.0.0/16
            
            # Set up kubeconfig
            mkdir -p $HOME/.kube
            sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
            sudo chown $(id -u):$(id -g) $HOME/.kube/config
            
            # Install CNI (Flannel)
            kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
            
            # Remove taint from master node (for single-node cluster)
            kubectl taint nodes --all node-role.kubernetes.io/control-plane-
            ;;
        *)
            error "kubeadm installation not supported on $OS yet"
            ;;
    esac
}

setup_cluster() {
    if [[ "$SKIP_CLUSTER" == "true" ]]; then
        log "Skipping cluster installation"
        return
    fi
    
    log "Setting up Kubernetes cluster with $CLUSTER_TYPE"
    
    case $CLUSTER_TYPE in
        k3s)
            install_k3s
            ;;
        minikube)
            install_minikube
            ;;
        kubeadm)
            install_kubeadm
            ;;
        *)
            error "Unsupported cluster type: $CLUSTER_TYPE"
            ;;
    esac
    
    # Wait for cluster to be ready
    log "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
}

download_manifests() {
    log "Downloading Geo Dashboard manifests..."
    
    sudo mkdir -p $INSTALL_DIR
    cd $INSTALL_DIR
    
    # Download the repository or use existing files
    if [[ -d "geo-dashboard" ]]; then
        cd geo-dashboard
        git pull
    else
        git clone https://github.com/your-repo/geo-dashboard.git
        cd geo-dashboard
    fi
    
    cd infra
}

create_namespace() {
    log "Creating namespace: $NAMESPACE"
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
}

setup_secrets() {
    log "Setting up secrets..."
    
    # Generate random passwords
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    DJANGO_SECRET_KEY=$(openssl rand -hex 50)
    
    # PostgreSQL secrets
    kubectl create secret generic postgres-secrets \
        --from-literal=POSTGRES_USER=geouser \
        --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        --from-literal=POSTGRES_DBNAME=geodashboard \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Core app secrets
    kubectl create secret generic core-secrets \
        --from-literal=DJANGO_SECRET_KEY="$DJANGO_SECRET_KEY" \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Save credentials for user
    cat > $INSTALL_DIR/credentials.txt << EOF
Geo Dashboard Credentials
========================
PostgreSQL Database:
  Host: postgres-service.$NAMESPACE.svc.cluster.local
  Port: 5432
  Database: geodashboard
  Username: geouser
  Password: $POSTGRES_PASSWORD

Django:
  Secret Key: $DJANGO_SECRET_KEY

Generated on: $(date)
EOF
    
    log "Credentials saved to $INSTALL_DIR/credentials.txt"
}

deploy_application() {
    log "Deploying Geo Dashboard application..."
    
    # Apply all manifests
    kubectl apply -k . -n $NAMESPACE
    
    # Wait for deployments
    log "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=600s deployment --all -n $NAMESPACE
}

setup_ingress() {
    log "Setting up ingress..."
    
    if [[ -z "$DOMAIN" ]]; then
        # Use default domain based on cluster type
        case $CLUSTER_TYPE in
            minikube)
                DOMAIN=$(minikube ip).nip.io
                ;;
            k3s)
                DOMAIN=$(hostname -I | awk '{print $1}').nip.io
                ;;
            *)
                DOMAIN="localhost"
                ;;
        esac
    fi
    
    # Create ingress manifest
    cat << EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: geo-dashboard-ingress
  namespace: $NAMESPACE
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: $DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: core-service
            port:
              number: 8000
      - path: /tiles
        pathType: Prefix
        backend:
          service:
            name: tiler-service
            port:
              number: 3001
EOF
    
    log "Ingress configured for domain: $DOMAIN"
}

show_completion_info() {
    log "🎉 Geo Dashboard installation completed successfully!"
    echo ""
    echo -e "${GREEN}Access Information:${NC}"
    echo -e "  🌐 Web Interface: http://$DOMAIN"
    echo -e "  📊 Admin Panel: http://$DOMAIN/admin"
    echo -e "  🗺️  Tiles Endpoint: http://$DOMAIN/tiles"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  kubectl get pods -n $NAMESPACE           # Check pod status"
    echo -e "  kubectl logs -f deployment/core-app -n $NAMESPACE  # View logs"
    echo -e "  kubectl port-forward svc/core-service 8000:8000 -n $NAMESPACE  # Port forward"
    echo ""
    echo -e "${YELLOW}Configuration Files:${NC}"
    echo -e "  📄 Credentials: $INSTALL_DIR/credentials.txt"
    echo -e "  📁 Install Directory: $INSTALL_DIR"
    echo ""
    
    if [[ "$CLUSTER_TYPE" == "minikube" ]]; then
        echo -e "${BLUE}Minikube Commands:${NC}"
        echo -e "  minikube dashboard                       # Open Kubernetes dashboard"
        echo -e "  minikube service list                    # List services"
        echo ""
    fi
}

# Main execution
main() {
    show_banner
    parse_args "$@"
    
    log "Starting Geo Dashboard installation..."
    log "Cluster Type: $CLUSTER_TYPE"
    log "Domain: ${DOMAIN:-auto-detect}"
    log "Skip Cluster: $SKIP_CLUSTER"
    
    detect_os
    install_dependencies
    install_docker
    install_kubectl
    install_helm
    
    setup_cluster
    download_manifests
    create_namespace
    setup_secrets
    deploy_application
    setup_ingress
    
    show_completion_info
}

# Handle script interruption
trap 'error "Installation interrupted"' INT TERM

# Run main function
main "$@" 