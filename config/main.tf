terraform {
  required_providers {
    keycloak = {
      source  = "mrparkers/keycloak"
      version = "~> 4.4.0"
    }
  }
}

provider "keycloak" {
  client_id     = "terraform"
  client_secret = "884e0f95-0f42-4a63-9b1f-94274655669e"
  url           = "http://localhost:8080"
}

resource "keycloak_realm" "step-up" {
  realm             = "step-up"
  enabled           = true
  display_name      = "Step Up"
  display_name_html = "<b>Step Up</b>"
}



resource "keycloak_user" "red" {
  realm_id = keycloak_realm.step-up.id
  username = "red"

  email      = "red@gmail.com"
  first_name = "Red"
  last_name  = "Alert"

  initial_password {
    value     = "red"
    temporary = false
  }
}

resource "keycloak_authentication_flow" "step-up-flow" {
  alias       = "stepUpFlow"
  realm_id    = keycloak_realm.step-up.id
  description = "browser based authentication"
}


resource "keycloak_authentication_execution" "browser-copy-cookie" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_flow.step-up-flow.alias
  authenticator     = "auth-cookie"
  requirement       = "ALTERNATIVE"
}


resource "keycloak_authentication_execution" "browser-copy-idp-redirect" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_flow.step-up-flow.alias
  authenticator     = "identity-provider-redirector"
  requirement       = "ALTERNATIVE"
  depends_on = [
    keycloak_authentication_execution.browser-copy-cookie
  ]
}

resource "keycloak_authentication_subflow" "step-up-flow-forms" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_flow.step-up-flow.alias
  alias             = "step-up-flow-forms"
  requirement       = "ALTERNATIVE"
  depends_on = [
    keycloak_authentication_execution.browser-copy-idp-redirect
  ]
}

resource "keycloak_authentication_subflow" "normal-level" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_subflow.step-up-flow-forms.alias
  alias             = "normalLevel"
  requirement       = "CONDITIONAL"
}

resource "keycloak_authentication_execution" "normal-level-condition" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_subflow.normal-level.alias
  authenticator     = "conditional-level-of-authentication"
  requirement       = "REQUIRED"
}

resource "keycloak_authentication_execution_config" "normal-level-config" {
  realm_id     = keycloak_realm.step-up.id
  execution_id = keycloak_authentication_execution.normal-level-condition.id
  alias        = "normal-level-config"
  config = {
    "loa-condition-level" = 1,
    "loa-max-age"         = 36000
  }
}

resource "keycloak_authentication_execution" "auth-username-password-form" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_subflow.normal-level.alias
  authenticator     = "auth-username-password-form"
  requirement       = "REQUIRED"
  depends_on = [
    keycloak_authentication_execution.normal-level-condition
  ]
}

resource "keycloak_authentication_subflow" "transfer-level" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_subflow.step-up-flow-forms.alias
  alias             = "transferLevel"
  requirement       = "CONDITIONAL"
  depends_on = [
    keycloak_authentication_subflow.normal-level
  ]
}

resource "keycloak_authentication_execution" "transfer-level-condition" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_subflow.transfer-level.alias
  authenticator     = "conditional-level-of-authentication"
  requirement       = "REQUIRED"
}

resource "keycloak_authentication_execution_config" "transfer-level-config" {
  realm_id     = keycloak_realm.step-up.id
  execution_id = keycloak_authentication_execution.transfer-level-condition.id
  alias        = "transfer-level-config"
  config = {
    "loa-condition-level" = 2,
    "loa-max-age"         = 0
  }
}

resource "keycloak_authentication_execution" "step-up-otp" {
  realm_id          = keycloak_realm.step-up.id
  parent_flow_alias = keycloak_authentication_subflow.transfer-level.alias
  authenticator     = "auth-otp-form"
  requirement       = "REQUIRED"
  depends_on = [
    keycloak_authentication_execution.transfer-level-condition
  ]
}


resource "keycloak_authentication_bindings" "step-up_bindings" {
  realm_id     = keycloak_realm.step-up.id
  browser_flow = keycloak_authentication_flow.step-up-flow.alias
}


resource "keycloak_openid_client" "step-up-client" {
  client_id   = "step-up-client"
  name        = "step-up-client"
  realm_id    = keycloak_realm.step-up.id
  description = "Step up authentication openid client"

  standard_flow_enabled    = true

  access_type = "PUBLIC"

  valid_redirect_uris = [
    "http://localhost:4200/"
  ]

  valid_post_logout_redirect_uris = [
    "http://localhost:4200/"
  ]

  web_origins = [
    "http://localhost:4200"
  ]

  authentication_flow_binding_overrides {
    browser_id = keycloak_authentication_flow.step-up-flow.id
  }

  extra_config = {
    "acr.loa.map" = "{\"normal\":\"1\",\"transfer\":\"2\"}"
  }
}
