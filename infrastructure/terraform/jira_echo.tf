resource "kubernetes_namespace" "bug_handling" {
  metadata {
    name = "bug-handling"
  }
}

locals {
  jira_echo = {
    name = "jira-echo"
    fqdn = "jira-echo.${module.infra_vpc.public_subdomain}"
    url  = "https://jira-echo.${module.infra_vpc.public_subdomain}"
  }
}

resource "helm_release" "jira_echo" {
  name             = local.jira_echo.name
  chart            = "./charts/jira-echo"
  namespace        = kubernetes_namespace.bug_handling.metadata[0].name
  create_namespace = true

  values = [
    yamlencode({
      replicaCount = 1

      image = {
        repository = "nginx"
        tag        = "latest"
      }

      ingress = {
        enabled = true
        annotations = {
          "kubernetes.io/ingress.class"               = "alb"
          "alb.ingress.kubernetes.io/scheme"          = "internet-facing"
          "alb.ingress.kubernetes.io/listen-ports"    = jsonencode([{ HTTPS = 443 }])
          "alb.ingress.kubernetes.io/group.name"      = "infra-external"
          "alb.ingress.kubernetes.io/certificate-arn" = aws_acm_certificate.subdomain.arn
          "alb.ingress.kubernetes.io/target-type"     = "ip"
          "alb.ingress.kubernetes.io/success-codes"   = "200"
        }
        hosts = [
          {
            host = local.jira_echo.fqdn
            paths = [{
              path = "/*"
            }]
          }
        ]
      }
    })
  ]
}
