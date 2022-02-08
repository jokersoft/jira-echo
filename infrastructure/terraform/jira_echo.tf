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
    version = "v0.0.1"
  }
}

resource "helm_release" "jira_echo" {
  name             = local.jira_echo.name
  chart            = "./charts/jira-echo"
  namespace        = kubernetes_namespace.bug_handling.metadata[0].name
  create_namespace = true

  values = [
    yamlencode({
      imagePullSecrets = [
        {
          name = kubernetes_secret.infra_docker_hub_credentials.metadata[0].name
        },
      ]

      replicaCount = 1

      image = {
        repository = "yarche/jira-echo"
        tag        = local.jira_echo.version
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
      env = [
        {
          name  = "JIRA_ECHO_VERSION"
          value = local.jira_echo.version
        },
        {
          name  = "JIRA_DNS"
          value = "comtravo.atlassian.net"
        },
        {
          # default target project, 10545 = "BUGS" project
          name  = "PROJECT_ID_DEFAULT"
          value = "10545"
        },
        {
          name  = "AUTHORIZATION_ENABLED"
          value = "1"
        },
        {
          name  = "JIRA_USER"
          value = "yaroslav.sklabinskyi@comtravo.com"
        },
        {
          name  = "JIRA_TOKEN"
          value = data.aws_ssm_parameter.jira_echo_secret_token.value
        },
        {
          name  = "SLACK_CHANNEL"
          value = "C0320ML1G65"
        },
        {
          name  = "SLACK_TOKEN"
          value = data.aws_ssm_parameter.jira_echo_slack_token.value
        },
      ]
    })
  ]
}
