terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 3.0"
    }
   
  }
  
  cloud {
    organization = "starktardis221b1"
    workspaces {
      name = "tardis"
    }
  }
  
}


module "frontend" {
    source                  = "./modules/frontend"
    site_domain             = var.site_domain
    cloudflare_api_token    = var.cloudflare_api_token
}
