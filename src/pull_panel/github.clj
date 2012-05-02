(ns pull-panel.github
  (:require [clj-http.client :as client]
            [clj-json.core :as json]))

(defn fetch-login [token]
  ((clj-json.core/parse-string
    ((client/get (str "https://api.github.com/users?access_token=" token)
      {:accept :json :throw-exceptions false}) :body)) "login"))

(defn client-id []
  (get (System/getenv) "GITHUB_CLIENT_ID"))

(defn secret []
  (get (System/getenv) "GITHUB_SECRET"))

(defn fetch-access-token [code]
  "Fetch an access code from Github (used from callback url)"
  (((client/post "https://github.com/login/oauth/access_token"
                 { :form-params
                  {
                   :client_id (client-id)
                   :client_secret (secret)
                   :code code
                   }
                  :accept :json
                  }) :body) "access_token"))

(defn auth-url []
  (str "https://github.com/login/oauth/authorize?"
       "client_id=" (client-id) "&"
       "redirect_uri=https://pullpanel.herokuapp.com/auth/github-callback&"
       "scope=repo"))

(defn github-url []
  (get (System/getenv) "GITHUB_URL" "https://api.github.com/"))

(defn pull-url [watch token]
  (str (github-url) (watch :owner) "/" (watch :id) "/pulls?access_token=" token))

(defn pulls-for [watch token]
  [(watch :owner) (watch :repo) (json/parse-string ((client/get (pull-url watch token)  {:accept :json :throw-exceptions false}) :body))])

(defn all-pulls [watches token]
  (map #(pulls-for % token) watches))
