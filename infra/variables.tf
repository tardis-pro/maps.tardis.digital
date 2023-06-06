# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

variable "cloudflare_api_token" {
  type        = string
  description = "api token for the cloud flare"
}

variable "site_domain" {
  type        = string
  description = "The domain name to use for the static site"
}